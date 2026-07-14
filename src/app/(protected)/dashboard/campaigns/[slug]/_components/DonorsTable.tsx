"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AddDonorModal from "./AddDonorModal";
import DonorInfoModal from "./DonorInfoModal";
import AssignDonorModal from "./AssignDonorModal";
import EditDonorModal from "./EditDonorModal";
import RemoveDonorModal from "./RemoveDonorModal";
import TableEmptyState from "./TableEmptyState";
import InfoBadgeTip from "./InfoBadgeTip";

export type DonorRow = {
    id:               string;
    first_name:       string;
    last_name:        string;
    email:            string | null;
    phone:            string | null;
    status:           string;
    source:           string;
    email_valid:      boolean;
    prefill_amount_cents: number | null;   // organizer-set suggested donation amount (cents)
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
    /** Organization campaigns only — individual campaigns have no participants, so
        the participant-oriented "source" filter (who added/assigned the donor) is hidden. */
    isOrgCampaign: boolean;
    participants:  Participant[];
    myMemberId?:   string;
    topDonorId?:   string | null;
    isCompleted?:  boolean;
    /** Fixed-goal remaining cap for a donor's suggested amount (cents); null = any
        campaign/goal type, 0 = fixed goal already met. */
    maxPrefillCents?: number | null;
    /** Extra content under the section title (participant view shows its outreach stats here). */
    headerExtra?:  React.ReactNode;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    donated:     { label: "Donated",     cls: "bg-green-100 text-green-700" },
    contacted:   { label: "Contacted",   cls: "bg-blue-100 text-blue-700"   },
    not_donated: { label: "Not Donated", cls: "bg-red-100 text-red-600"     },
};

const STATUS_TIP: Record<string, string> = {
    donated:     "This person has donated to the campaign.",
    contacted:   "This person has been contacted but hasn't donated yet.",
    not_donated: "This person hasn't donated to the campaign yet.",
};

// Tooltips for the Name-column and Associated-Participant badges (shown in the
// same blue popover as the status badges).
const BADGE_TIP = {
    walkin:       "Donated through the shared campaign link without being added as a contact first.",
    invalidEmail: "This email address looks invalid, so this donor may not have received their invite.",
    addedByMe:    "You added this donor to the campaign.",
    preAssigned:  "The organizer added this donor and assigned them to you.",
    generalFund:  "Not assigned to a participant — this donation counts toward the campaign's general fund.",
};

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

const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const TH_CLS     = "px-4 py-3.5 text-left text-[13px] font-semibold";

