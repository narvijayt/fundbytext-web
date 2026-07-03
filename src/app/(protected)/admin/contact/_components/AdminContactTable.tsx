"use client";

import { useRef, useState } from "react";
import type { AdminContactRow } from "../_lib/query";
import ContactDetailModal from "./ContactDetailModal";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
const CONTACT_FILTERS = ["all", "unread"] as const;

const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
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
            <td className="py-4 pl-5 pr-4"><div className="animate-pulse space-y-1.5"><Bar w="w-28" /><Bar w="w-36" /></div></td>
            <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="px-4 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-full" /><Bar w="w-2/3" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-24" /></div></td>
            <td className="py-4 pl-4 pr-5"><div className="ml-auto h-3.5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
        </tr>
    );
}

type Props = {
    initialSubmissions: AdminContactRow[];
    initialTotal:       number;
    initialUnread:      number;
    initialQuery:       string;
    initialFilter:      string;
    initialSort:        string;
    initialPage:        number;
    initialPageSize:    number;
};

type FetchArgs = { page: number; search: string; filter: string; sort: string; pageSize: number };

export default function AdminContactTable(props: Props) {
    const [rows,     setRows]     = useState<AdminContactRow[]>(props.initialSubmissions);
    const [total,    setTotal]    = useState(props.initialTotal);
    const [unread,   setUnread]   = useState(props.initialUnread);
    const [search,   setSearch]   = useState(props.initialQuery);
    const [filter,   setFilter]   = useState(props.initialFilter);
    const [sort,     setSort]     = useState(props.initialSort);
    const [page,     setPage]     = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.initialPageSize);
    const [loading,  setLoading]  = useState(false);
    const [busyId,   setBusyId]   = useState<string | null>(null);
    const [view,     setView]     = useState<AdminContactRow | null>(null);

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
            const res = await fetch(`/api/v1/admin/contact?${params}`);
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { submissions?: AdminContactRow[]; total?: number; unread?: number } | null;
            if (id !== reqId.current) return;
            if (res.ok && data && Array.isArray(data.submissions)) {
                setRows(data.submissions);
                setTotal(data.total ?? 0);
                if (typeof data.unread === "number") {
                    setUnread(data.unread);
                    // Keep the sidebar's unread-contacts badge in sync (mark read/unread, etc.)
                    window.dispatchEvent(new CustomEvent("admin:contacts-unread", { detail: data.unread }));
                }
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

    async function toggleRead(id: string, next: boolean) {
        setBusyId(id);
        try {
            const res = await fetch(`/api/v1/admin/contact/${id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ is_read: next }),
            });
            if (res.ok) await fetchPage({ page, search, filter, sort, pageSize });
        } catch {
            /* ignore — leave row as-is */
        } finally {
            setBusyId(null);
        }
    }

    // Toggle from the detail modal — also update the open snapshot so it reflects immediately.
    function toggleReadFromModal() {
        if (!view) return;
        const next = !view.is_read;
        setView({ ...view, is_read: next });
        toggleRead(view.id, next);
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);

    return (
        <div ref={sectionRef} className="scroll-mt-6">
            <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} total · {unread.toLocaleString()} unread</p>

            {/* Filters + search */}
            <div className="mb-5 mt-6 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1 sm:max-w-72">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search name, email, message or type…"
                        className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white p-1 text-xs font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                    {CONTACT_FILTERS.map((f) => (
                        <button key={f} onClick={() => onFilter(f)} className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:bg-gray-50 hover:text-[#003060]"}`}>
                            {f}{f === "unread" && unread > 0 ? ` (${unread})` : ""}
                        </button>
                    ))}
                </div>

                <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLS} aria-label="Sort submissions">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="bg-[#0268c0] text-white">
                                <th className="w-[200px] px-4 py-3.5 pl-5 text-left text-[13px] font-semibold">From</th>
                                <th className="w-[150px] px-4 py-3.5 text-left text-[13px] font-semibold">Inquiry Type</th>
                                <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Message</th>
                                <th className="w-[150px] px-4 py-3.5 text-left text-[13px] font-semibold">Received</th>
                                <th className="w-[110px] py-3.5 pl-4 pr-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => <SkeletonRow key={`sk${i}`} />)
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-14 text-center text-sm italic text-[#9aa7b8]">
                                        {search.trim() || filter !== "all" ? "No submissions match your filters." : "No contact submissions yet."}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => setView(s)}
                                        className={`cursor-pointer border-b border-[#eef1f4] align-top transition-colors last:border-0 ${s.is_read ? "hover:bg-[#f7f9fb]" : "bg-blue-50/40 hover:bg-blue-50/70"}`}
                                    >
                                        <td className="py-4 pl-5 pr-4">
                                            <div className="flex items-start gap-2">
                                                {!s.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0268c0]" title="Unread" />}
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-[#003060]">{s.first_name} {s.last_name}</p>
                                                    <a href={`mailto:${s.email}`} onClick={(e) => e.stopPropagation()} className="break-all text-xs text-[#0268c0] hover:underline">{s.email}</a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center rounded-full bg-[#feece4] px-2.5 py-1 text-[11px] font-semibold text-[#f47435]">{s.inquiry_type}</span>
                                        </td>
                                        <td className="max-w-md px-4 py-4 text-[13px] text-[#7e8a96]">
                                            <p className="line-clamp-2 leading-relaxed">{s.message}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#7e8a96]">{fmtDate(s.created_at)}</td>
                                        <td className="py-4 pl-4 pr-5 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleRead(s.id, !s.is_read); }}
                                                disabled={busyId === s.id}
                                                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0268c0] transition-colors hover:bg-[#0268c0]/10 disabled:opacity-50"
                                            >
                                                {busyId === s.id ? "…" : s.is_read ? "Mark unread" : "Mark read"}
                                            </button>
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

            {view && (
                <ContactDetailModal
                    submission={view}
                    busy={busyId === view.id}
                    onToggleRead={toggleReadFromModal}
                    onClose={() => setView(null)}
                />
            )}
        </div>
    );
}
