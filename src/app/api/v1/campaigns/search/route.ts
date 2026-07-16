// GET /api/v1/campaigns/search?q=… — public campaign search powering the header
// search overlay. Matches campaign name OR organization name (the two things
// people actually recall). Public + launched campaigns only: drafts aren't live
// and private campaigns are members-only, so neither may surface here.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";

const LIVE_STATUSES = [CampaignStatus.active, CampaignStatus.upcoming, CampaignStatus.completed];
const TAKE = 6; // overlay shows a handful; "See all results" hands off to /campaigns

export type SearchHit = {
    slug:     string;
    name:     string;
    status:   string;
    org:      string | null;
    heroUrl:  string | null;
    raised:   number;
    goal:     number | null;
};

export async function GET(req: NextRequest) {
    try {
        const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
        // Single characters match nearly everything — not worth a round trip.
        if (q.length < 2) return NextResponse.json({ results: [], total: 0 });

        const where = {
            visibility: "public" as const,
            status: { in: LIVE_STATUSES },
            OR: [
                { name:             { contains: q, mode: "insensitive" as const } },
                { org_display_name: { contains: q, mode: "insensitive" as const } },
                { organization:     { name: { contains: q, mode: "insensitive" as const } } },
            ],
        };

        const [rows, total] = await Promise.all([
            prisma.campaign.findMany({
                where,
                orderBy: [{ status: "asc" }, { created_at: "desc" }],
                take: TAKE,
                select: {
                    slug:             true,
                    name:             true,
                    status:           true,
                    org_display_name: true,
                    goal_amount:      true,
                    total_raised:     true,
                    organization: { select: { name: true } },
                    media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
                },
            }),
            prisma.campaign.count({ where }),
        ]);

        const results: SearchHit[] = rows.map((c) => ({
            slug:    c.slug,
            name:    c.name ?? "Untitled campaign",
            status:  c.status,
            org:     c.org_display_name ?? c.organization?.name ?? null,
            heroUrl: c.media[0]?.url ?? null,
            raised:  Number(c.total_raised ?? 0),
            goal:    c.goal_amount != null ? Number(c.goal_amount) : null,
        }));

        return NextResponse.json({ results, total });
    } catch (err) {
        console.error("[GET campaigns/search]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
