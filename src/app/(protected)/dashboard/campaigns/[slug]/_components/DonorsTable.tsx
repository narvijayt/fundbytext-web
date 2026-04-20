"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddDonorModal from "./AddDonorModal";
import DonorDetailModal from "./DonorDetailModal";

export type DonorRow = {
    id:               string;
    first_name:       string;
    last_name:        string;
    email:            string | null;
    phone:            string | null;
    status:           string;
    source:           string;
    email_valid:      boolean;
    invite_token:     string | null;   // null = walk-in (paid via ref link, never pre-added)
    short_code:       string | null;
    created_at:       number;          // timestamp — when donor was added ("Last Contacted")
    assigned_member:  { id: string; first_name: string; last_name: string; invite_token: string | null } | null;
    added_by_member:  { id: string; first_name: string; last_name: string; roles: { role: string }[] } | null;
    donations:        { amount: number; donated_at: number; is_anonymous: boolean }[];
};

type Participant = { id: string; first_name: string; last_name: string };

type Props = {
    donors:        DonorRow[];
    initialTotal?: number;
    campaignSlug:  string;
    isOrganizer:   boolean;
    participants:  Participant[];
    myMemberId?:   string;
    topDonorId?:   string | null;
    isCompleted?:  boolean;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    donated:     { label: "Donated",     cls: "bg-green-100 text-green-700" },
    contacted:   { label: "Contacted",   cls: "bg-blue-100 text-blue-700"   },
    not_donated: { label: "Not Donated", cls: "bg-gray-100 text-gray-500"   },
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDateTime(ts: number | null | undefined): { date: string; time: string } | null {
    if (!ts) return null;
    const d = new Date(ts);
    return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
}

const PAGE_SIZE = 5;

type FetchParams = { page: number; search: string; status: string; member: string; source: string; emailValid: string; sort: string };

export default function DonorsTable({ donors: initialDonors, initialTotal, campaignSlug, isOrganizer, participants, myMemberId, topDonorId: initialTopDonorId, isCompleted }: Props) {
    const router = useRouter();
    const showAssignment = isOrganizer && participants.length > 0;
    const [donors,       setDonors]       = useState<DonorRow[]>(initialDonors);
    const [total,        setTotal]        = useState(initialTotal ?? initialDonors.length);
    const [topDonorId,   setTopDonorId]   = useState<string | null>(initialTopDonorId ?? null);

    // Keep in sync when server prop changes (e.g. after router.refresh())
    useEffect(() => {
        setTopDonorId(initialTopDonorId ?? null);
    }, [initialTopDonorId]);
    const [search,       setSearch]       = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [memberFilter, setMemberFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [emailValid,   setEmailValid]   = useState("all");
    const [sort,         setSort]         = useState("date_desc");
    const [page,         setPage]         = useState(1);
    const [loading,      setLoading]      = useState(false);
    const [addOpen,      setAddOpen]      = useState(false);
    const [viewDonorId,  setViewDonorId]  = useState<string | null>(null);
    const [copiedId,     setCopiedId]     = useState<string | null>(null);
    const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchStateRef = useRef<FetchParams>({ page: 1, search: "", status: "all", member: "all", source: "all", emailValid: "all", sort: "date_desc" });

    // Keep ref in sync so the event listener below always has current values
    fetchStateRef.current = { page, search, status: statusFilter, member: memberFilter, source: sourceFilter, emailValid, sort };

    async function fetchPage({ page: p, search: q, status: s, member: m, source: src, emailValid: ev, sort: srt }: FetchParams) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                skip:        String((p - 1) * PAGE_SIZE),
                take:        String(PAGE_SIZE),
                search:      q,
                status:      s,
                member_id:   m,
                source:      src,
                email_valid: ev,
                sort:        srt,
                ...(!isOrganizer ? { participant_view: "1" } : {}),
            });
            const res  = await fetch(`/api/v1/campaigns/${campaignSlug}/donors?${params}`);
            const data = await res.json() as { donors: DonorRow[]; total: number; topDonorId?: string | null };
            setDonors(data.donors);
            setTotal(data.total);
            if (data.topDonorId !== undefined) setTopDonorId(data.topDonorId);
        } finally {
            setLoading(false);
        }
    }

    // Re-fetch current page when a donation arrives via Ably
    useEffect(() => {
        const handler = () => {
            const f = fetchStateRef.current;
            fetchPage(f);
        };
        window.addEventListener("dashboard:donation", handler);
        return () => window.removeEventListener("dashboard:donation", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignSlug]);

    function currentFilters(): FetchParams {
        return { page, search, status: statusFilter, member: memberFilter, source: sourceFilter, emailValid, sort };
    }

    function handleSearchChange(q: string) {
        setSearch(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchPage({ ...currentFilters(), page: 1, search: q });
        }, 300);
    }

    function handleFilterChange(updates: Partial<FetchParams>) {
        const next = { ...currentFilters(), ...updates, page: 1 };
        if ("status"      in updates) setStatusFilter(updates.status!);
        if ("member"      in updates) setMemberFilter(updates.member!);
        if ("source"      in updates) setSourceFilter(updates.source!);
        if ("emailValid"  in updates) setEmailValid(updates.emailValid!);
        if ("sort"        in updates) setSort(updates.sort!);
        setPage(1);
        fetchPage(next);
    }

    function goToPage(p: number) {
        setPage(p);
        fetchPage({ ...currentFilters(), page: p });
    }

    async function handleExport() {
        const params = new URLSearchParams({ skip: "0", take: "10000", search, status: statusFilter, member_id: memberFilter, source: sourceFilter, email_valid: emailValid, sort });
        const res  = await fetch(`/api/v1/campaigns/${campaignSlug}/donors?${params}`);
        const data = await res.json() as { donors: DonorRow[] };
        const rows = [
            ["First Name", "Last Name", "Email", "Phone", "Status", "Last Contacted", "Date Donated", "Amount Donated", "Assigned To"],
            ...data.donors.map((d) => {
                const latestDonation = d.donations.length > 0
                    ? d.donations.reduce((a, b) => a.donated_at > b.donated_at ? a : b)
                    : null;
                const totalDonated = d.donations.reduce((s, don) => s + don.amount, 0);
                return [
                    d.first_name, d.last_name,
                    d.email ?? "", d.phone ?? "",
                    STATUS_BADGE[d.status]?.label ?? d.status,
                    (() => { const dt = fmtDateTime(d.created_at); return dt ? `${dt.date} ${dt.time}` : ""; })(),
                    latestDonation ? (() => { const dt = fmtDateTime(latestDonation.donated_at); return dt ? `${dt.date} ${dt.time}` : ""; })() : "",
                    totalDonated > 0 ? totalDonated.toFixed(2) : "",
                    d.assigned_member ? `${d.assigned_member.first_name} ${d.assigned_member.last_name}` : "",
                ];
            }),
        ];
        const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `donors-${campaignSlug}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <div id="donors" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-gray-900 flex-1">Donors</h2>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {total}
                    </span>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Export
                    </button>
                    {!isCompleted && (
                        <button
                            onClick={() => setAddOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Donor
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-50 flex flex-wrap gap-2">
                    <input
                        type="text"
                        placeholder="Search by name, email or phone…"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange({ status: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                        <option value="all">All Statuses</option>
                        <option value="not_donated">Not Donated</option>
                        <option value="contacted">Contacted</option>
                        <option value="donated">Donated</option>
                    </select>
                    {showAssignment && (
                        <select
                            value={memberFilter}
                            onChange={(e) => handleFilterChange({ member: e.target.value })}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        >
                            <option value="all">All Participants</option>
                            <option value="unassigned">Unassigned</option>
                            {participants.map((p) => (
                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={sourceFilter}
                        onChange={(e) => handleFilterChange({ source: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                        <option value="all">All Sources</option>
                        <option value="invited">Assigned by organizer</option>
                        <option value="self_added">Added by participant</option>
                        <option value="walk_in">Walk-in</option>
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => handleFilterChange({ sort: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                        <option value="date_desc">Newest first</option>
                        <option value="date_asc">Oldest first</option>
                        <option value="amount_desc">Most donated</option>
                        <option value="name_asc">Name A–Z</option>
                    </select>
                </div>

                {/* Table */}
                {donors.length === 0 && !loading ? (
                    <div className="px-6 py-12 text-center">
                        <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p className="text-sm text-gray-400">No donors yet</p>
                        {!isCompleted && (
                            <button
                                onClick={() => setAddOpen(true)}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                </svg>
                                Add First Donor
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Donor</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Contact</th>
                                    {showAssignment && (
                                        <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Assigned To</th>
                                    )}
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Last Contacted</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Date Donated</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Donated</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donors.map((d) => {
                                    const sb             = STATUS_BADGE[d.status] ?? STATUS_BADGE.not_donated;
                                    const donated        = d.donations.reduce((s, don) => s + don.amount, 0);
                                    const latestDonation = d.donations.length > 0
                                        ? d.donations.reduce((a, b) => a.donated_at > b.donated_at ? a : b)
                                        : null;
                                    const isAnonymous    = d.donations.some((don) => don.is_anonymous);
                                    const isGeneralFund  = donated > 0 && !d.assigned_member;
                                    return (
                                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                                        {d.first_name[0]}{d.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-gray-900">{d.first_name} {d.last_name}</p>
                                                            {!d.invite_token && (
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 whitespace-nowrap">
                                                                    Walk-in
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {!d.email_valid && (
                                                                <span className="text-[10px] text-red-500">Invalid email</span>
                                                            )}
                                                            {d.added_by_member && d.source !== "link_self" && d.source !== "self_added" && (() => {
                                                                const addedByMe  = d.added_by_member.id === myMemberId;
                                                                const adderIsOrg = d.added_by_member.roles.some(r => r.role === "organizer");
                                                                if (!adderIsOrg) return null;
                                                                if (isOrganizer && addedByMe)
                                                                    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap bg-orange-50 text-orange-600">Added by me</span>;
                                                                if (!isOrganizer)
                                                                    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap bg-blue-50 text-blue-600">Pre-assigned by organizer</span>;
                                                                return null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-gray-500">
                                                <p>{d.email ?? "—"}</p>
                                                {d.phone && <p className="text-xs text-gray-400">{d.phone}</p>}
                                            </td>
                                            {showAssignment && (
                                                <td className="px-6 py-3.5 text-sm">
                                                    {d.assigned_member ? (
                                                        <span className="text-gray-600">{d.assigned_member.first_name} {d.assigned_member.last_name}</span>
                                                    ) : isGeneralFund ? (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 whitespace-nowrap">General Fund</span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-3.5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sb.cls}`}>{sb.label}</span>
                                                    {isAnonymous && (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 whitespace-nowrap">Anonymous</span>
                                                    )}
                                                    {topDonorId === d.id && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 whitespace-nowrap flex items-center gap-0.5">
                                                            <svg className="w-2.5 h-2.5 fill-yellow-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                                            Top Donor
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                {(() => { const dt = fmtDateTime(d.created_at); return dt ? <><p className="text-sm text-gray-500">{dt.date}</p><p className="text-xs text-gray-400">{dt.time}</p></> : <span className="text-gray-300">—</span>; })()}
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                {(() => { const dt = fmtDateTime(latestDonation?.donated_at); return dt ? <><p className="text-sm text-gray-500">{dt.date}</p><p className="text-xs text-gray-400">{dt.time}</p></> : <span className="text-gray-300">—</span>; })()}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                                                {donated > 0 ? fmt(donated) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {d.short_code && (d.email || d.phone) && (
                                                        <button
                                                            title={copiedId === d.id ? "Copied!" : "Copy donor link"}
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/d/${d.short_code}`;
                                                                navigator.clipboard.writeText(url);
                                                                setCopiedId(d.id);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                            }}
                                                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                                                        >
                                                            {copiedId === d.id ? (
                                                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                                                </svg>
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setViewDonorId(d.id)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => goToPage(Math.max(1, page - 1))}
                                disabled={page === 1 || loading}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => goToPage(Math.min(Math.ceil(total / PAGE_SIZE), page + 1))}
                                disabled={page >= Math.ceil(total / PAGE_SIZE) || loading}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {addOpen && (
                <AddDonorModal
                    campaignSlug={campaignSlug}
                    participants={participants}
                    isOrganizer={isOrganizer}
                    participantView={!isOrganizer}
                    myMemberId={myMemberId}
                    onClose={() => setAddOpen(false)}
                    onSuccess={() => {
                        setAddOpen(false);
                        setSearch("");
                        setStatusFilter("all");
                        setPage(1);
                        fetchPage({ page: 1, search: "", status: "all", member: memberFilter, source: sourceFilter, emailValid, sort });
                        router.refresh();
                    }}
                />
            )}

            {viewDonorId && (
                <DonorDetailModal
                    donorId={viewDonorId}
                    campaignSlug={campaignSlug}
                    isOrganizer={isOrganizer}
                    currentMemberId={myMemberId ?? ""}
                    participants={participants}
                    isCompleted={isCompleted}
                    onClose={() => setViewDonorId(null)}
                    onRefresh={() => fetchPage(currentFilters())}
                />
            )}
        </>
    );
}
