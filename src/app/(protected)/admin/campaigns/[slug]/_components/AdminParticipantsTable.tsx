"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// Ranks 1/2/3 use the Figma medal assets; 4+ get a plain number / grey coin.
function Medal({ rank }: { rank: number }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/assets/dashboard/rank-${rank}.svg`} alt={`Rank ${rank}`} className="h-8 w-8 shrink-0" />;
}
function SortIcon() {
    return (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4.5 6 2.5l2 2M4 7.5l2 2 2-2" />
        </svg>
    );
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

export type AdminParticipant = {
    id:              string;
    userId:          string | null;
    name:            string;
    email:           string | null;
    donorsAdded:     number;
    targetDonors:    number;
    raised:          number;
    isOrganizer:     boolean;
    profilePhotoUrl: string | null;
};

type Props = {
    participants:         AdminParticipant[];
    perParticipantGoal:   number | null;
    donorsPerParticipant: number | null;
};

const PAGE_SIZES = [5, 10, 25, 50];
const SELECT_CLS = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

function Avatar({ p, size = "h-9 w-9" }: { p: AdminParticipant; size?: string }) {
    return (
        <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#aed9fe] text-xs font-bold text-[#0268c0]`}>
            {p.profilePhotoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.profilePhotoUrl} alt={p.name} className="h-full w-full object-cover" />
                : p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
    );
}

