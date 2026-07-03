"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { AdminDonorRow } from "../_lib/donors-query";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
const STATUS_FILTERS = ["all", "donated", "contacted", "not_donated"] as const;
const STATUS_LABEL: Record<string, string> = { all: "All", donated: "Donated", contacted: "Contacted", not_donated: "Not Donated" };

const STATUS_COLORS: Record<string, string> = {
    donated:     "bg-green-100 text-green-700",
    contacted:   "bg-blue-100 text-blue-700",
    not_donated: "bg-gray-100 text-gray-500",
};

const TH_CLS     = "px-5 py-3.5 text-left text-[13px] font-semibold";
const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDateTime(ts: number) {
    const d = new Date(ts);
    return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
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
            <td className="py-4 pl-5 pr-4"><div className="animate-pulse space-y-1.5"><Bar w="w-28" /><Bar w="w-16" /></div></td>
            <td className="px-5 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-32" /><Bar w="w-20" /></div></td>
            <td className="px-5 py-4"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="px-5 py-4"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="px-5 py-4"><div className="ml-auto animate-pulse"><Bar w="w-14" /></div></td>
            <td className="px-5 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-20" /><Bar w="w-12" /></div></td>
        </tr>
    );
}

type Props = {
    campaignSlug:    string;
    initialDonors:   AdminDonorRow[];
    initialTotal:    number;
    totalRaised:     number;
    initialQuery:    string;
    initialStatus:   string;
    initialSort:     string;
    initialPage:     number;
    initialPageSize: number;
};

type FetchArgs = { page: number; search: string; status: string; sort: string; pageSize: number };

export default function AdminDonorsTable(props: Props) {
    const [rows,     setRows]     = useState<AdminDonorRow[]>(props.initialDonors);
    const [total,    setTotal]    = useState(props.initialTotal);
    const [search,   setSearch]   = useState(props.initialQuery);
    const [status,   setStatus]   = useState(props.initialStatus);
    const [sort,     setSort]     = useState(props.initialSort);
    const [page,     setPage]     = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.initialPageSize);
    const [loading,  setLoading]  = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionRef  = useRef<HTMLElement>(null);
    const reqId       = useRef(0);

    async function fetchPage(a: FetchArgs) {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(a.page), page_size: String(a.pageSize), q: a.search.trim(), status: a.status, sort: a.sort });
            const res = await fetch(`/api/v1/admin/campaigns/${props.campaignSlug}/donors?${params}`);
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { donors?: AdminDonorRow[]; total?: number } | null;
            if (id !== reqId.current) return;
            if (res.ok && data && Array.isArray(data.donors)) {
                setRows(data.donors);
                setTotal(data.total ?? 0);
            }
        } catch {
            /* keep rows on error */
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }
    function scrollToTop() { sectionRef.current?.scrollIntoView({ block: "start" }); }

    function onSearch(q: string) {
        setSearch(q);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPage({ page: 1, search: q, status, sort, pageSize }), 300);
    }
    function onStatus(s: string) { setStatus(s); setPage(1); fetchPage({ page: 1, search, status: s, sort, pageSize }); }
    function onSort(s: string)   { setSort(s);   setPage(1); fetchPage({ page: 1, search, status, sort: s, pageSize }); }
    function onPageSize(n: number) { setPageSize(n); setPage(1); fetchPage({ page: 1, search, status, sort, pageSize: n }); scrollToTop(); }
    function goPage(p: number)   { setPage(p); fetchPage({ page: p, search, status, sort, pageSize }); scrollToTop(); }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);
    const filtered = search.trim() !== "" || status !== "all";

    return (
        <section ref={sectionRef} id="donors" className="scroll-mt-6">
            <div className="mb-4 flex items-center gap-2.5">
                <h2 className="text-[20px] font-black text-[#003060]">Donors</h2>
                <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#5b6b7c]">{total}</span>
                <span className="text-[13px] text-[#9aa7b8]">· {fmtUSD(props.totalRaised)} raised</span>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search by name, email or phone…"
                        className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <select value={status} onChange={(e) => onStatus(e.target.value)} className={SELECT_CLS} aria-label="Filter donors by status">
                    {STATUS_FILTERS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLS} aria-label="Sort donors">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead>
                            <tr className="bg-[#0268c0] text-white">
                                <th className={`${TH_CLS} pl-5`}>Name</th>
                                <th className={TH_CLS}>Contact</th>
                                <th className={TH_CLS}>Added By</th>
                                <th className={TH_CLS}>Assigned To</th>
                                <th className={TH_CLS}>Status</th>
                                <th className={`${TH_CLS} text-right`}>Donated</th>
                                <th className={TH_CLS}>Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => <SkeletonRow key={`sk${i}`} />)
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm italic text-[#9aa7b8]">{filtered ? "No donors match your filters." : "No donors added yet."}</td></tr>
                            ) : (
                                rows.map((d) => {
                                    const donated = d.donations.reduce((s, don) => s + don.amount, 0);
                                    return (
                                        <tr key={d.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                            <td className="py-3.5 pl-5 pr-4">
                                                <p className="font-semibold text-[#003060]">{d.first_name} {d.last_name}</p>
                                                {(d.isWalkIn || d.isGeneralFund || d.isAnonymous) && (
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                                        {d.isWalkIn && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600">Walk-in</span>}
                                                        {d.isGeneralFund && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">General Fund</span>}
                                                        {d.isAnonymous && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Anonymous</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-[#7e8a96]">
                                                {d.email && <p className="text-[13px]">{d.email}</p>}
                                                {d.phone && <p className="text-[#9aa7b8]">{d.phone}</p>}
                                                {!d.email && !d.phone && <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-[13px] text-[#7e8a96]">
                                                {d.added_by_member ? (
                                                    d.added_by_member.user_id ? (
                                                        <Link href={`/admin/users/${d.added_by_member.user_id}`} className="text-[#0268c0] hover:underline">{d.added_by_member.first_name} {d.added_by_member.last_name}</Link>
                                                    ) : `${d.added_by_member.first_name} ${d.added_by_member.last_name}`
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-[13px] text-[#7e8a96]">
                                                {d.assigned_member ? (
                                                    d.assigned_member.user_id ? (
                                                        <Link href={`/admin/users/${d.assigned_member.user_id}`} className="text-[#0268c0] hover:underline">{d.assigned_member.first_name} {d.assigned_member.last_name}</Link>
                                                    ) : `${d.assigned_member.first_name} ${d.assigned_member.last_name}`
                                                ) : <span className="text-gray-300">Unassigned</span>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_COLORS[d.status] ?? "bg-gray-100 text-gray-500"}`}>{d.status.replace("_", " ")}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-[#003060]">{donated > 0 ? fmtUSD(donated) : <span className="text-gray-300">—</span>}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                {(() => { const dt = fmtDateTime(d.created_at); return <><p className="text-[13px] text-[#003060]">{dt.date}</p><p className="text-xs text-[#9aa7b8]">{dt.time}</p></>; })()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
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
        </section>
    );
}
