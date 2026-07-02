// Shared query logic for the admin user-detail page's two embedded listings
// (campaigns + sessions). Used by both the server page shell (initial page) and
// the GET API routes so search / filter / sort / pagination refetch in-place.

import { prisma } from "@/lib/prisma";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 5;

export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

/* ───────────────────────── Campaigns ───────────────────────── */

export const CAMPAIGN_FILTERS = ["all", "active", "upcoming", "draft", "completed", "organizer", "participant"] as const;
export type CampaignFilter = (typeof CAMPAIGN_FILTERS)[number];

export const CAMPAIGN_SORTS = ["newest", "oldest", "most_raised"] as const;
export type CampaignSort = (typeof CAMPAIGN_SORTS)[number];

export type UserCampaignRow = {
    slug:          string;
    name:          string | null;
    status:        string;
    campaign_type: string;
    total_raised:  number;
    hero_url:      string | null;
    roles:         string[];
};

export function normalizeCampaignFilter(v: string | null | undefined): CampaignFilter {
    return (CAMPAIGN_FILTERS as readonly string[]).includes(v ?? "") ? (v as CampaignFilter) : "all";
}
export function normalizeCampaignSort(v: string | null | undefined): CampaignSort {
    return (CAMPAIGN_SORTS as readonly string[]).includes(v ?? "") ? (v as CampaignSort) : "newest";
}

export type UserCampaignQuery = { userId: string; query?: string; filter?: string; sort?: string; page?: number; pageSize?: number };

export async function queryUserCampaigns(
    opts: UserCampaignQuery,
): Promise<{ campaigns: UserCampaignRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeCampaignFilter(opts.filter);
    const sort     = normalizeCampaignSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const campaignRelation: Record<string, unknown> = {};
    if (query) campaignRelation.name = { contains: query, mode: "insensitive" };
    if (["active", "upcoming", "draft", "completed"].includes(filter)) campaignRelation.status = filter;

    const where: Record<string, unknown> = { user_id: opts.userId };
    if (Object.keys(campaignRelation).length > 0) where.campaign = campaignRelation;
    if (filter === "organizer" || filter === "participant") where.roles = { some: { role: filter } };

    const orderBy =
        sort === "oldest"        ? { campaign: { created_at: "asc"  as const } }
        : sort === "most_raised" ? { campaign: { total_raised: "desc" as const } }
        : { campaign: { created_at: "desc" as const } };

    const [rows, total] = await Promise.all([
        prisma.campaignMember.findMany({
            where,
            select: {
                roles: { select: { role: true } },
                campaign: {
                    select: {
                        slug:          true,
                        name:          true,
                        status:        true,
                        campaign_type: true,
                        total_raised:  true,
                        media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.campaignMember.count({ where }),
    ]);

    const campaigns: UserCampaignRow[] = rows.map((m) => ({
        slug:          m.campaign.slug,
        name:          m.campaign.name,
        status:        m.campaign.status,
        campaign_type: m.campaign.campaign_type,
        total_raised:  parseFloat(m.campaign.total_raised.toString()),
        hero_url:      m.campaign.media[0]?.url ?? null,
        roles:         m.roles.map((r) => r.role),
    }));

    return { campaigns, total, page, pageSize };
}

/* ───────────────────────── Sessions ───────────────────────── */

export const SESSION_FILTERS = ["all", "active", "revoked", "expired"] as const;
export type SessionFilter = (typeof SESSION_FILTERS)[number];

export type UserSessionRow = {
    id:         string;
    is_mobile:  boolean;
    ip_address: string | null;
    user_agent: string | null;
    created_at: number;        // ms
    expires_at: number | null; // ms
    revoked_at: number | null; // ms
};

export function normalizeSessionFilter(v: string | null | undefined): SessionFilter {
    return (SESSION_FILTERS as readonly string[]).includes(v ?? "") ? (v as SessionFilter) : "all";
}

export type UserSessionQuery = { userId: string; query?: string; filter?: string; page?: number; pageSize?: number };

export async function queryUserSessions(
    opts: UserSessionQuery,
): Promise<{ sessions: UserSessionRow[]; total: number; activeTotal: number; grandTotal: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeSessionFilter(opts.filter);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);
    const now      = new Date();

    const conditions: Record<string, unknown>[] = [];
    if (query) conditions.push({ OR: [
        { ip_address: { contains: query, mode: "insensitive" } },
        { user_agent: { contains: query, mode: "insensitive" } },
    ] });
    if (filter === "active")  { conditions.push({ revoked_at: null }); conditions.push({ OR: [{ expires_at: null }, { expires_at: { gt: now } }] }); }
    if (filter === "revoked") { conditions.push({ revoked_at: { not: null } }); }
    if (filter === "expired") { conditions.push({ revoked_at: null }); conditions.push({ expires_at: { lt: now } }); }

    const where: Record<string, unknown> = { user_id: opts.userId };
    if (conditions.length > 0) where.AND = conditions;

    const activeWhere = { user_id: opts.userId, revoked_at: null, OR: [{ expires_at: null }, { expires_at: { gt: now } }] };

    const [rows, total, activeTotal, grandTotal] = await Promise.all([
        prisma.userSession.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip:    (page - 1) * pageSize,
            take:    pageSize,
            select: { id: true, is_mobile: true, ip_address: true, user_agent: true, created_at: true, expires_at: true, revoked_at: true },
        }),
        prisma.userSession.count({ where }),
        prisma.userSession.count({ where: activeWhere }),
        prisma.userSession.count({ where: { user_id: opts.userId } }),
    ]);

    const sessions: UserSessionRow[] = rows.map((s) => ({
        id:         s.id,
        is_mobile:  s.is_mobile,
        ip_address: s.ip_address ?? null,
        user_agent: s.user_agent ?? null,
        created_at: s.created_at.getTime(),
        expires_at: s.expires_at?.getTime() ?? null,
        revoked_at: s.revoked_at?.getTime() ?? null,
    }));

    return { sessions, total, activeTotal, grandTotal, page, pageSize };
}
