// Shared query logic for the admin organizations listing.
// Used by both the server page shell and GET /api/v1/admin/organizations.
// Folds per-org total_raised + active-campaign counts (groupBy) into each row.

import { prisma } from "@/lib/prisma";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const ORG_FILTERS = ["all", "has_active", "no_campaigns"] as const;
export type OrgFilter = (typeof ORG_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "most_campaigns"] as const;
export type OrgSort = (typeof SORT_OPTIONS)[number];

export type AdminOrganizationRow = {
    id:               string;
    name:             string;
    logo_url:         string | null;
    created_at:       string;   // ISO
    creator:          { id: string; first_name: string; last_name: string; email: string | null };
    campaigns_count:  number;
    active_campaigns: number;
    total_raised:     number;
};

export function normalizeFilter(v: string | null | undefined): OrgFilter {
    return (ORG_FILTERS as readonly string[]).includes(v ?? "") ? (v as OrgFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): OrgSort {
    return (SORT_OPTIONS as readonly string[]).includes(v ?? "") ? (v as OrgSort) : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminOrganizationQuery = {
    query?:    string;
    filter?:   string;
    sort?:     string;
    page?:     number;
    pageSize?: number;
};

export async function queryAdminOrganizations(
    opts: AdminOrganizationQuery,
): Promise<{ organizations: AdminOrganizationRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeFilter(opts.filter);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        ...(query ? {
            OR: [
                { name:    { contains: query, mode: "insensitive" as const } },
                { creator: { first_name: { contains: query, mode: "insensitive" as const } } },
                { creator: { last_name:  { contains: query, mode: "insensitive" as const } } },
                { creator: { email:      { contains: query, mode: "insensitive" as const } } },
            ],
        } : {}),
        ...(filter === "has_active"   ? { campaigns: { some: { status: "active" as const } } } : {}),
        ...(filter === "no_campaigns" ? { campaigns: { none: {} } } : {}),
    };

    const orderBy =
        sort === "oldest"           ? { created_at: "asc"  as const }
        : sort === "most_campaigns" ? { campaigns: { _count: "desc" as const } }
        : { created_at: "desc" as const };

    const [orgs, total] = await Promise.all([
        prisma.organization.findMany({
            where,
            select: {
                id:         true,
                name:       true,
                logo_url:   true,
                created_at: true,
                creator:    { select: { id: true, first_name: true, last_name: true, email: true } },
                _count:     { select: { campaigns: true } },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.organization.count({ where }),
    ]);

    const orgIds = orgs.map((o) => o.id);
    const [totalRaisedByOrg, activeCampaignsByOrg] = await Promise.all([
        prisma.campaign.groupBy({
            by:    ["organization_id"],
            where: { organization_id: { in: orgIds } },
            _sum:  { total_raised: true },
        }),
        prisma.campaign.groupBy({
            by:     ["organization_id"],
            where:  { organization_id: { in: orgIds }, status: "active" },
            _count: { _all: true },
        }),
    ]);
    const totalRaisedMap = Object.fromEntries(totalRaisedByOrg.map((r) => [r.organization_id, parseFloat((r._sum.total_raised ?? 0).toString())]));
    const activeCountMap  = Object.fromEntries(activeCampaignsByOrg.map((r) => [r.organization_id, r._count._all]));

    const organizations: AdminOrganizationRow[] = orgs.map((o) => ({
        id:               o.id,
        name:             o.name,
        logo_url:         o.logo_url,
        created_at:       o.created_at.toISOString(),
        creator:          { id: o.creator.id, first_name: o.creator.first_name, last_name: o.creator.last_name, email: o.creator.email },
        campaigns_count:  o._count.campaigns,
        active_campaigns: activeCountMap[o.id]  ?? 0,
        total_raised:     totalRaisedMap[o.id]  ?? 0,
    }));

    return { organizations, total, page, pageSize };
}
