// Shared query for the admin org-detail campaigns listing.
// Used by both the server page shell and GET /api/v1/admin/organizations/[id]/campaigns.

import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const STATUS_FILTERS = ["all", "active", "upcoming", "draft", "completed"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "most_raised"] as const;
export type OrgCampaignSort = (typeof SORT_OPTIONS)[number];

export type OrgCampaignRow = {
    slug:          string;
    name:          string | null;
    status:        string;
    campaign_type: string;
    total_raised:  number;
    hero_url:      string | null;
    created_at:    string;   // ISO
};

export function normalizeStatus(v: string | null | undefined): StatusFilter {
    return (STATUS_FILTERS as readonly string[]).includes(v ?? "") ? (v as StatusFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): OrgCampaignSort {
    return (SORT_OPTIONS as readonly string[]).includes(v ?? "") ? (v as OrgCampaignSort) : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type OrgCampaignQuery = { orgId: string; query?: string; status?: string; sort?: string; page?: number; pageSize?: number };

export async function queryOrgCampaigns(
    opts: OrgCampaignQuery,
): Promise<{ campaigns: OrgCampaignRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const status   = normalizeStatus(opts.status);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        organization_id: opts.orgId,
        ...(status !== "all" ? { status: status as CampaignStatus } : {}),
        ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
    };

    const orderBy =
        sort === "oldest"        ? { created_at: "asc"  as const }
        : sort === "most_raised" ? { total_raised: "desc" as const }
        : { created_at: "desc" as const };

    const [rows, total] = await Promise.all([
        prisma.campaign.findMany({
            where,
            select: {
                slug:          true,
                name:          true,
                status:        true,
                campaign_type: true,
                total_raised:  true,
                created_at:    true,
                media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.campaign.count({ where }),
    ]);

    const campaigns: OrgCampaignRow[] = rows.map((c) => ({
        slug:          c.slug,
        name:          c.name,
        status:        c.status,
        campaign_type: c.campaign_type,
        total_raised:  parseFloat(c.total_raised.toString()),
        hero_url:      c.media[0]?.url ?? null,
        created_at:    c.created_at.toISOString(),
    }));

    return { campaigns, total, page, pageSize };
}
