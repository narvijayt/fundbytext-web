"use client";

import { useRef, useState } from "react";
import type { UserSessionRow } from "../_lib/detail-query";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const SESSION_FILTERS = ["all", "active", "revoked", "expired"] as const;

const CARD   = "overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]";
const TH_CLS = "px-5 py-3 text-left text-[12px] font-semibold";

const STATUS_STYLES: Record<string, string> = {
    active:  "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-500",
    revoked: "bg-red-100 text-red-600",
};

function fmtDateTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtRelative(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000), hours = Math.floor(diff / 3_600_000), days = Math.floor(diff / 86_400_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return fmtDateTime(ts);
}
function parseBrowser(ua: string | null): string {
    if (!ua) return "Unknown";
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Chrome/")) return "Chrome";
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
    return "Browser";
}
function isMobileBrowserUA(ua: string | null): boolean {
    return ua ? /Mobile|Android|iPhone|iPad/.test(ua) : false;
}
function sessionStatus(s: UserSessionRow): "active" | "expired" | "revoked" {
    if (s.revoked_at !== null) return "revoked";
    if (s.expires_at !== null && s.expires_at < Date.now()) return "expired";
    return "active";
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
            <td className="py-3.5 pl-5 pr-4"><div className="flex items-center gap-2 animate-pulse"><div className="h-4 w-4 rounded bg-gray-200" /><div className="space-y-1.5"><Bar w="w-20" /><Bar w="w-16" /></div></div></td>
            <td className="px-5 py-3.5"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="px-5 py-3.5"><div className="animate-pulse space-y-1.5"><Bar w="w-24" /><Bar w="w-12" /></div></td>
            <td className="px-5 py-3.5"><div className="animate-pulse"><Bar w="w-20" /></div></td>
            <td className="px-5 py-3.5"><div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="py-3.5 pl-4 pr-5"><div className="ml-auto h-3.5 w-12 animate-pulse rounded-full bg-gray-200" /></td>
        </tr>
    );
}

type Props = {
    userId:            string;
    initialSessions:   UserSessionRow[];
    initialTotal:      number;
    initialActive:     number;
    initialGrand:      number;
    initialQuery:      string;
    initialFilter:     string;
    initialPage:       number;
    initialPageSize:   number;
};

type FetchArgs = { page: number; search: string; filter: string; pageSize: number };

