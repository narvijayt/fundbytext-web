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
    active:    "bg-green-50 text-green-700 border-green-100",
    upcoming:  "bg-blue-50 text-blue-700 border-blue-100",
    draft:     "bg-gray-100 text-gray-500 border-gray-200",
    completed: "bg-purple-50 text-purple-700 border-purple-100",
};

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
                <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total</p>
            </div>

            {/* Filters + search */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Suspense>
                    <AdminCampaignSearchInput defaultValue={query} />
                </Suspense>

                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-semibold">
                    {(["all", "active", "upcoming", "draft", "completed"] as const).map((f) => (
                        <Link
                            key={f}
                            href={buildUrl({ filter: f !== "all" ? f : undefined, page: undefined })}
                            className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-5 py-3">Campaign</th>
                            <th className="text-left px-5 py-3">Organizer</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-right px-5 py-3">Raised</th>
                            <th className="text-right px-5 py-3">Donations</th>
                            <th className="text-left px-5 py-3">Created</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-gray-400">No campaigns found.</td>
                            </tr>
                        )}
                        {campaigns.map((c) => {
                            const organizer = c.members[0];
                            return (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            {c.media[0]?.url ? (
                                                <img
                                                    src={c.media[0].url}
                                                    alt=""
                                                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{c.name ?? <span className="italic text-gray-400">Untitled</span>}</p>
                                                <p className="text-xs text-gray-400 capitalize">{c.campaign_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500">
                                        {organizer ? (
                                            organizer.user_id ? (
                                                <Link href={`/admin/users/${organizer.user_id}`} className="group">
                                                    <p className="font-medium text-[#0268c0] group-hover:underline">{organizer.first_name} {organizer.last_name}</p>
                                                    <p className="text-xs text-gray-400">{organizer.email}</p>
                                                </Link>
                                            ) : (
                                                <>
                                                    <p className="font-medium text-gray-700">{organizer.first_name} {organizer.last_name}</p>
                                                    <p className="text-xs text-gray-400">{organizer.email}</p>
                                                </>
                                            )
                                        ) : "—"}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[c.status] ?? ""}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-semibold text-gray-700">
                                        {fmtUSD(parseFloat(c.total_raised.toString()))}
                                    </td>
                                    <td className="px-5 py-3 text-right text-gray-500">{c._count.donations}</td>
                                    <td className="px-5 py-3 text-gray-400">{fmtDate(c.created_at)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Link href={`/admin/campaigns/${c.slug}`} className="text-xs font-semibold text-[#0268c0] hover:underline">
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
