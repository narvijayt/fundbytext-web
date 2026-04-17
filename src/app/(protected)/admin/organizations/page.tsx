import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import OrgFilters from "./_components/OrgFilters";

const PAGE_SIZE = 10;

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default async function AdminOrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; filter?: string; sort?: string }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim() : "";
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;
    const filter = typeof sp.filter === "string" ? sp.filter : "all";
    const sort   = typeof sp.sort   === "string" ? sp.sort   : "newest";

    // Build base where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (query) {
        where.OR = [
            { name:    { contains: query, mode: "insensitive" } },
            { creator: { first_name: { contains: query, mode: "insensitive" } } },
            { creator: { last_name:  { contains: query, mode: "insensitive" } } },
            { creator: { email:      { contains: query, mode: "insensitive" } } },
        ];
    }

    if (filter === "has_active") {
        where.campaigns = { some: { status: "active" } };
    } else if (filter === "no_campaigns") {
        where.campaigns = { none: {} };
    }

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
                creator: {
                    select: { id: true, first_name: true, last_name: true, email: true },
                },
                _count: { select: { campaigns: true } },
            },
            orderBy,
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
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
            by:    ["organization_id"],
            where: { organization_id: { in: orgIds }, status: "active" },
            _count: { _all: true },
        }),
    ]);
    const totalRaisedMap  = Object.fromEntries(totalRaisedByOrg.map((r) => [r.organization_id,  parseFloat((r._sum.total_raised ?? 0).toString())]));
    const activeCountMap  = Object.fromEntries(activeCampaignsByOrg.map((r) => [r.organization_id, r._count._all]));

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildUrl = (params: Record<string, string | undefined>) => {
        const merged = {
            q:      query  || undefined,
            filter: filter !== "all"    ? filter : undefined,
            sort:   sort   !== "newest" ? sort   : undefined,
            page:   page   > 1          ? String(page) : undefined,
            ...params,
        };
        const qs = Object.entries(merged)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
            .join("&");
        return `/admin/organizations${qs ? `?${qs}` : ""}`;
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total</p>
                </div>
            </div>

            {/* Search + Filters */}
            <Suspense>
                <OrgFilters />
            </Suspense>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                                <th className="text-left px-5 py-3">Organization</th>
                                <th className="text-left px-5 py-3">Creator</th>
                                <th className="text-left px-5 py-3">Campaigns</th>
                                <th className="text-left px-5 py-3">Total Raised</th>
                                <th className="text-left px-5 py-3">Created</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orgs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">No organizations found.</td>
                                </tr>
                            )}
                            {orgs.map((org) => {
                                const totalRaised     = totalRaisedMap[org.id]  ?? 0;
                                const activeCampaigns = activeCountMap[org.id]  ?? 0;
                                return (
                                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                {org.logo_url ? (
                                                    <img src={org.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                        {org.name[0]}
                                                    </div>
                                                )}
                                                <span>{org.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">
                                            <Link href={`/admin/users/${org.creator.id}`} className="hover:text-[#0268c0] hover:underline">
                                                {org.creator.first_name} {org.creator.last_name}
                                            </Link>
                                            <p className="text-xs text-gray-400">{org.creator.email}</p>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">
                                            <span>{org._count.campaigns}</span>
                                            {activeCampaigns > 0 && (
                                                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                                                    {activeCampaigns} active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-gray-700">{fmtUSD(totalRaised)}</td>
                                        <td className="px-5 py-3 text-gray-500">{fmtDate(org.created_at)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link href={`/admin/organizations/${org.id}`} className="text-xs font-semibold text-[#0268c0] hover:underline">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link scroll={false} href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link scroll={false} href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