export default function AdminParticipantsTable({ participants, perParticipantGoal, donorsPerParticipant }: Props) {
    const [search,   setSearch]   = useState("");
    const [role,     setRole]     = useState<"all" | "organizers" | "participants">("all");
    const [sortDesc, setSortDesc] = useState(true);
    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const sectionRef = useRef<HTMLElement>(null);

    // True overall rank (by raised, desc) + top raiser — independent of filters/sort.
    const { rankMap, maxRaised } = useMemo(() => {
        const ranked = [...participants].sort((a, b) => b.raised - a.raised);
        return { rankMap: new Map(ranked.map((p, i) => [p.id, i + 1])), maxRaised: ranked[0]?.raised ?? 0 };
    }, [participants]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = participants;
        if (role === "organizers")   list = list.filter((p) => p.isOrganizer);
        if (role === "participants") list = list.filter((p) => !p.isOrganizer);
        if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q));
        return [...list].sort((a, b) => sortDesc ? b.raised - a.raised : a.raised - b.raised);
    }, [participants, search, role, sortDesc]);

    const total       = filtered.length;
    const totalPages  = Math.max(1, Math.ceil(total / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const paged       = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

    function resetTo1<T>(setter: (v: T) => void) { return (v: T) => { setter(v); setPage(1); }; }
    function goPage(n: number) { setPage(Math.min(totalPages, Math.max(1, n))); sectionRef.current?.scrollIntoView({ block: "start" }); }

    const targetOf     = (p: AdminParticipant) => donorsPerParticipant ?? p.targetDonors;
    const donorBarPct  = (p: AdminParticipant) => { const t = targetOf(p); return t > 0 ? Math.min(100, Math.round((p.donorsAdded / t) * 100)) : 0; };
    const raisedBarPct = (p: AdminParticipant) => perParticipantGoal && perParticipantGoal > 0
        ? Math.min(100, Math.round((p.raised / perParticipantGoal) * 100))
        : Math.min(100, Math.round((p.raised / Math.max(1, maxRaised)) * 100));

    const NameCell = ({ p }: { p: AdminParticipant }) => (
        <div className="flex min-w-0 items-center gap-2.5">
            <Avatar p={p} />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    {p.userId
                        ? <Link href={`/admin/users/${p.userId}`} className="truncate font-semibold text-[#0268c0] hover:underline">{p.name}</Link>
                        : <span className="truncate font-semibold text-[#003060]">{p.name}</span>}
                    {p.isOrganizer && <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">Organizer</span>}
                </div>
                {p.email && (
                    <p className="truncate text-xs text-[#9aa7b8]">
                        {p.userId ? <Link href={`/admin/users/${p.userId}`} className="hover:text-[#0268c0] hover:underline">{p.email}</Link> : p.email}
                    </p>
                )}
            </div>
        </div>
    );
    const DonorsCell = ({ p }: { p: AdminParticipant }) => (
        <>
            <p className="text-[13px] font-bold text-[#003060]">{p.donorsAdded}<span className="font-medium text-[#9aa7b8]"> of {targetOf(p)}</span></p>
            <div className="mt-1.5 h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-[#eef1f4]"><div className="h-full rounded-full bg-[#f47435]" style={{ width: `${donorBarPct(p)}%` }} /></div>
        </>
    );
    const AmountCell = ({ p, connector }: { p: AdminParticipant; connector: string }) => (
        <>
            <p className="text-[13px] font-bold text-[#003060]">
                {p.raised > 0 ? fmt(p.raised) : <span className="text-gray-300">$0</span>}
                {perParticipantGoal && perParticipantGoal > 0
                    ? <span className="font-medium text-[#9aa7b8]"> {connector} {fmt(perParticipantGoal)}{connector === "of" ? " Goal" : ""}</span>
                    : <span className="font-medium text-[#9aa7b8]"> raised</span>}
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-[190px] overflow-hidden rounded-full bg-[#eef1f4]"><div className="h-full rounded-full bg-[#28c45d]" style={{ width: `${raisedBarPct(p)}%` }} /></div>
        </>
    );

    const RankBadge = ({ p }: { p: AdminParticipant }) => {
        const rank = rankMap.get(p.id) ?? 0;
        return rank <= 3 ? <Medal rank={rank} /> : <span className="text-[15px] font-bold text-[#003060]">{rank}</span>;
    };

    return (
        <section ref={sectionRef} id="participants" className="scroll-mt-6">
            <div className="mb-4 flex items-center gap-2.5">
                <h2 className="text-[20px] font-black text-[#003060]">Participants</h2>
                <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#5b6b7c]">{participants.length}</span>
            </div>

            {/* Search + role filter */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => resetTo1(setSearch)(e.target.value)}
                        className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                    />
                    {search && (
                        <button onClick={() => resetTo1(setSearch)("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <select value={role} onChange={(e) => resetTo1(setRole)(e.target.value as typeof role)} className={SELECT_CLS} aria-label="Filter participants by role">
                    <option value="all">All Members</option>
                    <option value="organizers">Organizers</option>
                    <option value="participants">Participants</option>
                </select>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                {/* Desktop / tablet */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="bg-[#0268c0] text-white">
                                <th className="w-[84px] py-3.5 pl-6 pr-2 text-left">
                                    <button onClick={() => setSortDesc((d) => !d)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold" title="Sort by amount raised">Rank <SortIcon /></button>
                                </th>
                                <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Name</th>
                                <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Donors Added</th>
                                <th className="px-4 py-3.5 text-left text-[13px] font-semibold">Amount Raised</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-12 text-center text-sm italic text-[#9aa7b8]">{search.trim() || role !== "all" ? "No participants match your filters." : "No participants yet."}</td></tr>
                            ) : paged.map((p) => (
                                <tr key={p.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                    <td className="py-4 pl-6 pr-2"><span className="inline-flex w-9 justify-center"><RankBadge p={p} /></span></td>
                                    <td className="px-4 py-4"><NameCell p={p} /></td>
                                    <td className="px-4 py-4"><DonorsCell p={p} /></td>
                                    <td className="px-4 py-4"><AmountCell p={p} connector="of" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden">
                    <div className="flex items-center bg-[#0268c0] px-4 py-3 text-white">
                        <button onClick={() => setSortDesc((d) => !d)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold">Rank <SortIcon /></button>
                    </div>
                    {paged.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">{search.trim() || role !== "all" ? "No participants match your filters." : "No participants yet."}</p>
                    ) : paged.map((p) => (
                        <div key={p.id} className="border-b border-[#eef1f4] px-4 py-3.5 last:border-0">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex w-8 justify-center"><RankBadge p={p} /></span>
                                <NameCell p={p} />
                            </div>
                            <div className="mt-2.5 grid grid-cols-2 gap-3 pl-10">
                                <div><DonorsCell p={p} /></div>
                                <div><AmountCell p={p} connector="out of" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {total > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-[13px] font-medium text-[#7e8a96]">
                            Show per page:
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-[#e7e9eb] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#003060] focus:border-[#0268c0] focus:outline-none">
                                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <span className="text-[13px] font-medium text-[#9aa7b8]">Showing {((pageClamped - 1) * pageSize + 1).toLocaleString()}–{Math.min(pageClamped * pageSize, total).toLocaleString()} of {total.toLocaleString()}</span>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => goPage(pageClamped - 1)} disabled={pageClamped === 1} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            {pageList(pageClamped, totalPages).map((n, i) =>
                                n === "…" ? <span key={`e${i}`} className="px-1.5 text-sm text-[#9aa7b8]">…</span>
                                : <button key={n} onClick={() => goPage(n)} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${n === pageClamped ? "bg-[#0268c0] text-white" : "text-[#003060] hover:bg-gray-100"}`}>{n}</button>
                            )}
                            <button onClick={() => goPage(pageClamped + 1)} disabled={pageClamped === totalPages} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
