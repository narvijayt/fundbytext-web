import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import OrgCampaignFilters from "./_components/OrgCampaignFilters";

const CAMPAIGNS_PER_PAGE = 10;

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
    active:    "bg-green-50 text-green-700 border-green-100",
    upcoming:  "bg-blue-50 text-blue-700 border-blue-100",
    draft:     "bg-gray-100 text-gray-500 border-gray-200",
    completed: "bg-purple-50 text-purple-700 border-purple-100",
};

export default async function AdminOrganizationDetailPage({
    params,
    searchParams,
}: {
    params:       Promise<{ id: string }>;
    searchParams: Promise<{ page?: string; q?: string; status?: string; sort?: string }>;
}) {
    const { id } = await params;
    const sp     = await searchParams;

    const page   = Math.max(1, parseInt(sp.page   ?? "1") || 1);
    const query  = typeof sp.q      === "string" ? sp.q.trim() : "";
    const status = typeof sp.status === "string" ? sp.status   : "all";
    const sort   = typeof sp.sort   === "string" ? sp.sort     : "newest";

    // Campaign where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaignWhere: any = { organization_id: id };
    if (query) campaignWhere.name = { contains: query, mode: "insensitive" };
    if (status !== "all") campaignWhere.status = status;

    const campaignOrderBy =
        sort === "oldest"        ? { created_at: "asc"    as const }
        : sort === "most_raised" ? { total_raised: "desc" as const }
        : { created_at: "desc" as const };

    const [org, campaignTotal, campaigns, statsResult, activeCampaignCount] = await Promise.all([
        prisma.organization.findUnique({
            where: { id },
            select: {
                id:         true,
                name:       true,
                logo_url:   true,
                created_at: true,
                updated_at:   true,
                creator: {
                    select: {
                        id:                true,
                        first_name:        true,
                        last_name:         true,
                        email:             true,
                        profile_photo_url: true,
                    },
                },
            },
        }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.campaign.findMany({
            where:   campaignWhere,
            select: {
                id:            true,
                slug:          true,
                name:          true,
                status:        true,
                campaign_type: true,
                total_raised:  true,
                created_at:    true,
                media: {
                    where:  { media_type: "hero" },
                    take:   1,
                    select: { url: true },
                },
            },
            orderBy: campaignOrderBy,
            skip:    (page - 1) * CAMPAIGNS_PER_PAGE,
            take:    CAMPAIGNS_PER_PAGE,
        }),
        // Stats always across the full org (no filters)
        prisma.campaign.aggregate({
            where: { organization_id: id },
            _sum:  { total_raised: true },
        }),
        prisma.campaign.count({ where: { organization_id: id, status: "active" } }),
    ]);

    if (!org) notFound();

    const totalCampaigns = await prisma.campaign.count({ where: { organization_id: id } });
    const totalRaised    = parseFloat((statsResult._sum.total_raised ?? 0).toString());
    const totalPages     = Math.ceil(campaignTotal / CAMPAIGNS_PER_PAGE);

    const buildUrl = (overrides: Record<string, string | undefined>) => {
        const merged = {
            q:      query  || undefined,
            status: status !== "all"    ? status : undefined,
            sort:   sort   !== "newest" ? sort   : undefined,
            page:   page   > 1          ? String(page) : undefined,
            ...overrides,
        };
        const qs = Object.entries(merged)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
            .join("&");
        return `/admin/organizations/${id}${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="space-y-5">
            {/* Back */}
            <Link
                href="/admin/organizations"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Organizations
            </Link>

            {/* Two-column layout */}
            <div className="grid grid-cols-[280px_1fr] gap-6 items-start">

                {/* ── Left column: org profile ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Logo / initials */}
                    <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100">
                        {org.logo_url ? (
                            <img
                                src={org.logo_url}
                                alt=""
                                className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 uppercase select-none">
                                {org.name[0]}
                            </div>
                        )}
                        <h1 className="mt-3 text-lg font-bold text-gray-900 text-center">{org.name}</h1>
                        <p className="text-xs text-gray-400 mt-1">Organization</p>
                    </div>

                    {/* Creator */}
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Creator</p>
                        <Link
                            href={`/admin/users/${org.creator.id}`}
                            className="flex items-center gap-3 group"
                        >
                            {org.creator.profile_photo_url ? (
                                <img
                                    src={org.creator.profile_photo_url}
                                    alt=""
                                    className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400 uppercase select-none">
                                    {org.creator.first_name[0]}{org.creator.last_name[0]}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-[#0268c0] transition-colors truncate">
                                    {org.creator.first_name} {org.creator.last_name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{org.creator.email}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Stats — always full-org totals, unaffected by filters */}
                    <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Campaigns</p>
                            <p className="text-sm font-bold text-gray-800">{totalCampaigns}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Active</p>
                            <p className={`text-sm font-bold ${activeCampaignCount > 0 ? "text-green-600" : "text-gray-400"}`}>
                                {activeCampaignCount}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Total Raised</p>
                            <p className="text-sm font-bold text-gray-800">{fmtUSD(totalRaised)}</p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="px-5 py-4 space-y-2.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Created {fmtDate(org.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Updated {fmtDate(org.updated_at)}</span>
                        </div>
                    </div>

                </div>

                {/* ── Right column: campaigns ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Campaigns</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{campaignTotal} result{campaignTotal !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Search + Filters */}
                    <Suspense>
                        <OrgCampaignFilters orgId={id} />
                    </Suspense>

                    {campaigns.length === 0 ? (
                        <p className="px-6 py-12 text-sm text-gray-400 text-center">No campaigns found.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-140">
                                    <thead>
                                        <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                                            <th className="text-left px-6 py-3">Campaign</th>
                                            <th className="text-left px-6 py-3">Status</th>
                                            <th className="text-right px-6 py-3">Total Raised</th>
                                            <th className="text-left px-6 py-3">Created</th>
                                            <th className="px-6 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {campaigns.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-gray-900">
                                                    <div className="flex items-center gap-3">
                                                        {c.media[0]?.url ? (
                                                            <img
                                                                src={c.media[0].url}
                                                                alt=""
                                                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p>{c.name ?? <span className="italic text-gray-400">Untitled</span>}</p>
                                                            <p className="text-[10px] text-gray-400 font-normal capitalize mt-0.5">{c.campaign_type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors[c.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-semibold text-gray-700">
                                                    {fmtUSD(parseFloat(c.total_raised.toString()))}
                                                </td>
                                                <td className="px-6 py-3 text-gray-500 text-xs">
                                                    {fmtDate(c.created_at)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <Link
                                                        href={`/admin/campaigns/${c.slug}`}
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

                            {totalPages > 1 && (
                                <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                    <span>Page {page} of {totalPages}</span>
                                    <div className="flex items-center gap-2">
                                        {page > 1 && (
                                            <Link
                                                scroll={false}
                                                href={buildUrl({ page: String(page - 1) })}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {page < totalPages && (
                                            <Link
                                                scroll={false}
                                                href={buildUrl({ page: String(page + 1) })}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
