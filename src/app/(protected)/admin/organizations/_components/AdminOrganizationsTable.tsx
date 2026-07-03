"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { AdminOrganizationRow } from "../_lib/query";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const TH_CLS     = "px-4 py-3.5 text-left text-[13px] font-semibold";
const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

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
            <td className="py-4 pl-5 pr-4">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-200" />
                    <Bar w="w-32" />
                </div>
            </td>
            <td className="px-4 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-28" /><Bar w="w-36" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-16" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-16" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="py-4 pl-4 pr-5"><div className="ml-auto h-3.5 w-10 animate-pulse rounded-full bg-gray-200" /></td>
        </tr>
    );
}

type Props = {
    initialOrganizations: AdminOrganizationRow[];
    initialTotal:         number;
    initialQuery:         string;
    initialFilter:        string;
    initialSort:          string;
    initialPage:          number;
    initialPageSize:      number;
};

type FetchArgs = { page: number; search: string; filter: string; sort: string; pageSize: number };

export default function AdminOrganizationsTable(props: Props) {
    const [rows,     setRows]     = useState<AdminOrganizationRow[]>(props.initialOrganizations);
    const [total,    setTotal]    = useState(props.initialTotal);
    const [search,   setSearch]   = useState(props.initialQuery);
    const [filter,   setFilter]   = useState(props.initialFilter);
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
            const params = new URLSearchParams({
                page: String(a.page), page_size: String(a.pageSize), q: a.search.trim(), filter: a.filter, sort: a.sort,
            });
            const res = await fetch(`/api/v1/admin/organizations?${params}`);
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { organizations?: AdminOrganizationRow[]; total?: number } | null;
            if (id !== reqId.current) return;
            if (res.ok && data && Array.isArray(data.organizations)) {
                setRows(data.organizations);
                setTotal(data.total ?? 0);
            }
        } catch {
            /* keep current rows on error */
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }

    function scrollToTop() { sectionRef.current?.scrollIntoView({ block: "start" }); }

    function onSearch(q: string) {
        setSearch(q);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPage({ page: 1, search: q, filter, sort, pageSize }), 300);
    }
    function onFilter(f: string) { setFilter(f); setPage(1); fetchPage({ page: 1, search, filter: f, sort, pageSize }); }
    function onSort(s: string)   { setSort(s);   setPage(1); fetchPage({ page: 1, search, filter, sort: s, pageSize }); }
    function onPageSize(n: number) { setPageSize(n); setPage(1); fetchPage({ page: 1, search, filter, sort, pageSize: n }); scrollToTop(); }
    function goPage(p: number)   { setPage(p); fetchPage({ page: p, search, filter, sort, pageSize }); scrollToTop(); }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);

    return (
        <div ref={sectionRef} className="scroll-mt-6">
            <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total</p>

            {/* Filters + search */}
            <div className="mb-5 mt-6 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1 sm:max-w-72">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search by name or creator…"
                        className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                <select value={filter} onChange={(e) => onFilter(e.target.value)} className={SELECT_CLS} aria-label="Filter organizations">
                    <option value="all">All Organizations</option>
                    <option value="has_active">Has Active Campaigns</option>
                    <option value="no_campaigns">No Campaigns</option>
                </select>

                <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLS} aria-label="Sort organizations">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_campaigns">Most Campaigns</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
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
                            {loading ? (
                                Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => <SkeletonRow key={`sk${i}`} />)
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-14 text-center text-sm italic text-[#9aa7b8]">
                                        {search.trim() || filter !== "all" ? "No organizations match your filters." : "No organizations found."}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((org) => (
                                    <tr key={org.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                        <td className="py-3.5 pl-5 pr-4 text-[13px] font-medium text-[#003060]">
                                            <div className="flex items-center gap-3">
                                                {org.logo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={org.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-[#e7e9eb] object-cover" />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-xs font-bold uppercase text-[#7e8a96]">{org.name[0]}</div>
                                                )}
                                                <span>{org.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#7e8a96]">
                                            <Link href={`/admin/users/${org.creator.id}`} className="font-medium text-[#003060] hover:text-[#0268c0] hover:underline">{org.creator.first_name} {org.creator.last_name}</Link>
                                            <p className="text-xs text-[#9aa7b8]">{org.creator.email}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#7e8a96]">
                                            <span>{org.campaigns_count}</span>
                                            {org.active_campaigns > 0 && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">{org.active_campaigns} active</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] font-bold text-[#003060]">{fmtUSD(org.total_raised)}</td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#7e8a96]">{fmtDate(org.created_at)}</td>
                                        <td className="py-3.5 pl-4 pr-5 text-right">
                                            <Link href={`/admin/organizations/${org.id}`} className="text-[13px] font-semibold text-[#0268c0] hover:underline">View</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer: page size + range + numbered pager */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-[#7e8a96]">
                        Show per page:
                        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                    {total > 0 && <span className="text-[13px] font-medium text-[#9aa7b8]">Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page === 1 || loading} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        {pageList(page, totalPages).map((n, i) =>
                            n === "…" ? (
                                <span key={`e${i}`} className="px-1.5 text-sm text-[#9aa7b8]">…</span>
                            ) : (
                                <button key={n} onClick={() => goPage(n)} disabled={loading} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${n === page ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-gray-100"}`}>{n}</button>
                            ),
                        )}
                        <button onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
