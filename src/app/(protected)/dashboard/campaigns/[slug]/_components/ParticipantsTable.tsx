"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AddParticipantModal from "./AddParticipantModal";
import ParticipantDetailModal from "./ParticipantDetailModal";
import EditParticipantModal from "./EditParticipantModal";
import RemoveParticipantModal from "./RemoveParticipantModal";
import TableEmptyState from "./TableEmptyState";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// Ranks 1/2/3 use the exact Figma medal assets; 4+ get a plain number (table) or soft grey coin (cards).
function Medal({ rank, size = "h-8 w-8" }: { rank: number; size?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/assets/dashboard/rank-${rank}.svg`} alt={`Rank ${rank}`} className={`${size} shrink-0`} />;
}

function SortIcon() {
    return (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4.5 6 2.5l2 2M4 7.5l2 2 2-2" />
        </svg>
    );
}

function Dots() {
    return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
        </svg>
    );
}

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

export type ParticipantRow = {
    id:              string;
    name:            string;
    email:           string | null;
    donorsAdded:     number;
    targetDonors:    number;
    raised:          number;
    isOrganizer:     boolean;
    profilePhotoUrl: string | null;
    username:        string | null;
};

type Props = {
    participants:          ParticipantRow[];
    isOrganizer:           boolean;
    campaignSlug:          string;
    goalAmount?:           number | null;
    perParticipantGoal?:   number | null;
    myMemberId?:           string;
    donorsPerParticipant?: number | null;
    isCompleted?:          boolean;
};

const PAGE_SIZES = [10, 25, 50];

export default function ParticipantsTable({ participants, isOrganizer, campaignSlug, perParticipantGoal, myMemberId, donorsPerParticipant, isCompleted }: Props) {
    const [search,       setSearch]       = useState("");
    const [page,         setPage]         = useState(1);
    const [pageSize,     setPageSize]     = useState(10);
    const sectionRef                      = useRef<HTMLElement>(null);
    const [sortDesc,     setSortDesc]     = useState(true);
    const [collapsed,    setCollapsed]    = useState(false);
    const [addOpen,      setAddOpen]      = useState(false);
    const [viewMemberId, setViewMemberId] = useState<string | null>(null);
    const [editMemberId, setEditMemberId] = useState<string | null>(null);
    const [removeId,     setRemoveId]     = useState<string | null>(null);
    const [menuFor,      setMenuFor]      = useState<string | null>(null);
    const [menuPos,      setMenuPos]      = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [mounted,      setMounted]      = useState(false);
    useEffect(() => { setMounted(true); }, []);

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

    const filtered = participants.filter((p) => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });
    const ordered   = sortDesc ? filtered : [...filtered].reverse();
    const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const paginated  = ordered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);
    const isEmpty        = paginated.length === 0;
    const noParticipants = participants.length === 0; // brand-new campaign vs. search returning nothing

    const viewedParticipant = participants.find((p) => p.id === viewMemberId);
    const maxRaised = Math.max(1, ...participants.map((p) => p.raised));

    // Original (desc) index → real rank number, independent of the display sort.
    const rankOf = (p: ParticipantRow) => filtered.indexOf(p) + 1;
    const donorBarPct   = (p: ParticipantRow) => { const t = donorsPerParticipant ?? p.targetDonors; return t > 0 ? Math.min(100, Math.round((p.donorsAdded / t) * 100)) : 0; };
    const targetOf      = (p: ParticipantRow) => donorsPerParticipant ?? p.targetDonors;
    const raisedBarPct  = (p: ParticipantRow) => perParticipantGoal && perParticipantGoal > 0
        ? Math.min(100, Math.round((p.raised / perParticipantGoal) * 100))
        : Math.min(100, Math.round((p.raised / maxRaised) * 100));

    function goPage(n: number) {
        setPage(Math.min(totalPages, Math.max(1, n)));
        // Keep the user on the table — a shorter page can otherwise shift the scroll past this section.
        sectionRef.current?.scrollIntoView({ block: "start" });
    }

    function Avatar({ p, size }: { p: ParticipantRow; size: string }) {
        return (
            <div className={`${size} shrink-0 overflow-hidden rounded-full bg-[#aed9fe] flex items-center justify-center text-[#0268c0] font-bold text-xs`}>
                {p.profilePhotoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.profilePhotoUrl} alt={p.name} className="h-full w-full object-cover" />
                    : p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
        );
    }

    const DonorsCell = ({ p }: { p: ParticipantRow }) => (
        <>
            <p className="text-[13px] font-bold text-[#003060]">
                {p.donorsAdded}<span className="font-medium text-[#9aa7b8]"> of {targetOf(p)}</span>
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-[#eef1f4]">
                <div className="h-full rounded-full bg-[#f47435]" style={{ width: `${donorBarPct(p)}%` }} />
            </div>
        </>
    );
    const AmountCell = ({ p, connector }: { p: ParticipantRow; connector: string }) => (
        <>
            <p className="text-[13px] font-bold text-[#003060]">
                {p.raised > 0 ? fmt(p.raised) : <span className="text-gray-300">$0</span>}
                {perParticipantGoal && perParticipantGoal > 0
                    ? <span className="font-medium text-[#9aa7b8]"> {connector} {fmt(perParticipantGoal)}{connector === "of" ? " Goal" : ""}</span>
                    : <span className="font-medium text-[#9aa7b8]"> raised</span>}
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-[190px] overflow-hidden rounded-full bg-[#eef1f4]">
                <div className="h-full rounded-full bg-[#28c45d]" style={{ width: `${raisedBarPct(p)}%` }} />
            </div>
        </>
    );

    return (
        <section ref={sectionRef} id="participants" className="scroll-mt-6">
            {/* Title + Add */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-black text-[#003060]">Participants</h2>
                {isOrganizer && !isCompleted && (
                    <button
                        onClick={() => setAddOpen(true)}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#28c45d] text-white transition-[filter] hover:brightness-105 h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden sm:inline text-[13px] font-semibold">Add Participant</span>
                    </button>
                )}
            </div>

            {/* Search — hidden for a brand-new (no participants) campaign */}
            {!noParticipants && (
            <div className="relative mb-4 w-full sm:w-[320px]">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search by name, email, or Status"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-3 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                />
            </div>
            )}

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                {/* ── Desktop / tablet table (blue header retained even when empty) ── */}
                        <div className="hidden md:block">
                            <table className="w-full table-fixed text-sm">
                                <colgroup>
                                    <col className="w-[84px]" />
                                    <col />
                                    <col className="w-[24%]" />
                                    <col className="w-[27%]" />
                                    <col className="w-[56px]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-[#0268c0] text-white">
                                        <th className="py-3.5 pl-6 pr-2 text-left">
                                            <button onClick={() => setSortDesc((s) => !s)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                                                Rank <SortIcon />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Name</th>
                                        <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Donors Added</th>
                                        <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Amount Raised</th>
                                        <th className="py-3.5 pl-2 pr-5 text-right">
                                            <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"} className="inline-flex h-6 w-6 items-center justify-center rounded text-white/90 hover:bg-white/15">
                                                <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" /></svg>
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                {!isEmpty && !collapsed && (
                                    <tbody>
                                        {paginated.map((p) => {
                                            const rank = rankOf(p);
                                            return (
                                                <tr key={p.id} className="border-b border-[#eef1f4] last:border-0 transition-colors hover:bg-[#f7f9fb]">
                                                    <td className="py-4 pl-6 pr-2">
                                                        <span className="inline-flex w-9 justify-center">
                                                            {rank <= 3 ? <Medal rank={rank} /> : <span className="text-[15px] font-bold text-[#003060]">{rank}</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <Avatar p={p} size="h-9 w-9" />
                                                            <div className="flex min-w-0 items-center gap-1.5">
                                                                <p className="truncate font-semibold text-[#003060]">{p.name}</p>
                                                                {p.id === myMemberId && (
                                                                    <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">You</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4"><DonorsCell p={p} /></td>
                                                    <td className="px-4 py-4"><AmountCell p={p} connector="of" /></td>
                                                    <td className="py-4 pl-2 pr-5 text-right">
                                                        <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => openMenu(e, p.id)} aria-label={`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded={menuFor === p.id} title="Actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                                                            <Dots />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                )}
                            </table>
                        </div>

                        {/* ── Mobile cards ── */}
                        <div className="md:hidden">
                            <div className="flex items-center justify-between bg-[#0268c0] px-4 py-3 text-white">
                                <button onClick={() => setSortDesc((s) => !s)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                                    Rank <SortIcon />
                                </button>
                                <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"} className="inline-flex h-6 w-6 items-center justify-center rounded text-white/90 hover:bg-white/15">
                                    <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" /></svg>
                                </button>
                            </div>
                            {!isEmpty && !collapsed && paginated.map((p) => {
                                const rank = rankOf(p);
                                return (
                                    <div key={p.id} className="border-b border-[#eef1f4] px-4 py-3.5 last:border-0">
                                        <div className="flex items-center gap-2.5">
                                            <span className="inline-flex w-8 justify-center">
                                                {rank <= 3 ? <Medal rank={rank} /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2f7] text-[13px] font-bold text-[#5b6b7c]">{rank}</span>}
                                            </span>
                                            <Avatar p={p} size="h-9 w-9" />
                                            <p className="min-w-0 flex-1 truncate font-semibold text-[#003060]">{p.name}</p>
                                            {p.id === myMemberId && (
                                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">You</span>
                                            )}
                                            <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => openMenu(e, p.id)} aria-label={`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded={menuFor === p.id} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9aa7b8] hover:bg-gray-100 hover:text-[#003060]">
                                                <Dots />
                                            </button>
                                        </div>
                                        <div className="mt-2.5 grid grid-cols-2 gap-3 pl-10">
                                            <div><DonorsCell p={p} /></div>
                                            <div><AmountCell p={p} connector="out of" /></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                {isEmpty && (
                    noParticipants ? (
                        <TableEmptyState
                            title="No participants yet"
                            subtitle="Add your first participant to start building your fundraising team."
                            action={isOrganizer && !isCompleted ? { label: "Add First Participant", onClick: () => setAddOpen(true) } : undefined}
                        />
                    ) : (
                        <TableEmptyState
                            title="No matching participants"
                            subtitle="No participants match your search. Try a different name or keyword."
                            action={{ label: "Clear search", onClick: () => { setSearch(""); setPage(1); }, variant: "secondary" }}
                        />
                    )
                )}
            </div>

            {/* Pagination */}
            {paginated.length > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-[#7e8a96]">
                        Show per page:
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); sectionRef.current?.scrollIntoView({ block: "start" }); }}
                            className="rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none"
                        >
                            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => goPage(pageClamped - 1)} disabled={pageClamped === 1} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            {pageList(pageClamped, totalPages).map((n, i) =>
                                n === "…" ? (
                                    <span key={`e${i}`} className="px-1.5 text-sm text-[#9aa7b8]">…</span>
                                ) : (
                                    <button
                                        key={n}
                                        onClick={() => goPage(n)}
                                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${n === pageClamped ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-gray-100"}`}
                                    >
                                        {n}
                                    </button>
                                )
                            )}
                            <button onClick={() => goPage(pageClamped + 1)} disabled={pageClamped === totalPages} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isOrganizer && addOpen && (
                <AddParticipantModal campaignSlug={campaignSlug} onClose={() => setAddOpen(false)} />
            )}
            {/* Row action menu — portalled so the table's overflow doesn't clip it */}
            {mounted && menuFor && (() => {
                const p = participants.find((x) => x.id === menuFor);
                if (!p) return null;
                const item = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium transition-colors";
                return createPortal(
                    <div role="menu" onMouseDown={(e) => e.stopPropagation()} style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 90 }}
                        className="w-56 overflow-hidden rounded-xl border border-[#e7e9eb] bg-white py-1.5 shadow-[0px_12px_32px_-8px_rgba(15,29,67,0.25)]">
                        <button role="menuitem" onClick={() => { setViewMemberId(p.id); setMenuFor(null); }} className={`${item} text-[#003060] hover:bg-[#f4f8f9]`}>
                            <svg className="h-[18px] w-[18px] text-[#9aa7b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></svg>
                            View Participant
                        </button>
                        {isOrganizer && !isCompleted && (
                            <button role="menuitem" onClick={() => { setEditMemberId(p.id); setMenuFor(null); }} className={`${item} text-[#003060] hover:bg-[#f4f8f9]`}>
                                <svg className="h-[18px] w-[18px] text-[#9aa7b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit Participant
                            </button>
                        )}
                        {isOrganizer && !isCompleted && (
                            <button role="menuitem" onClick={() => { setRemoveId(p.id); setMenuFor(null); }} className={`${item} text-red-600 hover:bg-red-50`}>
                                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" /></svg>
                                Remove
                            </button>
                        )}
                    </div>,
                    document.body
                );
            })()}

            {viewMemberId && (
                <ParticipantDetailModal
                    memberId={viewMemberId}
                    myMemberId={myMemberId}
                    campaignSlug={campaignSlug}
                    raised={viewedParticipant?.raised ?? 0}
                    onClose={() => setViewMemberId(null)}
                />
            )}
            {editMemberId && (
                <EditParticipantModal memberId={editMemberId} campaignSlug={campaignSlug} onClose={() => setEditMemberId(null)} />
            )}
            {removeId && (() => {
                const p = participants.find((x) => x.id === removeId);
                return (
                    <RemoveParticipantModal
                        memberId={removeId}
                        campaignSlug={campaignSlug}
                        name={p?.name ?? "this participant"}
                        raised={p?.raised ?? 0}
                        isSelf={removeId === myMemberId}
                        onClose={() => setRemoveId(null)}
                    />
                );
            })()}
        </section>
    );
}
