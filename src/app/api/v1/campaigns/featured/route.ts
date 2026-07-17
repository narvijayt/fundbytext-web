// GET /api/v1/campaigns/featured — the active public campaigns shown in the
// marketing hero carousels. The home page reads the same rows server-side; this
// endpoint is for client surfaces that can't hit the DB directly (e.g. the login
// page's card row). Shape matches HeroCampaignsCarousel's HeroCard.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await prisma.campaign.findMany({
            where: { status: "active", visibility: "public" },
            take: 8,
            orderBy: { created_at: "desc" },
            select: {
                slug: true, name: true, status: true, campaign_type: true,
                goal_amount: true, end_date: true,
                media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
            },
        });

        const cards = rows.map((c) => ({
            img: c.media[0]?.url ?? null,
            // No category column yet — show the type as a friendly label rather than
            // the raw enum, same as the home hero.
            tag: c.campaign_type === "organization" ? "Organization"
                : c.campaign_type === "individual" ? "Individual" : "Campaign",
            name: c.name ?? "Untitled",
            goal: c.goal_amount ? `$${Number(c.goal_amount).toLocaleString()}` : null,
            status: c.status ?? "active",
            slug: `/campaigns/${c.slug}`,
            endDate: c.end_date ? new Date(c.end_date).toISOString() : null,
        }));

        return NextResponse.json({ cards });
    } catch {
        return NextResponse.json({ cards: [] });
    }
}
