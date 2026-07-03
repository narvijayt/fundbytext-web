// Shared query logic for the admin contact-submissions listing.
// Used by both the server page shell and GET /api/v1/admin/contact.

import { prisma } from "@/lib/prisma";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export const CONTACT_FILTERS = ["all", "unread"] as const;
export type ContactFilter = (typeof CONTACT_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest"] as const;
export type ContactSort = (typeof SORT_OPTIONS)[number];

export type AdminContactRow = {
    id:           string;
    first_name:   string;
    last_name:    string;
    email:        string;
    inquiry_type: string;
    message:      string;
    is_read:      boolean;
    created_at:   string;   // ISO
};

export function normalizeFilter(v: string | null | undefined): ContactFilter {
    return v === "unread" ? "unread" : "all";
}
export function normalizeSort(v: string | null | undefined): ContactSort {
    return v === "oldest" ? "oldest" : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminContactQuery = {
    query?:    string;
    filter?:   string;
    sort?:     string;
    page?:     number;
    pageSize?: number;
};

export async function queryAdminContact(
    opts: AdminContactQuery,
): Promise<{ submissions: AdminContactRow[]; total: number; unread: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeFilter(opts.filter);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        ...(filter === "unread" ? { is_read: false } : {}),
        ...(query ? {
            OR: [
                { first_name:   { contains: query, mode: "insensitive" as const } },
                { last_name:    { contains: query, mode: "insensitive" as const } },
                { email:        { contains: query, mode: "insensitive" as const } },
                { inquiry_type: { contains: query, mode: "insensitive" as const } },
                { message:      { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [rows, total, unread] = await Promise.all([
        prisma.contactSubmission.findMany({
            where,
            orderBy: { created_at: sort === "oldest" ? "asc" : "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.contactSubmission.count({ where }),
        prisma.contactSubmission.count({ where: { is_read: false } }),
    ]);

    const submissions: AdminContactRow[] = rows.map((s) => ({
        id:           s.id,
        first_name:   s.first_name,
        last_name:    s.last_name,
        email:        s.email,
        inquiry_type: s.inquiry_type,
        message:      s.message,
        is_read:      s.is_read,
        created_at:   s.created_at.toISOString(),
    }));

    return { submissions, total, unread, page, pageSize };
}
