// Shared query logic for the admin users listing.
// Used by both the server page shell and GET /api/v1/admin/users.

import { prisma } from "@/lib/prisma";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const USER_FILTERS = ["all", "suspended", "admin", "deleted"] as const;
export type UserFilter = (typeof USER_FILTERS)[number];

export const SORT_OPTIONS = ["newest", "oldest", "a_z", "most_campaigns"] as const;
export type UserSort = (typeof SORT_OPTIONS)[number];

export type AdminUserRow = {
    id:                string;
    first_name:        string;
    last_name:         string;
    email:             string;
    username:          string | null;
    role:              string;
    is_suspended:      boolean;
    deleted_at:        string | null;   // ISO
    created_at:        string;          // ISO
    profile_photo_url: string | null;
    campaigns_count:   number;
    last_sign_in_at:   string | null;   // ISO
};

export function normalizeFilter(v: string | null | undefined): UserFilter {
    return (USER_FILTERS as readonly string[]).includes(v ?? "") ? (v as UserFilter) : "all";
}
export function normalizeSort(v: string | null | undefined): UserSort {
    return (SORT_OPTIONS as readonly string[]).includes(v ?? "") ? (v as UserSort) : "newest";
}
export function normalizePageSize(v: number | null | undefined): number {
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(v ?? DEFAULT_PAGE_SIZE) ? (v as number) : DEFAULT_PAGE_SIZE;
}

export type AdminUserQuery = {
    query?:    string;
    filter?:   string;
    sort?:     string;
    page?:     number;
    pageSize?: number;
};

export async function queryAdminUsers(
    opts: AdminUserQuery,
): Promise<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }> {
    const query    = (opts.query ?? "").trim();
    const filter   = normalizeFilter(opts.filter);
    const sort     = normalizeSort(opts.sort);
    const pageSize = normalizePageSize(opts.pageSize);
    const page     = Math.max(1, opts.page ?? 1);

    const where = {
        ...(query ? {
            OR: [
                { first_name: { contains: query, mode: "insensitive" as const } },
                { last_name:  { contains: query, mode: "insensitive" as const } },
                { email:      { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
        // "deleted" shows only deleted; every other filter excludes deleted.
        ...(filter === "deleted"     ? { deleted_at: { not: null } }
            : filter === "suspended" ? { is_suspended: true, deleted_at: null }
            : filter === "admin"     ? { role: "admin" as const, deleted_at: null }
            : { deleted_at: null }),
    };

    const orderBy =
        sort === "oldest"           ? { created_at: "asc"  as const }
        : sort === "a_z"            ? [{ first_name: "asc" as const }, { last_name: "asc" as const }]
        : sort === "most_campaigns" ? { memberships: { _count: "desc" as const } }
        : { created_at: "desc" as const };

    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id:                true,
                first_name:        true,
                last_name:         true,
                email:             true,
                username:          true,
                role:              true,
                is_suspended:      true,
                deleted_at:        true,
                created_at:        true,
                profile_photo_url: true,
                _count:            { select: { memberships: true } },
                sessions:          { orderBy: { created_at: "desc" }, take: 1, select: { created_at: true } },
            },
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
    ]);

    const users: AdminUserRow[] = rows.map((u) => ({
        id:                u.id,
        first_name:        u.first_name,
        last_name:         u.last_name,
        email:             u.email,
        username:          u.username,
        role:              u.role,
        is_suspended:      u.is_suspended,
        deleted_at:        u.deleted_at ? u.deleted_at.toISOString() : null,
        created_at:        u.created_at.toISOString(),
        profile_photo_url: u.profile_photo_url,
        campaigns_count:   u._count.memberships,
        last_sign_in_at:   u.sessions[0] ? u.sessions[0].created_at.toISOString() : null,
    }));

    return { users, total, page, pageSize };
}
