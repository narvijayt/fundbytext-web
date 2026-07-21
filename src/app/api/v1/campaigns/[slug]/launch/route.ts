// POST /api/v1/campaigns/:slug/launch
// Transitions a draft campaign to upcoming (future start) or active (past/no start).
// Validates minimum required fields before launching.
// Sends a participant invite email to every participant after a successful launch.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole, CampaignStatus } from "@/generated/prisma/enums";
import { sendParticipantCredentialsEmail, sendParticipantInviteEmail, sendDonorInviteEmail } from "@/lib/mail";
import { notifyCampaignLaunched, notifyCampaignActive, notifyParticipantAdded, broadcastCampaignActive } from "@/lib/notifications";
import { publishStatusChange } from "@/lib/ably";
import { APP_URL } from "@/lib/app-url";
import { isOrgNameTaken } from "@/lib/org-name";

/* Same shape as the members route's copy, and module-scope for the same reason:
   a local `const chars` captured by a `.map()` arrow got dropped by the
   production minifier there, throwing "ReferenceError: chars is not defined".
   This copy happened to survive minification, but it was the identical pattern
   — so it's fixed here too rather than left as a latent bug. */
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789!@#$%^&*";

function generatePassword(): string {
    const bytes = crypto.randomBytes(10);
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
        out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
    }
    return out;
}

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            include: {
                payout: true,
                members: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        profile_photo_url: true,
                        invite_token: true,
                        roles: { select: { role: true } },
                        user_id: true,
                    },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const myMember = campaign.members.find((m) => m.user_id === user.id);
        const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (campaign.status !== CampaignStatus.draft) {
            return NextResponse.json(
                { error: "Only draft campaigns can be launched." },
                { status: 422 }
            );
        }

        // Minimum required fields
        const missing: string[] = [];
        if (!campaign.name)      missing.push("Campaign name");
        if (!campaign.goal_type) missing.push("Goal type");
        if (!campaign.end_date)  missing.push("End date");
        if (!campaign.payout)    missing.push("Payout address");

        if (missing.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missing.join(", ")}.` },
                { status: 422 }
            );
        }

        // Don't launch a campaign whose end date has already passed.
        if (campaign.end_date && campaign.end_date.getTime() <= Date.now()) {
            return NextResponse.json(
                { error: "End date must be in the future. Update the campaign duration before launching." },
                { status: 422 }
            );
        }

        const now = new Date();
        const newStatus =
            campaign.start_date && campaign.start_date > now
                ? CampaignStatus.upcoming
                : CampaignStatus.active;

        // ── Organization record — create once on first org campaign launch ─────
        let organizationId: string | undefined;
        if (campaign.campaign_type === "organization" && campaign.org_display_name) {
            const existingOrg = await prisma.organization.findUnique({
                where:  { created_by: user.id },
                select: { id: true },
            });
            if (existingOrg) {
                organizationId = existingOrg.id;
            } else {
                // Last line of defence before the name becomes a real organization:
                // `organizations.name` has no DB uniqueness, so without this two
                // accounts could launch under the same name.
                if (await isOrgNameTaken(campaign.org_display_name, user.id)) {
                    return NextResponse.json(
                        { error: "That organization name is already taken. Please choose another." },
                        { status: 409 },
                    );
                }
                const newOrg = await prisma.organization.create({
                    data: {
                        created_by:   user.id,
                        name:         campaign.org_display_name,
                        invite_token: crypto.randomBytes(32).toString("hex"),
                    },
                });
                organizationId = newOrg.id;
            }
        }

        const updated = await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status:          newStatus,
                visibility:      "public",
                ...(organizationId ? { organization_id: organizationId } : {}),
            },
            select: { slug: true, status: true },
        });

        // ── Create accounts for participants who don't have one, then email ──
        const organizerName = myMember
            ? `${myMember.first_name} ${myMember.last_name}`
            : "Campaign Organizer";

        const participants = campaign.members.filter(
            (m) => m.roles.some((r) => r.role === MemberRole.participant)
        );

        // ── Notifications + real-time signal ────────────────────────────────
        notifyCampaignLaunched(campaign.id).catch(console.error);
        if (newStatus === CampaignStatus.active) {
            notifyCampaignActive(campaign.id).catch(console.error);
            const participantIds = participants.map((p) => p.id);
            broadcastCampaignActive(campaign.id, participantIds).catch(console.error);
        }
        // Notify the marketing page (draft preview + any future visitors) that
        // the campaign is now live so it can refresh immediately.
        publishStatusChange(slug, newStatus).catch(console.error);

        const goalAmount = campaign.goal_amount ? Number(campaign.goal_amount) : null;
        const loginUrl   = `${APP_URL}/login`;

        // Resolve each participant's account (create if missing) and collect credentials
        const organizerUserId = myMember?.user_id;

        const participantsWithCreds = await Promise.all(
            participants.map(async (p) => {
                // No email → can't send anything
                if (!p.email) {
                    return { ...p, generatedPassword: null as string | null, sendCredentials: false, sendInvite: false };
                }

                if (p.user_id) {
                    // Already has a linked account — no credentials email needed, but still send invite
                    // Exception: don't email the organizer themselves
                    const isOrganizer = p.user_id === organizerUserId;
                    return { ...p, generatedPassword: null as string | null, sendCredentials: false, sendInvite: !isOrganizer };
                }

                // Check if a user already exists for this email (edge case: account exists but not linked)
                const existing = await prisma.user.findUnique({ where: { email: p.email } });
                if (existing) {
                    await prisma.campaignMember.update({
                        where: { id: p.id },
                        data:  { user_id: existing.id, joined_at: new Date() },
                    });
                    const isOrganizer = existing.id === organizerUserId;
                    // Existing user — they know their password, just send the invite
                    return { ...p, generatedPassword: null as string | null, sendCredentials: false, sendInvite: !isOrganizer };
                }

                // Brand-new user — create account, generate password, send both emails
                const password      = generatePassword();
                const password_hash = await bcrypt.hash(password, 12);
                const newUser = await prisma.user.create({
                    data: {
                        first_name:    p.first_name,
                        last_name:     p.last_name,
                        email:         p.email,
                        password_hash,
                        profile_photo_url: p.profile_photo_url ?? null,
                    },
                });
                await prisma.campaignMember.update({
                    where: { id: p.id },
                    data:  { user_id: newUser.id, joined_at: new Date() },
                });
                return { ...p, generatedPassword: password, sendCredentials: true, sendInvite: true };
            })
        );

        const emailTasks: Promise<void>[] = [];

        for (const p of participantsWithCreds) {
            if (!p.email) continue;

            // Credentials email — only for brand-new users
            if (p.sendCredentials) {
                emailTasks.push(
                    sendParticipantCredentialsEmail({
                        to:        p.email,
                        firstName: p.first_name,
                        password:  p.generatedPassword,
                        loginUrl,
                    })
                );
            }

            // Campaign participation email — all participants with an email except the organizer
            if (p.sendInvite) {
                emailTasks.push(
                    sendParticipantInviteEmail({
                        to:             p.email,
                        firstName:      p.first_name,
                        campaignName:   campaign.name!,
                        organizerName,
                        orgDisplayName: campaign.org_display_name,
                        goalAmount,
                        endDate:        campaign.end_date?.toISOString() ?? null,
                        timezone:       campaign.timezone,
                        loginUrl,
                        campaignUrl:    `${APP_URL}/campaigns/${slug}`,
                    })
                );
            }
        }

        await Promise.allSettled(emailTasks);

        // ── Notify all participants that they've been added ──────────────────
        // Participants added during the draft phase never received this notification
        // (the members route skips it for drafts). Fire it now on launch.
        for (const p of participants) {
            notifyParticipantAdded(
                campaign.id,
                p.id,
                organizerName,
                campaign.name ?? "the campaign",
            ).catch(console.error);
        }

        // ── Send donor invite emails to all pre-added donors ─────────────────
        const donors = await prisma.campaignDonor.findMany({
            where:  { campaign_id: campaign.id, email: { not: null } },
            select: {
                first_name:      true,
                email:           true,
                invite_token:    true,
                assigned_member: { select: { invite_token: true, first_name: true, last_name: true } },
            },
        });

        const donorEmailTasks = donors.map((d) => {
            if (!d.email) return Promise.resolve();
            const senderName = d.assigned_member
                ? `${d.assigned_member.first_name} ${d.assigned_member.last_name}`
                : organizerName;
            const refPart = d.assigned_member?.invite_token
                ? `?ref=${d.assigned_member.invite_token}&donor=${d.invite_token}`
                : `?donor=${d.invite_token}`;
            return sendDonorInviteEmail({
                to:           d.email,
                firstName:    d.first_name,
                campaignName: campaign.name ?? "a fundraising campaign",
                senderName,
                story:        campaign.story,
                goalAmount:   campaign.goal_amount ? Number(campaign.goal_amount) : null,
                endDate:      campaign.end_date?.toISOString() ?? null,
                timezone:     campaign.timezone,
                campaignUrl:  `${APP_URL}/campaigns/${slug}${refPart}`,
            }).catch((err) => console.error("[sendDonorInviteEmail]", err));
        });

        await Promise.allSettled(donorEmailTasks);

        return NextResponse.json({ campaign: updated });
    } catch (err) {
        console.error("[POST campaigns/slug/launch]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
