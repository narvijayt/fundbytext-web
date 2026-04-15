"use client";

import { useState } from "react";

const PREVIEW_LIMIT = 5;
const MODAL_PAGE    = 10;

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type Participant = {
    id:          string;
    name:        string;
    donorsAdded: number;
    raised:      number;
};

type Props = {
    participants: Participant[];
    myMemberId:   string;
};

function RankRow({ p, rank, isMe }: { p: Participant; rank: number; isMe: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-orange-50" : ""}`}>
            <span className={`text-xs font-bold w-5 text-center shrink-0 ${rank === 1 ? "text-orange-500" : "text-gray-400"}`}>
                #{rank}
            </span>
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-[10px] shrink-0">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isMe ? "text-orange-700" : "text-gray-800"}`}>
                    {p.name}{isMe && " (You)"}
                </p>
                <p className="text-[10px] text-gray-400">{p.donorsAdded} donors</p>
            </div>
            <p className="text-xs font-bold text-gray-800 shrink-0">{fmtUSD(p.raised)}</p>
        </div>
    );
}

export default function ParticipantRankings({ participants, myMemberId }: Props) {
    const [showAll,     setShowAll]     = useState(false);
    const [modalShown,  setModalShown]  = useState(MODAL_PAGE);

    const total   = participants.length;
    const hasMore = total > PREVIEW_LIMIT;
    const preview = participants.slice(0, PREVIEW_LIMIT);

    const modalItems  = participants.slice(0, modalShown);
    const canLoadMore = modalShown < total;

    function openModal() {
        setModalShown(MODAL_PAGE);
        setShowAll(true);
    }

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Participant Rankings</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{total} total</span>
                        {hasMore && (
                            <button
                                onClick={openModal}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                See All
                            </button>
                        )}
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {preview.map((p, i) => (
                        <RankRow key={p.id} p={p} rank={i + 1} isMe={p.id === myMemberId} />
                    ))}
                    {total === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">No participants yet</p>
                    )}
                </div>
            </div>

            {/* See All modal */}
            {showAll && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setShowAll(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
                        style={{ height: "80vh" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h2 className="text-sm font-bold text-gray-900">
                                All Participants
                                <span className="ml-1 text-gray-400 font-normal">({total})</span>
                            </h2>
                            <button
                                onClick={() => setShowAll(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                            {modalItems.map((p, i) => (
                                <RankRow key={p.id} p={p} rank={i + 1} isMe={p.id === myMemberId} />
                            ))}
                        </div>

                        {canLoadMore && (
                            <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => setModalShown((n) => n + MODAL_PAGE)}
                                    className="w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
