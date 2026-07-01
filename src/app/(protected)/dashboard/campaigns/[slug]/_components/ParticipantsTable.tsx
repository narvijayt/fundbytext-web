"use client";

import { useState } from "react";
import AddParticipantModal from "./AddParticipantModal";
import ParticipantDetailModal from "./ParticipantDetailModal";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// Top-3 get numbered medal coins (gold/silver/bronze); everyone else a soft numbered badge.
const MEDALS: Record<number, { ring: [string, string]; disc: [string, string] }> = {
    1: { ring: ["#F7C948", "#E0951A"], disc: ["#FFE59A", "#F5B72E"] },
    2: { ring: ["#CBD5E1", "#8E9AAB"], disc: ["#EDF1F6", "#BFC8D4"] },
    3: { ring: ["#E7AB74", "#B96F31"], disc: ["#F4CBA0", "#DA8A4C"] },
};
function RankBadge({ rank }: { rank: number }) {
    const m = MEDALS[rank];
    if (m) {
        const id = `medal-${rank}`;
        return (
            <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" role="img" aria-label={`Rank ${rank}`}>
                <defs>
                    <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={m.ring[0]} /><stop offset="1" stopColor={m.ring[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={m.disc[0]} /><stop offset="1" stopColor={m.disc[1]} />
                    </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="15" fill={`url(#${id}-r)`} />
                <circle cx="16" cy="16" r="11" fill={`url(#${id}-d)`} />
                <circle cx="16" cy="16" r="11" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
                <text x="16" y="16.5" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill="#ffffff">{rank}</text>
            </svg>
        );
    }
    return <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-[13px] font-bold text-[#5b6b7c]">{rank}</span>;
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
    myMemberId?:           string;
    donorsPerParticipant?: number | null;
    isCompleted?:          boolean;
};

const PAGE_SIZE = 10;

export default function ParticipantsTable({ participants, isOrganizer, campaignSlug, goalAmount, myMemberId, donorsPerParticipant, isCompleted }: Props) {
    const [search,       setSearch]       = useState("");
    const [page,         setPage]         = useState(1);
    const [addOpen,      setAddOpen]      = useState(false);
    const [viewMemberId, setViewMemberId] = useState<string | null>(null);

    const filtered = participants.filter((p) => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const viewedParticipant = participants.find((p) => p.id === viewMemberId);

    // Summary stats
    const totalDonorsAdded  = participants.reduce((s, p) => s + p.donorsAdded, 0);
    const totalTargetDonors = donorsPerParticipant != null
        ? donorsPerParticipant * participants.length
        : participants.reduce((s, p) => s + p.targetDonors, 0);
    const totalRaised       = participants.reduce((s, p) => s + p.raised, 0);
    const maxRaised         = Math.max(1, ...participants.map((p) => p.raised));
    // goalAmount is already the effective total (pre-multiplied by participants.length on the server)
    const effectiveGoal = goalAmount ?? null;
    const donorPct          = totalTargetDonors > 0 ? Math.min(100, Math.round((totalDonorsAdded / totalTargetDonors) * 100)) : 0;
    const raisedPct         = effectiveGoal && effectiveGoal > 0 ? Math.min(100, Math.round((totalRaised / effectiveGoal) * 100)) : 0;

    return (
        <>
            <div id="participants" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                    <h2 className="flex-1 text-[18px] font-black text-[#003060]">Participants</h2>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {filtered.length}
                    </span>
                    {isOrganizer && !isCompleted && (
                        <button
                            onClick={() => setAddOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#28c45d] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:brightness-105"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Participant
                        </button>
                    )}
                </div>

                {/* Summary progress bars */}
                {participants.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-50 grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">Donors Added</span>
                                <span className="text-xs font-bold text-gray-800">
                                    {totalDonorsAdded}
                                    {totalTargetDonors > 0 && (
                                        <span className="text-gray-400 font-medium"> of {totalTargetDonors}</span>
                                    )}
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-400 rounded-full transition-all"
                                    style={{ width: `${donorPct}%` }}
                                />
                            </div>
                        </div>
                        {effectiveGoal && effectiveGoal > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-gray-500">Amount Raised</span>
                                    <span className="text-xs font-bold text-gray-800">
                                        {fmt(totalRaised)}
                                        <span className="text-gray-400 font-medium"> of {fmt(effectiveGoal!)}</span>
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-400 rounded-full transition-all"
                                        style={{ width: `${raisedPct}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-50">
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                </div>

                {/* Table */}
                {paginated.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p className="text-sm text-gray-400">{search ? "No participants match your search" : "No participants yet"}</p>
                        {isOrganizer && !isCompleted && !search && (
                            <button
                                onClick={() => setAddOpen(true)}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                </svg>
                                Add First Participant
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#0268c0] text-white">
                                    <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wide">Rank</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wide">Name</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wide">Donors Added</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wide">Amount Raised</th>
                                    <th className="px-6 py-3.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((p, i) => {
                                    const rank    = (page - 1) * PAGE_SIZE + i + 1;
                                    const target   = donorsPerParticipant ?? p.targetDonors;
                                    const donorPct = target > 0
                                        ? Math.min(100, Math.round((p.donorsAdded / target) * 100))
                                        : 0;
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3.5"><RankBadge rank={rank} /></td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-full bg-[#aed9fe] flex items-center justify-center text-[#0268c0] font-bold text-xs shrink-0 overflow-hidden">
                                                        {p.profilePhotoUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={p.profilePhotoUrl} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-[#003060]">{p.name}</p>
                                                            {p.id === myMemberId && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0268c0] border border-[#0268c0]/20 uppercase tracking-wide">You</span>
                                                            )}
                                                        </div>
                                                        {p.email && (
                                                            <p className="text-xs text-gray-400">{p.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <p className="text-[13px] font-bold text-[#003060]">
                                                    {p.donorsAdded}
                                                    {target > 0 && (<span className="font-medium text-[#9aa7b8]"> of {target}</span>)}
                                                </p>
                                                {target > 0 && (
                                                    <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                                                        <div className="h-full rounded-full bg-[#f47435]" style={{ width: `${donorPct}%` }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <p className="text-[13px] font-bold text-[#003060]">
                                                    {p.raised > 0 ? fmt(p.raised) : <span className="text-gray-300">—</span>}
                                                    {p.raised > 0 && (<span className="font-medium text-[#9aa7b8]"> raised</span>)}
                                                </p>
                                                {p.raised > 0 && (
                                                    <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                                                        <div className="h-full rounded-full bg-[#28c45d]" style={{ width: `${Math.round((p.raised / maxRaised) * 100)}%` }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    onClick={() => setViewMemberId(p.id)}
                                                    aria-label={`View ${p.name}`}
                                                    title="View details"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa7b8] transition-colors hover:bg-gray-100 hover:text-[#003060]"
                                                >
                                                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="5" cy="12" r="1.6" />
                                                        <circle cx="12" cy="12" r="1.6" />
                                                        <circle cx="19" cy="12" r="1.6" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isOrganizer && addOpen && (
                <AddParticipantModal
                    campaignSlug={campaignSlug}
                    onClose={() => setAddOpen(false)}
                />
            )}

            {viewMemberId && (
                <ParticipantDetailModal
                    memberId={viewMemberId}
                    myMemberId={myMemberId}
                    campaignSlug={campaignSlug}
                    isOrganizer={isOrganizer}
                    raised={viewedParticipant?.raised ?? 0}
                    isCompleted={isCompleted}
                    onClose={() => setViewMemberId(null)}
                />
            )}
        </>
    );
}
