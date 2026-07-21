// GET /api/v1/campaigns/[slug]/public-donations?skip=0&take=12
// Paginated completed donations for the PUBLIC campaign page's live feed.
// No session required — this is what anonymous visitors already see rendered
// into the page; this route just continues the list as they scroll.
//
// Deliberately separate from donations-feed, which is the organizer view: that
// one returns donor_first_name/donor_last_name even for anonymous donations so
// the dashboard can reveal who gave anonymously. Exposing that shape publicly
// would leak real names, so this route resolves display_name server-side and
// never returns the raw name fields.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const { slug } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
        const take = Math.min(50, Math.max(1, parseInt(searchParams.get("take") ?? "12", 10)));

        // Same gate the public page applies: private and draft campaigns aren't
        // publicly viewable, so their donations aren't either.
        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: { id: true, visibility: true, status: true },
        });
        if (!campaign || campaign.visibility === "private" || campaign.status === "draft") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
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
            // Shape matches RecentDonation on the page, so the client can append
            // these straight onto its initial server-rendered list.
            donations: donations.map((d) => ({
                id:           d.id,
                display_name: d.is_anonymous
                    ? "Anonymous"
                    : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`),
                amount:       Number(d.amount),
                is_anonymous: d.is_anonymous,
                created_at:   d.created_at.toISOString(),
            })),
            total,
        });
    } catch (err) {
        console.error("[GET public-donations]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
