// GET    /api/v1/campaigns/:slug/donors/:donorId — view donor
// PUT    /api/v1/campaigns/:slug/donors/:donorId — edit donor
// DELETE /api/v1/campaigns/:slug/donors/:donorId — remove donor (organizer; blocked if has donations)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string; donorId: string }> };

async function getCtx(req: NextRequest, ctx: Ctx) {
    const user = await getAuthUserFromRequest(req);
    if (!user) return null;
    const { slug, donorId } = await ctx.params;
    const campaign = await prisma.campaign.findUnique({
        where:  { slug },
        select: {
            id:            true,
            status:        true,
            goal_type:     true,
            campaign_type: true,
            goal_amount:   true,
            total_raised:  true,
            members: {
                where:  { user_id: user.id },
                select: { id: true, roles: { select: { role: true } } },
            },
        },
    });
    if (!campaign) return null;
    const member = campaign.members[0];
    if (!member) return null;
    return { campaign, member, donorId };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
    const c = await getCtx(req, ctx);
    if (!c) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    const { campaign, member, donorId } = c;
    const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);

    const donor = await prisma.campaignDonor.findFirst({
        where: {
            id:          donorId,
            campaign_id: campaign.id,
            ...(!isOrganizer ? { assigned_member_id: member.id } : {}),
        },
        include: {
            assigned_member: { select: { id: true, first_name: true, last_name: true } },
            added_by_member: { select: { id: true, first_name: true, last_name: true, roles: { select: { role: true } } } },
            donations: {
                where:  { payment_status: "completed" },
                select: { amount: true, created_at: true },
            },
        },
    });

    if (!donor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ donor });
}

// ── PUT ───────────────────────────────────────────────────────────────────────

const putSchema = z.object({
    first_name:         z.string().min(1).max(100).optional(),
    last_name:          z.string().min(1).max(100).optional(),
    email:              z.string().email().max(255).transform(s => s.toLowerCase().trim()).nullable().optional(),
    phone:              z.string().max(20).optional().nullable(),
    assigned_member_id: z.string().uuid().optional().nullable(),
    // Suggested prefill amount (cents); null clears it. Clamped to goal − raised
    // for fixed-goal individual campaigns.
    prefill_amount_cents: z.number().int().min(0).max(100_000_000).nullable().optional(),
});

function clampPrefillCents(
    prefill: number | null,
    campaign: { goal_type: string | null; campaign_type: string | null; goal_amount: unknown; total_raised: unknown },
): number | null {
    if (prefill == null || prefill <= 0) return null;
    let cents = prefill;
    if (campaign.goal_type === "fixed" && campaign.campaign_type === "individual" && campaign.goal_amount != null) {
        const goalCents      = Math.round(Number(campaign.goal_amount)  * 100);
        const raisedCents    = Math.round(Number(campaign.total_raised) * 100);
        const remainingCents = Math.max(0, goalCents - raisedCents);
        cents = remainingCents > 0 ? Math.min(cents, remainingCents) : 0;
    }
    return cents > 0 ? cents : null;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
    const c = await getCtx(req, ctx);
    if (!c) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    const { campaign, member, donorId } = c;
    const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

    const { first_name, last_name, email, phone, assigned_member_id, prefill_amount_cents } = parsed.data;

    // Load the current donor (scoped) to enforce the edit rules server-side:
    // a contact field provided at add time is immutable (only a missing one can be
    // filled in), and the suggested amount can't change once the donor has paid.
    const current = await prisma.campaignDonor.findFirst({
        where: {
            id:          donorId,
            campaign_id: campaign.id,
            ...(!isOrganizer ? { assigned_member_id: member.id } : {}),
        },
        select: {
            email:     true,
            phone:     true,
            donations: { where: { payment_status: "completed" }, select: { id: true }, take: 1 },
        },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const hasPaid = current.donations.length > 0;

    const updateData: Record<string, unknown> = {};
    if (first_name  !== undefined) updateData.first_name  = first_name;
    if (last_name   !== undefined) updateData.last_name   = last_name;
    // Only settable when the field was empty at add time (fill a missing one).
    if (email !== undefined && !current.email) updateData.email = email;
    if (phone !== undefined && !current.phone) updateData.phone = phone;
    // The suggested amount is locked once the donor has donated.
    if (prefill_amount_cents !== undefined && !hasPaid) {
        updateData.prefill_amount_cents = clampPrefillCents(prefill_amount_cents, campaign);
    }
    if (isOrganizer && assigned_member_id !== undefined) {
        updateData.assigned_member_id = assigned_member_id;
    }

    await prisma.campaignDonor.update({ where: { id: donorId }, data: updateData });
    return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const c = await getCtx(req, ctx);
        if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { campaign, member, donorId } = c;
        const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (campaign.status === "completed") {
            return NextResponse.json(
                { error: "Donors cannot be removed from a completed campaign." },
                { status: 422 }
            );
        }

        // Block delete if donor has completed donations
        const hasDonations = await prisma.donation.findFirst({
            where:  { campaign_donor_id: donorId, payment_status: "completed" },
            select: { id: true },
        });
        if (hasDonations) {
            return NextResponse.json(
                { error: "Cannot remove a donor who has already donated." },
                { status: 409 }
            );
        }

        await prisma.campaignDonor.delete({
            where: { id: donorId, campaign_id: campaign.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("[DELETE donors/donorId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
