// GET  /api/v1/campaigns/:slug/members — paginated participant list (any member).
// POST /api/v1/campaigns/:slug/members — adds a participant (organizer only).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole, PaymentStatus } from "@/generated/prisma/enums";
import { sendParticipantCredentialsEmail, sendParticipantInviteEmail } from "@/lib/mail";
import { notifyParticipantAdded } from "@/lib/notifications";
import { generateUsername } from "@/lib/username";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function generatePassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789!@#$%^&*";
    return Array.from(crypto.randomBytes(10))
        .map((b) => chars[b % chars.length])
        .join("");
}

type Ctx = { params: Promise<{ slug: string }> };

const schema = z.object({
    first_name:        z.string().min(1).max(100),
    last_name:         z.string().min(1).max(100),
    email:             z.string().email().max(255).transform(s => s.toLowerCase().trim()).nullable().optional(),
    phone:             z.string().max(20).optional().nullable(),
    profile_photo_url: z.string().url().max(2048).nullable().optional(),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

// Paginated, ranked participant list. Ranking is by amount raised (desc), so the
// full member set is aggregated server-side and only the requested page is returned.
export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const sp     = req.nextUrl.searchParams;
        const skip   = Math.max(0, parseInt(sp.get("skip") ?? "0", 10) || 0);
        const take   = Math.min(100, Math.max(1, parseInt(sp.get("take") ?? "10", 10) || 10));
        const search = (sp.get("search") ?? "").trim().toLowerCase();
        const sort   = sp.get("sort") === "raised_asc" ? "asc" : "desc";

        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: { id: true, members: { where: { user_id: user.id }, select: { id: true } } },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (campaign.members.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const members = await prisma.campaignMember.findMany({
            where: { campaign_id: campaign.id, roles: { some: { role: MemberRole.participant } } },
            include: {
                roles:     { select: { role: true } },
                donations: { where: { payment_status: PaymentStatus.completed }, select: { amount: true } },
                _count:    { select: { donors: true } },
                user:      { select: { profile_photo_url: true, username: true } },
            },
        });

        const all = members
            .map((m) => ({
                id:              m.id,
                name:            `${m.first_name} ${m.last_name}`,
                email:           m.email,
                donorsAdded:     m._count.donors,
                targetDonors:    m.target_donors,
                raised:          m.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0),
                isOrganizer:     m.roles.some((r) => r.role === MemberRole.organizer),
                profilePhotoUrl: m.user?.profile_photo_url ?? null,
                username:        m.user?.username ?? null,
            }))
            .sort((a, b) => b.raised - a.raised);

        const maxRaised = all.length > 0 ? Math.max(...all.map((p) => p.raised)) : 0;
        const filtered  = search
            ? all.filter((p) => p.name.toLowerCase().includes(search) || (p.email ?? "").toLowerCase().includes(search))
            : all;
        const ordered = sort === "desc" ? filtered : [...filtered].reverse();

        return NextResponse.json({
            participants: ordered.slice(skip, skip + take),
            total:        filtered.length,
            maxRaised,
        });
    } catch (err) {
        console.error("[GET campaigns/slug/members]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id:              true,
                name:            true,
                status:          true,
                goal_amount:     true,
                end_date:        true,
                timezone:        true,
                org_display_name: true,
                members: {
                    where: { user_id: user.id },
                    select: { id: true, first_name: true, last_name: true, roles: { select: { role: true } } },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const myMember = campaign.members[0];
        const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
        }

        const { first_name, last_name, email, phone, profile_photo_url } = parsed.data;

        // Check for duplicate email in this campaign (only when email is provided)
        const existing = email
            ? await prisma.campaignMember.findUnique({
                where: { campaign_id_email: { campaign_id: campaign.id, email } },
                include: { roles: { select: { role: true } } },
            })
            : null;

        if (existing) {
            // If the organizer is adding themselves, promote to participant role
            if (existing.user_id === user.id) {
                const alreadyParticipant = existing.roles.some((r) => r.role === MemberRole.participant);
                if (alreadyParticipant) {
                    return NextResponse.json(
                        { error: "You are already listed as a participant in this campaign." },
                        { status: 409 }
                    );
                }
                // Add participant role and update name/phone; ensure invite_token is set
                const tokenUpdate = existing.invite_token
                    ? {}
                    : { invite_token: crypto.randomBytes(32).toString("hex") };
                await prisma.$transaction([
                    prisma.campaignMemberRole.create({
                        data: { member_id: existing.id, role: MemberRole.participant },
                    }),
                    prisma.campaignMember.update({
                        where: { id: existing.id },
                        data:  {
                            first_name, last_name,
                            phone: phone ?? existing.phone,
                            profile_photo_url: profile_photo_url ?? existing.profile_photo_url,
                            ...tokenUpdate,
                        },
                    }),
                ]);
                const updated = await prisma.campaignMember.findUnique({
                    where: { id: existing.id },
                    include: { roles: { select: { role: true } } },
                });

                if (campaign.status !== "draft") {
                    const organizerName = myMember
                        ? `${myMember.first_name} ${myMember.last_name}`
                        : "Your organizer";
                    notifyParticipantAdded(
                        campaign.id,
                        existing.id,
                        organizerName,
                        campaign.name ?? "the campaign",
                    ).catch(console.error);

                    if (existing.email) {
                        sendParticipantInviteEmail({
                            to:             existing.email,
                            firstName:      first_name,
                            campaignName:   campaign.name ?? "a campaign",
                            organizerName,
                            orgDisplayName: campaign.org_display_name,
                            goalAmount:     campaign.goal_amount ? Number(campaign.goal_amount) : null,
                            endDate:        campaign.end_date?.toISOString() ?? null,
                            timezone:       campaign.timezone,
                            loginUrl:       `${APP_URL}/login`,
                            campaignUrl:    `${APP_URL}/campaigns/${slug}`,
                        }).catch(console.error);
                    }
                }

                return NextResponse.json({ member: JSON.parse(JSON.stringify(updated)) }, { status: 201 });
            }
            return NextResponse.json(
                { error: "A participant with this email is already in the campaign." },
                { status: 409 }
            );
        }

        const inviteToken = crypto.randomBytes(32).toString("hex");

        const member = await prisma.campaignMember.create({
            data: {
                campaign_id:  campaign.id,
                first_name,
                last_name,
                email:        email ?? null,
                phone:        phone ?? null,
                profile_photo_url: profile_photo_url ?? null,
                invite_token: inviteToken,
                roles: {
                    create: { role: MemberRole.participant },
                },
            },
            include: { roles: { select: { role: true } } },
        });

        // Send account + invite emails only after launch — not during draft wizard
        if (email && campaign.status !== "draft") {
            const organizerName = myMember
                ? `${myMember.first_name} ${myMember.last_name}`
                : "Campaign Organizer";
            const loginUrl  = `${APP_URL}/login`;
            const goalAmount = campaign.goal_amount ? Number(campaign.goal_amount) : null;

            (async () => {
                try {
                    // Check if a user account already exists for this email
                    const existingUser = await prisma.user.findUnique({ where: { email } });

                    let sendCredentials = false;
                    let generatedPassword: string | null = null;

                    if (existingUser) {
                        // Link the member to the existing account if not already linked
                        if (!member.user_id) {
                            await prisma.campaignMember.update({
                                where: { id: member.id },
                                data:  { user_id: existingUser.id, joined_at: new Date() },
                            });
                        }
                        // Existing user — they know their password, no credentials email
                    } else {
                        // Create a new account
                        generatedPassword = generatePassword();
                        const password_hash = await bcrypt.hash(generatedPassword, 12);
                        const username = await generateUsername(first_name, last_name);
                        const newUser = await prisma.user.create({
                            data: { first_name, last_name, email, password_hash, username, profile_photo_url: profile_photo_url ?? null },
                        });
                        await prisma.campaignMember.update({
                            where: { id: member.id },
                            data:  { user_id: newUser.id, joined_at: new Date() },
                        });
                        sendCredentials = true;
                    }

                    if (sendCredentials) {
                        await sendParticipantCredentialsEmail({
                            to:        email,
                            firstName: first_name,
                            password:  generatedPassword,
                            loginUrl,
                        });
                    }

                    await sendParticipantInviteEmail({
                        to:             email,
                        firstName:      first_name,
                        campaignName:   campaign.name ?? "a campaign",
                        organizerName,
                        orgDisplayName: campaign.org_display_name,
                        goalAmount,
                        endDate:        campaign.end_date?.toISOString() ?? null,
                        timezone:       campaign.timezone,
                        loginUrl,
                        campaignUrl:    `${APP_URL}/campaigns/${slug}`,
                    });
                } catch (err) {
                    console.error("[POST members] email error", err);
                }
            })();
        }

        if (campaign.status !== "draft") {
            const organizerName = myMember
                ? `${myMember.first_name} ${myMember.last_name}`
                : "Your organizer";
            notifyParticipantAdded(
                campaign.id,
                member.id,
                organizerName,
                campaign.name ?? "the campaign",
            ).catch(console.error);
        }

        return NextResponse.json({ member: JSON.parse(JSON.stringify(member)) }, { status: 201 });
    } catch (err) {
        console.error("[POST campaigns/slug/members]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