export default function UserSessionsTable(props: Props) {
    const [rows,     setRows]     = useState<UserSessionRow[]>(props.initialSessions);
    const [total,    setTotal]    = useState(props.initialTotal);
    const [active,   setActive]   = useState(props.initialActive);
    const [grand,    setGrand]    = useState(props.initialGrand);
    const [search,   setSearch]   = useState(props.initialQuery);
    const [filter,   setFilter]   = useState(props.initialFilter);
    const [page,     setPage]     = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.initialPageSize);
    const [loading,  setLoading]  = useState(false);
    const [revoking,   setRevoking]   = useState<string | null>(null); // id | "all"
    const [confirming, setConfirming] = useState<string | null>(null); // id | "all"
    const [error,      setError]      = useState("");

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionRef  = useRef<HTMLDivElement>(null);
    const reqId       = useRef(0);

    async function fetchPage(a: FetchArgs) {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(a.page), page_size: String(a.pageSize), q: a.search.trim(), filter: a.filter });
            const res = await fetch(`/api/v1/admin/users/${props.userId}/sessions?${params}`);
            if (id !== reqId.current) return;
            const data = await res.json().catch(() => null) as { sessions?: UserSessionRow[]; total?: number; activeTotal?: number; grandTotal?: number } | null;
            if (id !== reqId.current) return;
            if (res.ok && data && Array.isArray(data.sessions)) {
                setRows(data.sessions);
                setTotal(data.total ?? 0);
                if (typeof data.activeTotal === "number") setActive(data.activeTotal);
                if (typeof data.grandTotal === "number")  setGrand(data.grandTotal);
            }
        } catch {
            /* keep rows on error */
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }
    function refresh() { return fetchPage({ page, search, filter, pageSize }); }
    function scrollToTop() { sectionRef.current?.scrollIntoView({ block: "nearest" }); }

    function onSearch(q: string) {
        setSearch(q);
        setPage(1);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchPage({ page: 1, search: q, filter, pageSize }), 300);
    }
    function onFilter(f: string) { setFilter(f); setPage(1); fetchPage({ page: 1, search, filter: f, pageSize }); }
    function onPageSize(n: number) { setPageSize(n); setPage(1); fetchPage({ page: 1, search, filter, pageSize: n }); }
    function goPage(p: number)   { setPage(p); fetchPage({ page: p, search, filter, pageSize }); scrollToTop(); }

    async function revokeOne(sessionId: string) {
        setRevoking(sessionId); setConfirming(null); setError("");
        try {
            const res = await fetch(`/api/v1/admin/users/${props.userId}/sessions/${sessionId}`, { method: "DELETE" });
            if (res.ok) await refresh();
            else { const j = await res.json().catch(() => ({})); setError(j.error ?? "Failed to revoke session."); }
        } catch { setError("Failed to revoke session."); }
        finally { setRevoking(null); }
    }
    async function revokeAll() {
        setRevoking("all"); setConfirming(null); setError("");
        try {
            const res = await fetch(`/api/v1/admin/users/${props.userId}/sessions`, { method: "DELETE" });
            if (res.ok) await refresh();
            else { const j = await res.json().catch(() => ({})); setError(j.error ?? "Failed to revoke sessions."); }
        } catch { setError("Failed to revoke sessions."); }
        finally { setRevoking(null); }
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to   = Math.min(page * pageSize, total);
    const filtered = search.trim() !== "" || filter !== "all";

    return (
        <div ref={sectionRef} className={`${CARD} scroll-mt-4`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] px-5 py-4">
                <div>
                    <h2 className="text-[16px] font-bold text-[#003060]">Sessions</h2>
                    <p className="mt-0.5 text-xs text-[#9aa7b8]">{active.toLocaleString()} active · {grand.toLocaleString()} total</p>
                </div>
                {active > 0 && (
                    confirming === "all" ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#7e8a96]">Revoke all {active} active?</span>
                            <button onClick={revokeAll} disabled={revoking === "all"} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50">{revoking === "all" ? "Revoking…" : "Yes, revoke all"}</button>
                            <button onClick={() => setConfirming(null)} className="rounded-lg border border-[#e7e9eb] px-3 py-1.5 text-xs font-semibold text-[#7e8a96] transition-colors hover:bg-gray-50 hover:text-[#003060]">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirming("all")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50">Revoke All Active</button>
                    )
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eef1f4] px-5 py-3">
                <div className="relative min-w-[160px] flex-1 sm:max-w-[240px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search IP or device…"
                        className="w-full rounded-lg border border-[#e7e9eb] bg-white py-2 pl-9 pr-8 text-[13px] text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#e7e9eb] bg-white p-1 text-[11px] font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                    {SESSION_FILTERS.map((f) => (
                        <button key={f} onClick={() => onFilter(f)} className={`rounded-md px-2.5 py-1 capitalize transition-colors ${filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:bg-gray-50 hover:text-[#003060]"}`}>{f}</button>
                    ))}
                </div>
            </div>

            {error && <div className="border-b border-red-100 bg-red-50 px-5 py-2"><p className="text-xs text-red-600">{error}</p></div>}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                    <thead>
                        <tr className="bg-[#0268c0] text-white">
                            <th className={`${TH_CLS} pl-5`}>Device</th>
                            <th className={TH_CLS}>IP Address</th>
                            <th className={TH_CLS}>Signed In</th>
                            <th className={TH_CLS}>Expires</th>
                            <th className={TH_CLS}>Status</th>
                            <th className={`${TH_CLS} pr-5`} />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => <SkeletonRow key={`sk${i}`} />)
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">
                                    {filtered ? "No sessions match the current filters." : "No sessions found."}
                                </td>
                            </tr>
                        ) : (
                            rows.map((s) => {
                                const status = sessionStatus(s);
                                const isConfirming = confirming === s.id;
                                return (
                                    <tr key={s.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                        <td className="py-3.5 pl-5 pr-4">
                                            <div className="flex items-center gap-2">
                                                {s.is_mobile ? (
                                                    <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                ) : (
                                                    <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-medium text-[#003060]">{s.is_mobile ? "Mobile App" : parseBrowser(s.user_agent)}</p>
                                                    <p className="max-w-45 truncate text-[10px] text-[#9aa7b8]" title={s.user_agent ?? undefined}>{s.is_mobile ? "Native App" : isMobileBrowserUA(s.user_agent) ? "Mobile Browser" : "Desktop Browser"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-[#7e8a96]">{s.ip_address ?? <span className="text-gray-300">—</span>}</td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#7e8a96]">
                                            <p className="text-[#003060]">{fmtDateTime(s.created_at)}</p>
                                            <p className="text-[#9aa7b8]">{fmtRelative(s.created_at)}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#9aa7b8]">{s.expires_at ? fmtDateTime(s.expires_at) : "Never"}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                                        </td>
                                        <td className="whitespace-nowrap py-3.5 pl-4 pr-5 text-right">
                                            {status === "active" && (
                                                isConfirming ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => revokeOne(s.id)} disabled={revoking === s.id} className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50">{revoking === s.id ? "…" : "Confirm"}</button>
                                                        <button onClick={() => setConfirming(null)} className="text-xs font-semibold text-[#9aa7b8] transition-colors hover:text-[#003060]">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirming(s.id)} disabled={revoking === s.id} className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700 disabled:opacity-50">Revoke</button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#7e8a96]">
                        Per page
                        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-lg border border-[#e7e9eb] bg-white px-2 py-1 text-[12px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                    {total > 0 && <span className="text-[12px] font-medium text-[#9aa7b8]">{from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>}
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
        </div>
    );
}