const Bar = ({ w }: { w: string }) => <div className={`h-3.5 ${w} rounded-full bg-gray-200`} />;
function SkeletonRow({ showAssignment }: { showAssignment: boolean }) {
    return (
        <tr className="border-b border-[#eef1f4] last:border-0">
            <td className="py-4 pl-5 pr-4"><div className="animate-pulse"><Bar w="w-32" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-28" /><Bar w="w-16" /></div></td>
            {showAssignment && <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-24" /></div></td>}
            <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" /></td>
            <td className="px-4 py-4"><div className="animate-pulse"><Bar w="w-14" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-20" /><Bar w="w-12" /></div></td>
            <td className="px-4 py-4"><div className="animate-pulse space-y-1.5"><Bar w="w-20" /><Bar w="w-12" /></div></td>
            <td className="py-4 pl-2 pr-5"><div className="ml-auto h-5 w-5 animate-pulse rounded bg-gray-200" /></td>
        </tr>
    );
}

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

export default function DonorsTable({ donors: initialDonors, initialTotal, campaignSlug, isOrganizer, isOrgCampaign, participants, myMemberId, topDonorId: initialTopDonorId, isCompleted, maxPrefillCents, headerExtra }: Props) {
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
    const [assignId,     setAssignId]     = useState<string | null>(null);
    const [editId,       setEditId]       = useState<string | null>(null);
    const [removeId,     setRemoveId]     = useState<string | null>(null);
    const [menuFor,      setMenuFor]      = useState<string | null>(null);
    const [menuPos,      setMenuPos]      = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [menuMounted,  setMenuMounted]  = useState(false);
    const [copiedId,     setCopiedId]     = useState<string | null>(null);
    const [collapsed,    setCollapsed]    = useState(false);
    const [pageSize,     setPageSize]     = useState(PAGE_SIZE);
    const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionRef    = useRef<HTMLElement>(null);
    const fetchStateRef = useRef<FetchParams>({ page: 1, search: "", status: "all", member: "all", source: "all", emailValid: "all", sort: "date_desc" });

    // Keep ref in sync so the event listener below always has current values
    fetchStateRef.current = { page, search, status: statusFilter, member: memberFilter, source: sourceFilter, emailValid, sort };

    async function fetchPage({ page: p, search: q, status: s, member: m, source: src, emailValid: ev, sort: srt }: FetchParams, size: number = pageSize) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                skip:        String((p - 1) * size),
                take:        String(size),
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
        // Keep the user on the table — a shorter page can otherwise shift the
        // scroll position past this section.
        sectionRef.current?.scrollIntoView({ block: "start" });
    }

    function handlePageSizeChange(n: number) {
        setPageSize(n);
        setPage(1);
        fetchPage({ ...currentFilters(), page: 1 }, n);
        sectionRef.current?.scrollIntoView({ block: "start" });
    }

    // Portalled action menu (three-dots) — positioned relative to the button, closed on outside interaction
    useEffect(() => { setMenuMounted(true); }, []);
    function openMenu(e: React.MouseEvent<HTMLButtonElement>, id: string) {
        const r = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
        setMenuFor((cur) => (cur === id ? null : id));
    }
    useEffect(() => {
        if (!menuFor) return;
        const close = () => setMenuFor(null);
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuFor(null); };
        window.addEventListener("mousedown", close);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", close);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
            window.removeEventListener("keydown", onKey);
        };
    }, [menuFor]);

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

    const totalPages = Math.ceil(total / pageSize);
    const hasFilters = search.trim() !== "" || statusFilter !== "all" || memberFilter !== "all" || sourceFilter !== "all" || emailValid !== "all";
    const isEmpty    = donors.length === 0 && !loading;
    const trulyEmpty = isEmpty && !hasFilters; // brand-new campaign — hide filters/pager chrome

    function clearFilters() {
        setSearch("");
        setStatusFilter("all");
        setMemberFilter("all");
        setSourceFilter("all");
        setEmailValid("all");
        setPage(1);
        fetchPage({ page: 1, search: "", status: "all", member: "all", source: "all", emailValid: "all", sort });
    }

    return (
        <>
            <section ref={sectionRef} id="donors" className="scroll-mt-6">
                {/* Title + Add */}
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-[20px] font-black text-[#003060]">Donors</h2>
                        <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#5b6b7c]">{total}</span>
                    </div>
                    {!isCompleted && (
                        <button
                            onClick={() => setAddOpen(true)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#28c45d] text-white transition-[filter] hover:brightness-105 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            <span className="hidden text-[13px] font-semibold sm:inline">Add Donor</span>
                        </button>
                    )}
                </div>

                {/* Extra header content (e.g. the participant's outreach stats) */}
                {headerExtra}

                {/* Filters — hidden for a brand-new (truly empty) campaign */}
                {!trulyEmpty && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, email or phone…"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-3 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                        />
                    </div>
                    <select value={statusFilter} onChange={(e) => handleFilterChange({ status: e.target.value })} className={SELECT_CLS}>
                        <option value="all">All Statuses</option>
                        <option value="not_donated">Not Donated</option>
                        <option value="contacted">Contacted</option>
                        <option value="donated">Donated</option>
                    </select>
                    {showAssignment && (
                        <select value={memberFilter} onChange={(e) => handleFilterChange({ member: e.target.value })} className={SELECT_CLS}>
                            <option value="all">All Participants</option>
                            <option value="unassigned">Unassigned</option>
                            {participants.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
                        </select>
                    )}
                    <select value={sourceFilter} onChange={(e) => handleFilterChange({ source: e.target.value })} className={SELECT_CLS}>
                        <option value="all">All Sources</option>
                        <option value="invited">Assigned by organizer</option>
                        {/* Individual campaigns have no participants, so hide this option there. */}
                        {isOrgCampaign && <option value="self_added">Added by participant</option>}
                        <option value="walk_in">Walk-in</option>
                    </select>
                    <select value={sort} onChange={(e) => handleFilterChange({ sort: e.target.value })} className={SELECT_CLS}>
                        <option value="date_desc">Newest first</option>
                        <option value="date_asc">Oldest first</option>
                        <option value="amount_desc">Most donated</option>
                        <option value="name_asc">Name A–Z</option>
                    </select>
                </div>
                )}

                {/* Table card */}
                <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] table-fixed text-sm">
                                <colgroup>
                                    <col className="w-[19%]" />
                                    <col className="w-[22%]" />
                                    {showAssignment && <col className="w-[11%]" />}
                                    <col className="w-[12%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[9%]" />
                                    <col className="w-[9%]" />
                                    <col className="w-[64px]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-[#0268c0] text-white">
                                        <th className={`${TH_CLS} pl-5`}>Name</th>
                                        <th className={TH_CLS}>Contact</th>
                                        {showAssignment && <th className={TH_CLS}>Associated Participant</th>}
                                        <th className={TH_CLS}>Status</th>
                                        <th className={TH_CLS}>Amount Donated</th>
                                        <th className={TH_CLS}>Date Donated</th>
                                        <th className={TH_CLS}>Last Contacted</th>
                                        <th className="py-3.5 pl-2 pr-5 text-right">
                                            <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"} className="inline-flex h-6 w-6 items-center justify-center rounded text-white/90 hover:bg-white/15">
                                                <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" /></svg>
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                {!isEmpty && !collapsed && (
                                    <tbody>
                                        {loading
                                            ? Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => <SkeletonRow key={`sk${i}`} showAssignment={showAssignment} />)
                                            : donors.map((d) => {
                                            const sb             = STATUS_BADGE[d.status] ?? STATUS_BADGE.not_donated;
                                            const donated        = d.donations.reduce((s, don) => s + don.amount, 0);
                                            const latestDonation = d.donations.length > 0
                                                ? d.donations.reduce((a, b) => a.donated_at > b.donated_at ? a : b)
                                                : null;
                                            const isAnonymous    = d.donations.some((don) => don.is_anonymous);
                                            const isGeneralFund  = donated > 0 && !d.assigned_member;
                                            return (
                                                <tr key={d.id} className="border-b border-[#eef1f4] align-middle transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                                    {/* Name */}
                                                    <td className="py-3.5 pl-5 pr-4">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="truncate font-semibold text-[#003060]">{d.first_name} {d.last_name}</p>
                                                                {!d.invite_token && (
                                                                    <InfoBadgeTip tip={BADGE_TIP.walkin} className="shrink-0">
                                                                        <span className="whitespace-nowrap rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">Walk-in</span>
                                                                    </InfoBadgeTip>
                                                                )}
                                                            </div>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                                {!d.email_valid && (
                                                                    <InfoBadgeTip tip={BADGE_TIP.invalidEmail}>
                                                                        <span className="whitespace-nowrap rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">Invalid email</span>
                                                                    </InfoBadgeTip>
                                                                )}
                                                                {d.added_by_member && d.source !== "link_self" && d.source !== "self_added" && (() => {
                                                                    const addedByMe  = d.added_by_member.id === myMemberId;
                                                                    const adderIsOrg = d.added_by_member.roles.some(r => r.role === "organizer");
                                                                    if (!adderIsOrg) return null;
                                                                    if (isOrganizer && addedByMe)
                                                                        return (
                                                                            <InfoBadgeTip tip={BADGE_TIP.addedByMe}>
                                                                                <span className="whitespace-nowrap rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">Added by me</span>
                                                                            </InfoBadgeTip>
                                                                        );
                                                                    if (!isOrganizer)
                                                                        return (
                                                                            <InfoBadgeTip tip={BADGE_TIP.preAssigned}>
                                                                                <span className="whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">Pre-assigned by organizer</span>
                                                                            </InfoBadgeTip>
                                                                        );
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Contact */}
                                                    <td className="px-4 py-3.5 text-[#7e8a96]">
                                                        <p className="truncate text-[13px]" title={d.email ?? undefined}>{d.email ?? "—"}</p>
                                                        {d.phone && <p className="truncate text-xs text-[#9aa7b8]" title={d.phone}>{d.phone}</p>}
                                                    </td>
                                                    {/* Associated Participant */}
                                                    {showAssignment && (
                                                        <td className="px-4 py-3.5 text-[13px]">
                                                            {d.assigned_member ? (
                                                                <span className="truncate text-[#003060]">{d.assigned_member.first_name} {d.assigned_member.last_name}</span>
                                                            ) : isGeneralFund ? (
                                                                <InfoBadgeTip tip={BADGE_TIP.generalFund}>
                                                                    <span className="whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">General Fund</span>
                                                                </InfoBadgeTip>
                                                            ) : (
                                                                <span className="text-gray-300">—</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {/* Status */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-col items-start gap-1">
                                                            {topDonorId === d.id && (
                                                                <InfoBadgeTip tip="This donor has contributed the most to the campaign.">
                                                                    <span className="flex items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0268c0]">
                                                                        <svg className="h-2.5 w-2.5 fill-[#0268c0]" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                                                        Top Donor
                                                                    </span>
                                                                </InfoBadgeTip>
                                                            )}
                                                            <InfoBadgeTip tip={STATUS_TIP[d.status] ?? STATUS_TIP.not_donated}>
                                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sb.cls}`}>{sb.label}</span>
                                                            </InfoBadgeTip>
                                                            {isAnonymous && (
                                                                <InfoBadgeTip tip="This donor chose to keep their donation anonymous.">
                                                                    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Anonymous</span>
                                                                </InfoBadgeTip>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Amount Donated */}
                                                    <td className="px-4 py-3.5 font-bold text-[#003060]">
                                                        {donated > 0 ? fmt(donated) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    {/* Date Donated */}
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        {(() => { const dt = fmtDateTime(latestDonation?.donated_at); return dt ? <><p className="text-[13px] text-[#003060]">{dt.date}</p><p className="text-xs text-[#9aa7b8]">{dt.time}</p></> : <span className="text-gray-300">—</span>; })()}
                                                    </td>
                                                    {/* Last Contacted */}
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        {(() => { const dt = fmtDateTime(d.created_at); return dt ? <><p className="text-[13px] text-[#003060]">{dt.date}</p><p className="text-xs text-[#9aa7b8]">{dt.time}</p></> : <span className="text-gray-300">—</span>; })()}
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="py-3.5 pl-2 pr-5">
                                                        <div className="flex items-center justify-end gap-0.5">
                                                            {d.short_code && (d.email || d.phone) && (
                                                                <button
                                                                    title={copiedId === d.id ? "Copied!" : "Copy donor link"}
                                                                    onClick={() => {
                                                                        const url = `${window.location.origin}/d/${d.short_code}`;
                                                                        navigator.clipboard.writeText(url);
                                                                        setCopiedId(d.id);
                                                                        setTimeout(() => setCopiedId(null), 2000);
                                                                    }}
                                                                    className="rounded-lg p-1.5 text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]"
                                                                >
                                                                    {copiedId === d.id ? (
                                                                        <svg className="h-4 w-4 text-[#28c45d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                    ) : (
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => openMenu(e, d.id)}
                                                                aria-label={`Actions for ${d.first_name} ${d.last_name}`}
                                                                aria-haspopup="menu"
                                                                aria-expanded={menuFor === d.id}
                                                                title="Actions"
                                                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 hover:text-[#003060] ${menuFor === d.id ? "bg-gray-100 text-[#003060]" : "text-[#9aa7b8]"}`}
                                                            >
                                                                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                )}
                            </table>
                        </div>
                        {isEmpty && (
                            hasFilters ? (
                                <TableEmptyState
                                    title="No donors match your filters"
                                    subtitle="Try adjusting your search or filters to find what you're looking for."
                                    action={{ label: "Clear filters", onClick: clearFilters, variant: "secondary" }}
                                />
                            ) : (
                                <TableEmptyState
                                    title="No donors yet"
                                    subtitle="Let's make this place lively with your first Donor."
                                    action={!isCompleted ? { label: "Add First Donor", onClick: () => setAddOpen(true) } : undefined}
                                />
                            )
                        )}
                </div>

                {/* Pagination + Export */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4">
                        {total > 0 && (
                        <label className="flex items-center gap-2 text-[13px] font-medium text-[#7e8a96]">
                            Show per page:
                            <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                                {[5, 10, 25, 50].map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        )}
                        {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1 || loading} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            {pageList(page, totalPages).map((n, i) =>
                                n === "…" ? (
                                    <span key={`e${i}`} className="px-1.5 text-sm text-[#9aa7b8]">…</span>
                                ) : (
                                    <button key={n} onClick={() => goToPage(n)} disabled={loading} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${n === page ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-gray-100"}`}>{n}</button>
                                )
                            )}
                            <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                        )}
                    </div>
                    <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-xl border border-[#e7e9eb] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50 active:bg-gray-100">
                        <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export
                    </button>
                </div>
            </section>

            {addOpen && (
                <AddDonorModal
                    campaignSlug={campaignSlug}
                    participants={participants}
                    isOrganizer={isOrganizer}
                    participantView={!isOrganizer}
                    myMemberId={myMemberId}
                    maxPrefillCents={maxPrefillCents}
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

            {/* Three-dots action menu (portalled so the table's overflow doesn't clip it) */}
            {menuMounted && menuFor && (() => {
                const d = donors.find((x) => x.id === menuFor);
                if (!d) return null;
                const hasDonated = d.donations.length > 0;
                const item = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium transition-colors";
                return createPortal(
                    <div
                        role="menu"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 90 }}
                        className="w-56 overflow-hidden rounded-xl border border-[#e7e9eb] bg-white py-1.5 shadow-[0px_12px_32px_-8px_rgba(15,29,67,0.25)]"
                    >
                        <button role="menuitem" onClick={() => { setViewDonorId(d.id); setMenuFor(null); }} className={`${item} text-[#003060] hover:bg-[#f4f8f9]`}>
                            <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.5" /></svg>
                            View Donor Info
                        </button>
                        {showAssignment && !hasDonated && !isCompleted && (
                            <button role="menuitem" onClick={() => { setAssignId(d.id); setMenuFor(null); }} className={`${item} text-[#003060] hover:bg-[#f4f8f9]`}>
                                <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" /></svg>
                                Assign to Participant
                            </button>
                        )}
                        {!isCompleted && (
                            <button role="menuitem" onClick={() => { setEditId(d.id); setMenuFor(null); }} className={`${item} text-[#003060] hover:bg-[#f4f8f9]`}>
                                <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit Donor
                            </button>
                        )}
                        {isOrganizer && !isCompleted && (
                            <button role="menuitem" onClick={() => { setRemoveId(d.id); setMenuFor(null); }} className={`${item} text-red-600 hover:bg-red-50`}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" /></svg>
                                Remove
                            </button>
                        )}
                    </div>,
                    document.body
                );
            })()}

            {viewDonorId && (() => {
                const d = donors.find((x) => x.id === viewDonorId);
                return d ? (
                    <DonorInfoModal donor={d} isOrganizer={isOrganizer} myMemberId={myMemberId} onClose={() => setViewDonorId(null)} />
                ) : null;
            })()}

            {assignId && (() => {
                const d = donors.find((x) => x.id === assignId);
                return d ? (
                    <AssignDonorModal
                        donorId={d.id}
                        campaignSlug={campaignSlug}
                        donorName={`${d.first_name} ${d.last_name}`}
                        currentAssigned={d.assigned_member?.id ?? ""}
                        participants={participants}
                        onClose={() => setAssignId(null)}
                        onRefresh={() => fetchPage(currentFilters())}
                    />
                ) : null;
            })()}

            {editId && (() => {
                const d = donors.find((x) => x.id === editId);
                return d ? (
                    <EditDonorModal
                        donorId={d.id}
                        campaignSlug={campaignSlug}
                        initialFirst={d.first_name}
                        initialLast={d.last_name}
                        initialEmail={d.email}
                        initialPhone={d.phone}
                        initialPrefillCents={d.prefill_amount_cents}
                        maxPrefillCents={maxPrefillCents}
                        hasPaid={d.status === "donated" || d.donations.length > 0}
                        onClose={() => setEditId(null)}
                        onRefresh={() => fetchPage(currentFilters())}
                    />
                ) : null;
            })()}

            {removeId && (() => {
                const d = donors.find((x) => x.id === removeId);
                return d ? (
                    <RemoveDonorModal
                        donorId={d.id}
                        campaignSlug={campaignSlug}
                        name={`${d.first_name} ${d.last_name}`}
                        hasDonated={d.donations.length > 0}
                        onClose={() => setRemoveId(null)}
                        onRefresh={() => fetchPage(currentFilters())}
                    />
                ) : null;
            })()}
        </>
    );
}
