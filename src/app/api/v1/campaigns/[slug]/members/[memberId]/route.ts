// GET    /api/v1/campaigns/:slug/members/:memberId — view member details (organizer)
// PATCH  /api/v1/campaigns/:slug/members/:memberId — update name / contact / target_donors (organizer)
// DELETE /api/v1/campaigns/:slug/members/:memberId — remove participant (organizer, not self)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string; memberId: string }> };

async function getCtx(req: NextRequest, ctx: Ctx) {
    const user = await getAuthUserFromRequest(req);
    if (!user) return null;
    const { slug, memberId } = await ctx.params;
    const campaign = await prisma.campaign.findUnique({
        where:  { slug },
        select: {
            id:      true,
            status:  true,
            members: {
                select: { id: true, user_id: true, roles: { select: { role: true } } },
            },
        },
    });
    if (!campaign) return null;
    const myMember = campaign.members.find((m) => m.user_id === user.id);
    if (!myMember) return null;
    return { campaign, myMember, memberId };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
    const c = await getCtx(req, ctx);
    if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isOrganizer = c.myMember.roles.some((r) => r.role === MemberRole.organizer);
    if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const member = await prisma.campaignMember.findFirst({
        where:   { id: c.memberId, campaign_id: c.campaign.id },
        include: {
            roles:     { select: { role: true } },
            donations: {
                where:   { payment_status: "completed" },
                orderBy: { created_at: "desc" },
                select:  {
                    id:                 true,
                    amount:             true,
                    donor_display_name: true,
                    donor_first_name:   true,
                    donor_last_name:    true,
                    is_anonymous:       true,
                    created_at:         true,
                },
            },
            _count:    { select: { donors: true } },
            user:      { select: { profile_photo_url: true, username: true } },
        },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ member });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
    target_donors:     z.number().int().min(0).optional(),
    first_name:        z.string().min(1).max(100).optional(),
    last_name:         z.string().min(1).max(100).optional(),
    email:             z.string().email().max(255).transform(s => s.toLowerCase().trim()).nullable().optional(),
    phone:             z.string().max(20).nullable().optional(),
    profile_photo_url: z.string().url().max(2048).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
    const c = await getCtx(req, ctx);
    if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isOrganizer = c.myMember.roles.some((r) => r.role === MemberRole.organizer);
    if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

    const updateData: Record<string, unknown> = {};
    if (parsed.data.target_donors     !== undefined) updateData.target_donors     = parsed.data.target_donors;
    if (parsed.data.first_name        !== undefined) updateData.first_name        = parsed.data.first_name.trim();
    if (parsed.data.last_name         !== undefined) updateData.last_name         = parsed.data.last_name.trim();
    if (parsed.data.phone             !== undefined) updateData.phone             = parsed.data.phone?.trim() || null;
    if (parsed.data.profile_photo_url !== undefined) updateData.profile_photo_url = parsed.data.profile_photo_url;
    if (parsed.data.email             !== undefined) {
        // Editing the email must not collide with another member in the same campaign
        // (the campaign_id + email pair is unique).
        if (parsed.data.email) {
            const clash = await prisma.campaignMember.findUnique({
                where:  { campaign_id_email: { campaign_id: c.campaign.id, email: parsed.data.email } },
                select: { id: true },
            });
            if (clash && clash.id !== c.memberId) {
                return NextResponse.json(
                    { error: "A participant with this email is already in the campaign." },
                    { status: 409 }
                );
            }
        }
        updateData.email = parsed.data.email;
    }

    await prisma.campaignMember.updateMany({
        where: { id: c.memberId, campaign_id: c.campaign.id },
        data:  updateData,
    });

    // Keep the participant's user account in sync — the member photo IS their
    // account profile photo (they can change it later from their dashboard).
    if (parsed.data.profile_photo_url !== undefined) {
        const target = c.campaign.members.find((m) => m.id === c.memberId);
        if (target?.user_id) {
            await prisma.user.update({
                where: { id: target.user_id },
                data:  { profile_photo_url: parsed.data.profile_photo_url },
            }).catch(() => {});
        }
    }

    return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const c = await getCtx(req, ctx);
        if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const isOrganizer = c.myMember.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (c.campaign.status === "completed") {
            return NextResponse.json(
                { error: "Participants cannot be removed from a completed campaign." },
                { status: 422 }
            );
        }

        const target = c.campaign.members.find((m) => m.id === c.memberId);
        if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

        const targetIsOrganizer  = target.roles.some((r) => r.role === MemberRole.organizer);
        const targetIsParticipant = target.roles.some((r) => r.role === MemberRole.participant);

        // Block if they have completed donations attributed to them
        const hasDonations = await prisma.donation.findFirst({
            where:  { member_id: c.memberId, payment_status: "completed" },
            select: { id: true },
        });
        if (hasDonations) {
            return NextResponse.json(
                { error: "Cannot remove a participant who has received donations." },
                { status: 409 }
            );
        }

        // Block if they have any donors assigned to them
        const hasAssignedDonors = await prisma.campaignDonor.findFirst({
            where:  { assigned_member_id: c.memberId, campaign_id: c.campaign.id },
            select: { id: true },
        });
        if (hasAssignedDonors) {
            return NextResponse.json(
                { error: "Cannot remove a participant who has donors assigned to them." },
                { status: 409 }
            );
        }

        if (targetIsOrganizer && targetIsParticipant) {
            // Organizer removing their own participant role — keep member record, just drop the role
            await prisma.$transaction([
                prisma.campaignNotification.deleteMany({
                    where: { campaign_id: c.campaign.id, recipient_member_id: c.memberId },
                }),
                prisma.campaignMemberRole.deleteMany({
                    where: { member_id: c.memberId, role: MemberRole.participant },
                }),
            ]);
        } else if (targetIsOrganizer) {
            return NextResponse.json({ error: "Cannot remove a campaign organizer." }, { status: 422 });
        } else {
            await prisma.$transaction([
                prisma.campaignNotification.deleteMany({
                    where: { campaign_id: c.campaign.id, recipient_member_id: c.memberId },
                }),
                prisma.campaignMember.delete({ where: { id: c.memberId } }),
            ]);
        }

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("[DELETE members/memberId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
