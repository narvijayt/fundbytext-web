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
            id:      true,
            status:  true,
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
    email:              z.string().email().max(255).optional().nullable(),
    phone:              z.string().max(20).optional().nullable(),
    assigned_member_id: z.string().uuid().optional().nullable(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
    const c = await getCtx(req, ctx);
    if (!c) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    const { campaign, member, donorId } = c;
    const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

    const { first_name, last_name, email, phone, assigned_member_id } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (first_name  !== undefined) updateData.first_name  = first_name;
    if (last_name   !== undefined) updateData.last_name   = last_name;
    if (email       !== undefined) updateData.email       = email;
    if (phone       !== undefined) updateData.phone       = phone;
    if (isOrganizer && assigned_member_id !== undefined) {
        updateData.assigned_member_id = assigned_member_id;
    }

    const updated = await prisma.campaignDonor.updateMany({
        where: {
            id:          donorId,
            campaign_id: campaign.id,
            ...(!isOrganizer ? { assigned_member_id: member.id } : {}),
        },
        data: updateData,
    });

    if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
