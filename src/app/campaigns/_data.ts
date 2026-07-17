import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import type { FilterKey } from "./_filters";

// SERVER ONLY. This module imports prisma, so client components must never import a
// value from it — the tabs pull FILTERS from ./_filters for exactly that reason.

/**
 * The browse list. Wrapped in React `cache` so the count in the tab bar and the
 * grid below it — which suspend separately, to stream independently — still cost
 * a single query per request rather than two.
 */
export const getCampaigns = cache(async (filter: FilterKey, q: string) => {
    const statusFilter = filter === "all"
        ? { in: [CampaignStatus.active, CampaignStatus.upcoming, CampaignStatus.completed] as CampaignStatus[] }
        : { equals: filter as CampaignStatus };

    const rows = await prisma.campaign.findMany({
        where: {
            // Private campaigns are members-only — the campaign page 403s them to
            // everyone else, so they must never be listed or searchable here either.
            visibility: "public",
            status: statusFilter,
            // Match name OR organisation: people search for "the softball one" and
            // for their school/club by name. Mirrors /api/v1/campaigns/search.
            ...(q ? {
                OR: [
                    { name:             { contains: q, mode: "insensitive" as const } },
                    { org_display_name: { contains: q, mode: "insensitive" as const } },
                    { organization:     { name: { contains: q, mode: "insensitive" as const } } },
                ],
            } : {}),
        },
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
        select: {
            id:                  true,
            slug:                true,
            name:                true,
            status:              true,
            campaign_type:       true,
            current_step:        true,
            goal_type:           true,
            goal_amount:         true,
            initial_goal_amount: true,
            total_raised:        true,
            start_date:          true,
            end_date:            true,
            created_at:          true,
            timezone:            true,
            payout:              { select: { city: true, state: true } },
            media:               { select: { media_type: true, url: true } },
            _count:              { select: { members: true, donors: true, donations: true } },
        },
    });

    return rows.map((c) => ({
        ...c,
        // Public browse has no "me" — the card's public variant ignores both.
        myRoles: [] as string[],
        myDonorCount: 0,
    }));
});
