"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { OrgCampaignRow } from "../_lib/query";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
const STATUS_FILTERS = ["all", "active", "upcoming", "draft", "completed"] as const;

const STATUS_COLORS: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    upcoming:  "bg-blue-100 text-blue-700",
    draft:     "bg-gray-100 text-gray-500",
    completed: "bg-purple-100 text-purple-700",
};

const CARD       = "overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]";
const TH_CLS     = "px-5 py-3 text-left text-[12px] font-semibold";
const SELECT_CLS = "rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-2 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pageList(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    if (current > 3) out.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
    if (current < total - 2) out.push("…");
    out.push(total);
    return out;
}

const Bar = ({ w }: { w: string }) => <div className={`h-3.5 ${w} rounded-full bg-gray-200`} />;
function SkeletonRow() {
    return (
        <tr className="border-b border-[#eef1f4] last:border-0">
            <td className="py-3.5 pl-5 pr-4">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-200" />
                    <div className="space-y-1.5"><Bar w="w-32" /><Bar w="w-14" /></div>
                </div>
            </td>
            <td className="px-5 py-3.5"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="px-5 py-3.5"><div className="ml-auto animate-pulse"><Bar w="w-16" /></div></td>
            <td className="px-5 py-3.5"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="py-3.5 pl-4 pr-5"><div className="ml-auto h-3.5 w-10 animate-pulse rounded-full bg-gray-200" /></td>
        </tr>
    );
}

type Props = {
    orgId:            string;
    initialCampaigns: OrgCampaignRow[];
    initialTotal:     number;
    grandTotal:       number;
    initialQuery:     string;
    initialStatus:    string;
    initialSort:      string;
    initialPage:      number;
    initialPageSize:  number;
};

type FetchArgs = { page: number; search: string; status: string; sort: string; pageSize: number };

export default function OrgCampaignsTable(props: Props) {
    const [rows,     setRows]     = useState<OrgCampaignRow[]>(props.initialCampaigns);
    const [total,    setTotal]    = useState(props.initialTotal);
    const [search,   setSearch]   = useState(props.initialQuery);
    const [status,   setStatus]   = useState(props.initialStatus);
    const [sort,     setSort]     = useState(props.initialSort);
    const [page,     setPage]     = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.initialPageSize);
    const [loading,  setLoading]  = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionRef  = useRef<HTMLDivElement>(null);
    const reqId       = useRef(0);

    async function fetchPage(a: FetchArgs) {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(a.page), page_size: String(a.pageSize), q: a.search.trim(), status: a.status, sort: a.sort });
            const res = await fetch(`/api/v1/admin/organizations/${props.orgId}/campaigns?${params}`);
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { campaigns?: OrgCampaignRow[]; total?: number } | null;
            if (id !== reqId.current) return;
            if (res.ok && data && Array.isArray(data.campaigns)) {
                setRows(data.campaigns);
                setTotal(data.total ?? 0);
            }
        } catch {
            /* keep rows on error */
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }
    function scrollToTop() { sectionRef.current?.scrollIntoView({ block: "nearest" }); }

    function onSearch(q: string) {
        setSearch(q);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPage({ page: 1, search: q, status, sort, pageSize }), 300);
    }
    function onStatus(s: string) { setStatus(s); setPage(1); fetchPage({ page: 1, search, status: s, sort, pageSize }); }
    function onSort(s: string)   { setSort(s);   setPage(1); fetchPage({ page: 1, search, status, sort: s, pageSize }); }
    function onPageSize(n: number) { setPageSize(n); setPage(1); fetchPage({ page: 1, search, status, sort, pageSize: n }); }
    function goPage(p: number)   { setPage(p); fetchPage({ page: p, search, status, sort, pageSize }); scrollToTop(); }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);
    const filtered = search.trim() !== "" || status !== "all";

    return (
        <div ref={sectionRef} className={`${CARD} scroll-mt-4`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] px-5 py-4">
                <div>
                    <h2 className="text-[16px] font-bold text-[#003060]">Campaigns</h2>
                    <p className="mt-0.5 text-xs text-[#9aa7b8]">{filtered ? `${total.toLocaleString()} of ${props.grandTotal.toLocaleString()}` : `${props.grandTotal.toLocaleString()} total`}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eef1f4] px-5 py-3">
                <div className="relative min-w-[160px] flex-1 sm:max-w-[260px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search campaigns…"
                        className="w-full rounded-lg border border-[#e7e9eb] bg-white py-2 pl-9 pr-8 text-[13px] text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <select value={status} onChange={(e) => onStatus(e.target.value)} className={SELECT_CLS} aria-label="Filter campaigns by status">
                    {STATUS_FILTERS.map((s) => <option key={s} value={s} className="capitalize">{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLS} aria-label="Sort campaigns">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="most_raised">Most Raised</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                    <thead>
                        <tr className="bg-[#0268c0] text-white">
                            <th className={`${TH_CLS} pl-5`}>Campaign</th>
                            <th className={TH_CLS}>Status</th>
                            <th className={`${TH_CLS} text-right`}>Total Raised</th>
                            <th className={TH_CLS}>Created</th>
                            <th className={`${TH_CLS} pr-5`} />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => <SkeletonRow key={`sk${i}`} />)
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-sm italic text-[#9aa7b8]">
                                    {filtered ? "No campaigns match your filters." : "No campaigns yet."}
                                </td>
                            </tr>
                        ) : (
                            rows.map((c) => (
                                <tr key={c.slug} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                    <td className="py-3.5 pl-5 pr-4">
                                        <div className="flex items-center gap-3">
                                            {c.hero_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={c.hero_url} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-[#e7e9eb] object-cover" />
                                            ) : (
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7]">
                                                    <svg className="h-4 w-4 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-[#003060]">{c.name ?? <span className="italic text-[#9aa7b8]">Untitled</span>}</p>
                                                <p className="text-[11px] capitalize text-[#9aa7b8]">{c.campaign_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-[#003060]">{fmtUSD(c.total_raised)}</td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-[#9aa7b8]">{fmtDate(c.created_at)}</td>
                                    <td className="py-3.5 pl-4 pr-5 text-right">
                                        <Link href={`/admin/campaigns/${c.slug}`} className="text-[13px] font-semibold text-[#0268c0] hover:underline">View</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#7e8a96]">
                            Per page
                            <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-lg border border-[#e7e9eb] bg-white px-2 py-1 text-[12px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <span className="text-[12px] font-medium text-[#9aa7b8]">{from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page === 1 || loading} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            {pageList(page, totalPages).map((n, i) =>
                                n === "…" ? (
                                    <span key={`e${i}`} className="px-1 text-sm text-[#9aa7b8]">…</span>
                                ) : (
                                    <button key={n} onClick={() => goPage(n)} disabled={loading} className={`h-8 min-w-8 rounded-lg px-2 text-[13px] font-semibold transition-colors ${n === page ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-gray-100"}`}>{n}</button>
                                ),
                            )}
                            <button onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
