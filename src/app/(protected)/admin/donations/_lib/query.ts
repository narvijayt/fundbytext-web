// Shared query logic for the admin donations listing.
// Used by both the server page shell (initial page) and GET /api/v1/admin/donations
// (in-place search / filter / sort / pagination) so the two never drift.

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/enums";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const STATUS_FILTERS = ["all", "flagged", "anonymous"] as const;
export type DonationFilter = (typeof STATUS_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "highest", "lowest"] as const;
export type DonationSort = (typeof SORT_OPTIONS)[number];

export type AdminDonationRow = {
    id:                       string;
    amount:                   number;
    donor_first_name:         string;
    donor_last_name:          string;
    donor_email:              string | null;
    donor_country:            string | null;
    is_anonymous:             boolean;
    is_flagged:               boolean;
    flag_note:                string | null;
    stripe_payment_intent_id: string | null;
    payment_method:           string;
    card_brand:               string | null;
    card_last4:               string | null;
    card_exp_month:           number | null;
    card_exp_year:            number | null;
    created_at:               string;   // ISO
    campaign:                 { slug: string; name: string | null };
    member:                   { user_id: string | null; first_name: string; last_name: string } | null;
};

export function normalizeFilter(v: string | null | undefined): DonationFilter {
    return (STATUS_FILTERS as readonly string[]).includes(v ?? "") ? (v as DonationFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): DonationSort {
    return (SORT_OPTIONS as readonly string[]).includes(v ?? "") ? (v as DonationSort) : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminDonationQuery = {
    query?:    string;
    filter?:   string;
    sort?:     string;
    page?:     number;
    pageSize?: number;
};

export async function queryAdminDonations(
    opts: AdminDonationQuery,
): Promise<{ donations: AdminDonationRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeFilter(opts.filter);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        payment_status: PaymentStatus.completed,
        ...(query ? {
            OR: [
                { donor_first_name:         { contains: query, mode: "insensitive" as const } },
                { donor_last_name:          { contains: query, mode: "insensitive" as const } },
                { donor_email:              { contains: query, mode: "insensitive" as const } },
                { stripe_payment_intent_id: { contains: query, mode: "insensitive" as const } },
                { campaign: { name:         { contains: query, mode: "insensitive" as const } } },
            ],
        } : {}),
        ...(filter === "flagged"   ? { is_flagged: true }   : {}),
        ...(filter === "anonymous" ? { is_anonymous: true } : {}),
    };

    const orderBy =
        sort === "oldest"    ? { created_at: "asc"  as const }
        : sort === "highest" ? { amount:     "desc" as const }
        : sort === "lowest"  ? { amount:     "asc"  as const }
        : { created_at: "desc" as const };

    const [rows, total] = await Promise.all([
        prisma.donation.findMany({
            where,
            select: {
                id:                       true,
                amount:                   true,
                donor_first_name:         true,
                donor_last_name:          true,
                donor_email:              true,
                donor_country:            true,
                is_anonymous:             true,
                is_flagged:               true,
                flag_note:                true,
                stripe_payment_intent_id: true,
                payment_method:           true,
                card_brand:               true,
                card_last4:               true,
                card_exp_month:           true,
                card_exp_year:            true,
                created_at:               true,
                campaign: { select: { slug: true, name: true } },
                member:   { select: { user_id: true, first_name: true, last_name: true } },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.donation.count({ where }),
    ]);

    const donations: AdminDonationRow[] = rows.map((d) => ({
        id:                       d.id,
        amount:                   parseFloat(d.amount.toString()),
        donor_first_name:         d.donor_first_name,
        donor_last_name:          d.donor_last_name,
        donor_email:              d.donor_email,
        donor_country:            d.donor_country,
        is_anonymous:             d.is_anonymous,
        is_flagged:               d.is_flagged,
        flag_note:                d.flag_note,
        stripe_payment_intent_id: d.stripe_payment_intent_id,
        payment_method:           d.payment_method,
        card_brand:               d.card_brand,
        card_last4:               d.card_last4,
        card_exp_month:           d.card_exp_month,
        card_exp_year:            d.card_exp_year,
        created_at:               d.created_at.toISOString(),
        campaign:                 { slug: d.campaign.slug, name: d.campaign.name },
        member:                   d.member ? { user_id: d.member.user_id, first_name: d.member.first_name, last_name: d.member.last_name } : null,
    }));

    return { donations, total, page, pageSize };
}
