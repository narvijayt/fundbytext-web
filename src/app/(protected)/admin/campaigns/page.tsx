import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import AdminCampaignSearchInput from "./_components/AdminCampaignSearchInput";
import AdminCampaignSortSelect  from "./_components/AdminCampaignSortSelect";

const PAGE_SIZE = 10;

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    upcoming:  "bg-blue-100 text-blue-700",
    draft:     "bg-gray-100 text-gray-500",
    completed: "bg-purple-100 text-purple-700",
};

const TH_CLS = "px-4 py-3.5 text-left text-[13px] font-semibold";

export default async function AdminCampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;
    const filter = typeof sp.filter === "string" ? sp.filter                           : "all";
    const sort   = typeof sp.sort   === "string" ? sp.sort                             : "newest";

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
        sort === "oldest"          ? { created_at:   "asc"  as const }
        : sort === "most_raised"   ? { total_raised: "desc" as const }
        : sort === "most_donations"? { donations:    { _count: "desc" as const } }
        : { created_at: "desc" as const };

    const [campaigns, total] = await Promise.all([
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
                start_date:    true,
                _count: {
                    select: { donations: true, donors: true },
                },
                members: {
                    where: { roles: { some: { role: "organizer" } } },
                    take:  1,
                    select: { user_id: true, first_name: true, last_name: true, email: true },
                },
                media: {
                    where: { media_type: "hero" },
                    take:  1,
                    select: { url: true },
                },
            },
            orderBy,
            skip:  (page - 1) * PAGE_SIZE,
            take:  PAGE_SIZE,
        }),
        prisma.campaign.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildUrl = (params: Record<string, string | undefined>) => {
        const merged = {
            q:      query  || undefined,
            page:   page   > 1 ? String(page) : undefined,
            filter: filter !== "all"    ? filter : undefined,
            sort:   sort   !== "newest" ? sort   : undefined,
            ...params,
        };
        const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
        return `/admin/campaigns${qs ? `?${qs}` : ""}`;
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-[22px] font-black text-[#003060]">Campaigns</h1>
                <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total</p>
            </div>

            {/* Filters + search */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <Suspense>
                    <AdminCampaignSearchInput defaultValue={query} />
                </Suspense>

                <div className="flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white p-1 text-xs font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                    {(["all", "active", "upcoming", "draft", "completed"] as const).map((f) => (
                        <Link
                            key={f}
                            href={buildUrl({ filter: f !== "all" ? f : undefined, page: undefined })}
                            className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                                filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:bg-gray-50 hover:text-[#003060]"
                            }`}
                        >
                            {f}
                        </Link>
                    ))}
                </div>

                <Suspense>
                    <AdminCampaignSortSelect defaultValue={sort} />
                </Suspense>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#0268c0] text-white">
                            <th className={`${TH_CLS} pl-5`}>Campaign</th>
                            <th className={TH_CLS}>Organizer</th>
                            <th className={TH_CLS}>Status</th>
                            <th className={`${TH_CLS} text-right`}>Raised</th>
                            <th className={`${TH_CLS} text-right`}>Donations</th>
                            <th className={TH_CLS}>Created</th>
                            <th className={`${TH_CLS} pr-5`} />
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No campaigns found.</td>
                            </tr>
                        )}
                        {campaigns.map((c) => {
                            const organizer = c.members[0];
                            return (
                                <tr key={c.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                    <td className="py-3.5 pl-5 pr-4">
                                        <div className="flex items-center gap-3">
                                            {c.media[0]?.url ? (
                                                <img
                                                    src={c.media[0].url}
                                                    alt=""
                                                    className="h-10 w-10 shrink-0 rounded-lg border border-[#e7e9eb] object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7]">
                                                    <svg className="h-5 w-5 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[13px] font-semibold text-[#003060]">{c.name ?? <span className="font-medium italic text-[#9aa7b8]">Untitled</span>}</p>
                                                <p className="text-xs capitalize text-[#9aa7b8]">{c.campaign_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-[#7e8a96]">
                                        {organizer ? (
                                            organizer.user_id ? (
                                                <Link href={`/admin/users/${organizer.user_id}`} className="group">
                                                    <p className="text-[13px] font-medium text-[#0268c0] group-hover:underline">{organizer.first_name} {organizer.last_name}</p>
                                                    <p className="text-xs text-[#9aa7b8]">{organizer.email}</p>
                                                </Link>
                                            ) : (
                                                <>
                                                    <p className="text-[13px] font-medium text-[#003060]">{organizer.first_name} {organizer.last_name}</p>
                                                    <p className="text-xs text-[#9aa7b8]">{organizer.email}</p>
                                                </>
                                            )
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-[13px] font-bold text-[#003060]">
                                        {fmtUSD(parseFloat(c.total_raised.toString()))}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-[13px] text-[#7e8a96]">{c._count.donations}</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#9aa7b8]">{fmtDate(c.created_at)}</td>
                                    <td className="py-3.5 pl-4 pr-5 text-right">
                                        <Link href={`/admin/campaigns/${c.slug}`} className="text-[13px] font-semibold text-[#0268c0] hover:underline">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#7e8a96]">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={buildUrl({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50">
                                <svg className="h-3.5 w-3.5 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link href={buildUrl({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50">
                                Next
                                <svg className="h-3.5 w-3.5 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
