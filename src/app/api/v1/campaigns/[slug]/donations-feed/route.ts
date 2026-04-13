// GET /api/v1/campaigns/[slug]/donations-feed?skip=0&take=10
// Returns paginated completed donations for the live feed.
// Accessible to any authenticated campaign member.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { PaymentStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
        const take = Math.min(50, Math.max(1, parseInt(searchParams.get("take") ?? "10", 10)));

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id: true,
                members: {
                    where: { user_id: user.id },
                    select: { id: true },
                },
            },
        });

        if (!campaign || campaign.members.length === 0) {
            return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
        }

        const [donations, total] = await Promise.all([
            prisma.donation.findMany({
                where:   { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
                orderBy: { created_at: "desc" },
                skip,
                take,
                select: {
                    id:                 true,
                    amount:             true,
                    donor_display_name: true,
                    donor_first_name:   true,
                    donor_last_name:    true,
                    is_anonymous:       true,
                    created_at:         true,
                },
            }),
            prisma.donation.count({
                where: { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
            }),
        ]);

        return NextResponse.json({
            donations: donations.map((d) => ({
                id:                 d.id,
                amount:             d.amount.toString(),
                donor_display_name: d.donor_display_name,
                donor_first_name:   d.donor_first_name,
                donor_last_name:    d.donor_last_name,
                is_anonymous:       d.is_anonymous,
                created_at:         d.created_at.getTime(),
            })),
            total,
        });
    } catch (err) {
        console.error("[GET donations-feed]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
