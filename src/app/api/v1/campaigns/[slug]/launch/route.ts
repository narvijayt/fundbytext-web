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
import { sendParticipantCredentialsEmail, sendParticipantInviteEmail } from "@/lib/mail";

function generatePassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789!@#$%^&*";
    return Array.from(crypto.randomBytes(16))
        .map((b) => chars[b % chars.length])
        .join("");
}

type Ctx = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

        const now = new Date();
        const newStatus =
            campaign.start_date && campaign.start_date > now
                ? CampaignStatus.upcoming
                : CampaignStatus.active;

        const updated = await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: newStatus },
            select: { slug: true, status: true },
        });

        // ── Create accounts for participants who don't have one, then email ──
        const organizerName = myMember
            ? `${myMember.first_name} ${myMember.last_name}`
            : "Campaign Organizer";

        const participants = campaign.members.filter(
            (m) => m.roles.some((r) => r.role === MemberRole.participant)
        );

        const goalAmount = campaign.goal_amount ? Number(campaign.goal_amount) : null;
        const loginUrl   = `${APP_URL}/login`;

        // Resolve each participant's account (create if missing) and collect credentials
        const organizerUserId = myMember?.user_id;

        const participantsWithCreds = await Promise.all(
            participants.map(async (p) => {
                if (p.user_id) {
                    // Already has an account — don't reset password
                    return { ...p, generatedPassword: null as string | null, skipEmail: p.user_id === organizerUserId };
                }

                // Check if a user already exists for this email (edge case)
                const existing = await prisma.user.findUnique({ where: { email: p.email } });
                if (existing) {
                    await prisma.campaignMember.update({
                        where: { id: p.id },
                        data:  { user_id: existing.id, joined_at: new Date() },
                    });
                    return { ...p, generatedPassword: null as string | null, skipEmail: existing.id === organizerUserId };
                }

                // Create a new account with a generated password
                const password      = generatePassword();
                const password_hash = await bcrypt.hash(password, 12);
                const newUser = await prisma.user.create({
                    data: {
                        first_name:    p.first_name,
                        last_name:     p.last_name,
                        email:         p.email,
                        password_hash,
                    },
                });
                await prisma.campaignMember.update({
                    where: { id: p.id },
                    data:  { user_id: newUser.id, joined_at: new Date() },
                });
                return { ...p, generatedPassword: password, skipEmail: false };
            })
        );

        await Promise.allSettled(
            participantsWithCreds
                .filter((p) => !p.skipEmail)
                .flatMap((p) => [
                    // Email 1: login credentials
                    sendParticipantCredentialsEmail({
                        to:        p.email,
                        firstName: p.first_name,
                        password:  p.generatedPassword,
                        loginUrl,
                    }),
                    // Email 2: campaign welcome + login page link
                    sendParticipantInviteEmail({
                        to:             p.email,
                        firstName:      p.first_name,
                        campaignName:   campaign.name!,
                        organizerName,
                        orgDisplayName: campaign.org_display_name,
                        goalAmount,
                        endDate:        campaign.end_date?.toISOString() ?? null,
                        loginUrl,
                        campaignUrl:    `${APP_URL}/campaigns/${slug}`,
                    }),
                ])
        );

        return NextResponse.json({ campaign: updated });
    } catch (err) {
        console.error("[POST campaigns/slug/launch]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
