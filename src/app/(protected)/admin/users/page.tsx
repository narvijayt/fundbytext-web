import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import UserSearchInput from "./_components/UserSearchInput";
import UserSortSelect  from "./_components/UserSortSelect";
import CreateUserButton from "./_components/CreateUserButton";

const PAGE_SIZE = 10;

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(d: Date) {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return fmtDate(d);
}

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; filter?: string; sort?: string }>;
}) {
    const [sp, currentAdmin] = await Promise.all([searchParams, getAuthUser()]);
    const query = typeof sp.q === "string" ? sp.q.trim() : "";
    const page = typeof sp.page === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;
    const filter = typeof sp.filter === "string" ? sp.filter : "all";
    const sort   = typeof sp.sort   === "string" ? sp.sort   : "newest";

    const where = {
        ...(query ? {
            OR: [
                { first_name: { contains: query, mode: "insensitive" as const } },
                { last_name: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
        // deleted filter shows only deleted; all other filters exclude deleted
        ...(filter === "deleted" ? { deleted_at: { not: null } }
            : filter === "suspended" ? { is_suspended: true, deleted_at: null }
                : filter === "admin" ? { role: "admin" as const, deleted_at: null }
                    : { deleted_at: null }),
    };

    const orderBy =
        sort === "oldest"           ? { created_at: "asc"  as const }
        : sort === "a_z"            ? [{ first_name: "asc" as const }, { last_name: "asc" as const }]
        : sort === "most_campaigns" ? { memberships: { _count: "desc" as const } }
        : { created_at: "desc" as const };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                username: true,
                role: true,
                is_suspended: true,
                deleted_at: true,
                created_at: true,
                profile_photo_url: true,
                _count: { select: { memberships: true } },
                sessions: {
                    orderBy: { created_at: "desc" },
                    take: 1,
                    select: { created_at: true, revoked_at: true, expires_at: true },
                },
            },
            orderBy,
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildUrl = (params: Record<string, string | undefined>) => {
        const merged = { q: query || undefined, page: page > 1 ? String(page) : undefined, filter: filter !== "all" ? filter : undefined, sort: sort !== "newest" ? sort : undefined, ...params };
        const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
        return `/admin/users${qs ? `?${qs}` : ""}`;
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total</p>
                </div>
                <CreateUserButton />
            </div>

            {/* Filters + search */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                {/* Search */}
                <Suspense>
                    <UserSearchInput defaultValue={query} />
                </Suspense>

                {/* Status tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-semibold">
                    {(["all", "suspended", "admin", "deleted"] as const).map((f) => (
                        <Link
                            key={f}
                            href={buildUrl({ filter: f !== "all" ? f : undefined, page: undefined })}
                            className={`px-3 py-1.5 rounded-md capitalize transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {f}
                        </Link>
                    ))}
                </div>

                {/* Sort */}
                <Suspense>
                    <UserSortSelect defaultValue={sort} />
                </Suspense>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-5 py-3">Name</th>
                            <th className="text-left px-5 py-3">Email</th>
                            <th className="text-left px-5 py-3">Campaigns</th>
                            <th className="text-left px-5 py-3">Joined</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-400">No users found.</td>
                            </tr>
                        )}
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-900">
                                    <div className="flex items-center gap-3">
                                        {u.profile_photo_url ? (
                                            <img
                                                src={u.profile_photo_url}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                {u.first_name[0]}{u.last_name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <p>
                                                {u.first_name} {u.last_name}
                                                {u.role === "admin" && (
                                                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 uppercase tracking-wide">Admin</span>
                                                )}
                                                {u.id === currentAdmin?.id && (
                                                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0268c0] border border-[#0268c0]/20 uppercase tracking-wide">You</span>
                                                )}
                                            </p>
                                            {u.username && (
                                                <p className="text-xs text-blue-500 font-medium">@{u.username}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-gray-500">
                                    <p>{u.email}</p>
                                    {u.sessions[0] ? (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Last signed in {fmtRelative(u.sessions[0].created_at)}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-0.5">Never logged in</p>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-gray-500">{u._count.memberships}</td>
                                <td className="px-5 py-3 text-gray-500">{fmtDate(u.created_at)}</td>
                                <td className="px-5 py-3">
                                    {u.deleted_at ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Deleted</span>
                                    ) : u.is_suspended ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Suspended</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">Active</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <Link
                                        href={`/admin/users/${u.id}`}
                                        className="text-xs font-semibold text-[#0268c0] hover:underline"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Previous</Link>
                        )}
                        {page < totalPages && (
                            <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Next</Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
