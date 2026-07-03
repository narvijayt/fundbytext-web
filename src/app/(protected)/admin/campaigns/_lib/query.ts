// Shared query logic for the admin campaigns listing.
// Imported by BOTH the server page shell (initial page) and the GET API route
// (in-place search / filter / sort / pagination) so the two never drift.
// Server-only (imports prisma); the client table imports only the `AdminCampaignRow` TYPE.

import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const STATUS_FILTERS = ["all", "active", "upcoming", "draft", "completed"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "most_raised", "most_donations"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Serialized row shape sent to the client (no Prisma Decimal / Date instances). */
export type AdminCampaignRow = {
    id:              string;
    slug:            string;
    name:            string | null;
    status:          string;
    campaign_type:   string;
    total_raised:    number;
    created_at:      string;   // ISO
    donations_count: number;
    donors_count:    number;
    organizer:       { user_id: string | null; first_name: string; last_name: string; email: string | null } | null;
    hero_url:        string | null;
};

export function normalizeFilter(v: string | null | undefined): StatusFilter {
    return (STATUS_FILTERS as readonly string[]).includes(v ?? "") ? (v as StatusFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): SortOption {
    return (SORT_OPTIONS as readonly string[]).includes(v ?? "") ? (v as SortOption) : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminCampaignQuery = {
    query?:    string;
    filter?:   string;
    sort?:     string;
    page?:     number;
    pageSize?: number;
};

export async function queryAdminCampaigns(
    opts: AdminCampaignQuery,
): Promise<{ campaigns: AdminCampaignRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeFilter(opts.filter);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        ...(query ? {
            OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { slug: { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
        ...(filter !== "all" ? { status: filter as CampaignStatus } : {}),
    };

    const orderBy =
        sort === "oldest"           ? { created_at:   "asc"  as const }
        : sort === "most_raised"    ? { total_raised: "desc" as const }
        : sort === "most_donations" ? { donations:    { _count: "desc" as const } }
        : { created_at: "desc" as const };

    const [rows, total] = await Promise.all([
        prisma.campaign.findMany({
            where,
            select: {
                id:            true,
                slug:          true,
                name:          true,
                status:        true,
                campaign_type: true,
                total_raised:  true,
                created_at:    true,
                _count: { select: { donations: true, donors: true } },
                members: {
                    where:  { roles: { some: { role: "organizer" } } },
                    take:   1,
                    select: { user_id: true, first_name: true, last_name: true, email: true },
                },
                media: {
                    where:  { media_type: "hero" },
                    take:   1,
                    select: { url: true },
                },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.campaign.count({ where }),
    ]);

    const campaigns: AdminCampaignRow[] = rows.map((c) => {
        const o = c.members[0];
        return {
            id:              c.id,
            slug:            c.slug,
            name:            c.name,
            status:          c.status,
            campaign_type:   c.campaign_type,
            total_raised:    parseFloat(c.total_raised.toString()),
            created_at:      c.created_at.toISOString(),
            donations_count: c._count.donations,
            donors_count:    c._count.donors,
            organizer:       o ? { user_id: o.user_id, first_name: o.first_name, last_name: o.last_name, email: o.email } : null,
            hero_url:        c.media[0]?.url ?? null,
        };
    });

    return { campaigns, total, page, pageSize };
}
