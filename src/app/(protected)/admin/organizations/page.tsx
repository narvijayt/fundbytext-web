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

    const TH_CLS = "px-4 py-3.5 text-left text-[13px] font-semibold";

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-black text-[#003060]">Organizations</h1>
                    <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total</p>
                </div>
            </div>

            {/* Search + Filters */}
            <Suspense>
                <OrgFilters />
            </Suspense>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#0268c0] text-white">
                                <th className={`${TH_CLS} pl-5`}>Organization</th>
                                <th className={TH_CLS}>Creator</th>
                                <th className={TH_CLS}>Campaigns</th>
                                <th className={TH_CLS}>Total Raised</th>
                                <th className={TH_CLS}>Created</th>
                                <th className="py-3.5 pl-4 pr-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No organizations found.</td>
                                </tr>
                            )}
                            {orgs.map((org) => {
                                const totalRaised     = totalRaisedMap[org.id]  ?? 0;
                                const activeCampaigns = activeCountMap[org.id]  ?? 0;
                                return (
                                    <tr key={org.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                        <td className="py-3.5 pl-5 pr-4 text-[13px] font-medium text-[#003060]">
                                            <div className="flex items-center gap-3">
                                                {org.logo_url ? (
                                                    <img src={org.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-[#e7e9eb] object-cover" />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-xs font-bold uppercase text-[#7e8a96]">
                                                        {org.name[0]}
                                                    </div>
                                                )}
                                                <span>{org.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#7e8a96]">
                                            <Link href={`/admin/users/${org.creator.id}`} className="font-medium text-[#003060] hover:text-[#0268c0] hover:underline">
                                                {org.creator.first_name} {org.creator.last_name}
                                            </Link>
                                            <p className="text-xs text-[#9aa7b8]">{org.creator.email}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#7e8a96]">
                                            <span>{org._count.campaigns}</span>
                                            {activeCampaigns > 0 && (
                                                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                                    {activeCampaigns} active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] font-bold text-[#003060]">{fmtUSD(totalRaised)}</td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#7e8a96]">{fmtDate(org.created_at)}</td>
                                        <td className="py-3.5 pl-4 pr-5 text-right">
                                            <Link href={`/admin/organizations/${org.id}`} className="text-[13px] font-semibold text-[#0268c0] hover:underline">
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
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#7e8a96]">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1.5">
                        {page > 1 && (
                            <Link scroll={false} href={buildUrl({ page: String(page - 1) })} className="flex h-9 items-center rounded-lg border border-[#e7e9eb] px-3 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link scroll={false} href={buildUrl({ page: String(page + 1) })} className="flex h-9 items-center rounded-lg border border-[#e7e9eb] px-3 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
