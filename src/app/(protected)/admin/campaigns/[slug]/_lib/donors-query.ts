// Shared query for the admin campaign-view donors table (read-only, admin).
// Used by both the server page shell and GET /api/v1/admin/campaigns/[slug]/donors.

import { prisma } from "@/lib/prisma";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 5;

export const STATUS_FILTERS = ["all", "donated", "contacted", "not_donated"] as const;
export type DonorStatusFilter = (typeof STATUS_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest"] as const;
export type DonorSort = (typeof SORT_OPTIONS)[number];

export type AdminDonorRow = {
    id:            string;
    first_name:    string;
    last_name:     string;
    email:         string | null;
    phone:         string | null;
    status:        string;
    created_at:    number;   // ms
    isWalkIn:      boolean;
    isGeneralFund: boolean;
    isAnonymous:   boolean;
    assigned_member: { user_id: string | null; first_name: string; last_name: string } | null;
    added_by_member: { user_id: string | null; first_name: string; last_name: string } | null;
    donations:     { amount: number; donated_at: number }[];
};

export function normalizeStatus(v: string | null | undefined): DonorStatusFilter {
    return (STATUS_FILTERS as readonly string[]).includes(v ?? "") ? (v as DonorStatusFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): DonorSort {
    return v === "oldest" ? "oldest" : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminDonorQuery = { campaignId: string; query?: string; status?: string; sort?: string; page?: number; pageSize?: number };

export async function queryCampaignDonors(
    opts: AdminDonorQuery,
): Promise<{ donors: AdminDonorRow[]; total: number; totalRaised: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const status   = normalizeStatus(opts.status);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        campaign_id: opts.campaignId,
        ...(status !== "all" ? { status } : {}),
        ...(query ? {
            OR: [
                { first_name: { contains: query, mode: "insensitive" as const } },
                { last_name:  { contains: query, mode: "insensitive" as const } },
                { email:      { contains: query, mode: "insensitive" as const } },
                { phone:      { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [rows, total, raisedAgg] = await Promise.all([
        prisma.campaignDonor.findMany({
            where,
            orderBy: { created_at: sort === "oldest" ? "asc" : "desc" },
            skip:    (page - 1) * pageSize,
            take:    pageSize,
            select: {
                id: true, first_name: true, last_name: true, email: true, phone: true, status: true,
                invite_token: true, assigned_member_id: true, created_at: true,
                assigned_member: { select: { user_id: true, first_name: true, last_name: true } },
                added_by_member: { select: { user_id: true, first_name: true, last_name: true } },
                donations: { where: { payment_status: "completed" }, select: { amount: true, created_at: true, is_anonymous: true } },
            },
        }),
        prisma.campaignDonor.count({ where }),
        // total raised across ALL donors for this campaign (unfiltered) — for the header
        prisma.donation.aggregate({ where: { campaign_id: opts.campaignId, payment_status: "completed" }, _sum: { amount: true } }),
    ]);

    const donors: AdminDonorRow[] = rows.map((d) => ({
        id: d.id, first_name: d.first_name, last_name: d.last_name, email: d.email, phone: d.phone, status: d.status,
        created_at: d.created_at.getTime(),
        isWalkIn:      !d.invite_token,
        isGeneralFund: !d.assigned_member_id,
        isAnonymous:   d.donations.some((don) => don.is_anonymous),
        assigned_member: d.assigned_member ? { user_id: d.assigned_member.user_id, first_name: d.assigned_member.first_name, last_name: d.assigned_member.last_name } : null,
        added_by_member: d.added_by_member ? { user_id: d.added_by_member.user_id, first_name: d.added_by_member.first_name, last_name: d.added_by_member.last_name } : null,
        donations: d.donations.map((don) => ({ amount: parseFloat(don.amount.toString()), donated_at: don.created_at.getTime() })),
    }));

    const totalRaised = parseFloat((raisedAgg._sum.amount ?? 0).toString());

    return { donors, total, totalRaised, page, pageSize };
}
