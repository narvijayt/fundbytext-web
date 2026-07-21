"use client";

import { useRef, useState } from "react";
import type { AdminCampaignRow } from "../_lib/query";
import CampaignCard, { type CampaignCardData } from "@/app/(protected)/dashboard/_components/CampaignCard";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
const STATUS_FILTERS = ["all", "active", "upcoming", "draft", "completed"] as const;

const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

// Compact numbered pager: 1 … around-current … N
function pageList(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    if (current > 3) out.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
    if (current < total - 2) out.push("…");
    out.push(total);
    return out;
}

/* The admin query returns a serialized row (ISO dates, plain numbers, a single
   hero url). CampaignCard wants the dashboard shape, so map across here rather
   than widening the card's type for one caller. myRoles/myDonorCount are the
   viewer's own role data, which an admin has none of — the "admin" variant
   ignores both and shows the campaign's real totals. */
function toCardData(c: AdminCampaignRow): CampaignCardData {
    return {
        id:                  c.id,
        slug:                c.slug,
        name:                c.name,
        status:              c.status,
        campaign_type:       c.campaign_type,
        current_step:        c.current_step,
        goal_type:           c.goal_type,
        goal_amount:         c.goal_amount,
        initial_goal_amount: c.initial_goal_amount,
        total_raised:        c.total_raised,
        start_date:          c.start_date ? new Date(c.start_date) : null,
        end_date:            c.end_date   ? new Date(c.end_date)   : null,
        created_at:          new Date(c.created_at),
        timezone:            c.timezone,
        myRoles:             [],
        myDonorCount:        0,
        media:               c.hero_url ? [{ media_type: "hero", url: c.hero_url }] : [],
        payout:              c.payout,
        _count:              { members: c.members_count, donors: c.donors_count, donations: c.donations_count },
    };
}

/* Matches the card's silhouette (hero band + body) so the grid doesn't jump
   when a page lands. */
function CardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white">
            <div className="h-[200px] animate-pulse bg-gray-100" />
            <div className="flex flex-col gap-3 px-4 pt-4 pb-5">
                <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-2.5 w-full animate-pulse rounded-full bg-gray-100" />
                <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
        </div>
    );
}

type Props = {
    initialCampaigns: AdminCampaignRow[];
    initialTotal:     number;
    initialQuery:     string;
    initialFilter:    string;
    initialSort:      string;
    initialPage:      number;
    initialPageSize:  number;
};

type FetchArgs = { page: number; search: string; filter: string; sort: string; pageSize: number };

export default function AdminCampaignsTable(props: Props) {
    const [rows,     setRows]     = useState<AdminCampaignRow[]>(props.initialCampaigns);
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

    async function fetchPage({ page: p, search: q, filter: f, sort: s, pageSize: size }: FetchArgs) {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page:      String(p),
                page_size: String(size),
                q:         q.trim(),
                filter:    f,
                sort:      s,
            });
            const res  = await fetch(`/api/v1/admin/campaigns?${params}`);
            // Ignore out-of-order responses (a later request already superseded this one)
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { campaigns?: AdminCampaignRow[]; total?: number } | null;
            if (id !== reqId.current) return;
            // Only apply well-formed responses; on error keep the current rows in place.
            if (res.ok && data && Array.isArray(data.campaigns)) {
                setRows(data.campaigns);
                setTotal(data.total ?? 0);
            }
        } catch {
            /* network error — keep current rows */
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }

    function scrollToTop() {
        sectionRef.current?.scrollIntoView({ block: "start" });
    }

    function onSearch(q: string) {
        setSearch(q);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPage({ page: 1, search: q, filter, sort, pageSize }), 300);
    }
    function onFilter(f: string) {
        setFilter(f);
        setPage(1);
        fetchPage({ page: 1, search, filter: f, sort, pageSize });
    }
    function onSort(s: string) {
        setSort(s);
        setPage(1);
        fetchPage({ page: 1, search, filter, sort: s, pageSize });
    }
    function onPageSize(n: number) {
        setPageSize(n);
        setPage(1);
        fetchPage({ page: 1, search, filter, sort, pageSize: n });
        scrollToTop();
    }
    function goPage(p: number) {
        setPage(p);
        fetchPage({ page: p, search, filter, sort, pageSize });
        scrollToTop();
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);

    return (
        <div ref={sectionRef} className="scroll-mt-6">
            <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total</p>

            {/* Filters + search */}
            <div className="mb-5 mt-6 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1 md:max-w-xs">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name or slug…"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button
                            onClick={() => onSearch("")}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white p-1 text-xs font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilter(f)}
                            className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                                filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:bg-gray-50 hover:text-[#003060]"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLS} aria-label="Sort campaigns">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="most_raised">Most raised</option>
                    <option value="most_donations">Most donations</option>
                </select>
            </div>

            {/* Card grid — the same CampaignCard the dashboard and public browse
                use, in its "admin" variant (admin links, real totals, organizer
                shown under the title). Replaces the bespoke table so the three
                listings stay visually identical. */}
            {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => <CardSkeleton key={`sk${i}`} />)}
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e7e9eb] bg-white py-20 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2f6]">
                        <svg className="h-7 w-7 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <p className="font-semibold text-[#003060]">
                        {search.trim() || filter !== "all" ? "No campaigns match your filters" : "No campaigns yet"}
                    </p>
                    <p className="mt-1 text-sm text-[#9aa7b8]">
                        {search.trim() || filter !== "all" ? "Try a different search or filter." : "Campaigns will appear here once they are created."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((c) => (
                        <CampaignCard key={c.id} variant="admin" organizer={c.organizer} campaign={toCardData(c)} />
                    ))}
                </div>
            )}

            {/* Footer: page size + range + numbered pager */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-[#7e8a96]">
                        Show per page:
                        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                    {total > 0 && (
                        <span className="text-[13px] font-medium text-[#9aa7b8]">
                            Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
                        </span>
                    )}
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
