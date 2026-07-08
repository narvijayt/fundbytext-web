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
    myMemberId:   string | null;
};

function RankRow({ p, rank, isMe }: { p: Participant; rank: number; isMe: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-[#eef5fc]" : ""}`}>
            <span className={`w-5 shrink-0 text-center text-xs font-bold ${rank === 1 ? "text-[#0268c0]" : "text-[#9aa7b8]"}`}>
                #{rank}
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#aed9fe] text-[10px] font-bold text-[#0268c0]">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-semibold ${isMe ? "text-[#0268c0]" : "text-[#003060]"}`}>
                    {p.name}{isMe && " (You)"}
                </p>
                <p className="text-[10px] text-[#9aa7b8]">{p.donorsAdded} donors</p>
            </div>
            <p className="shrink-0 text-xs font-bold text-[#003060]">{fmtUSD(p.raised)}</p>
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
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-[15px] font-bold text-[#003060]">Participant Rankings</h3>
                    <div className="flex items-center gap-3">
                        {hasMore ? (
                            <button
                                onClick={openModal}
                                className="text-[13px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80"
                            >
                                See all
                            </button>
                        ) : (
                            <span className="text-xs text-[#9aa7b8]">{total} total</span>
                        )}
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {preview.map((p, i) => (
                        <RankRow key={p.id} p={p} rank={i + 1} isMe={p.id === myMemberId} />
                    ))}
                    {total === 0 && (
                        <p className="py-6 text-center text-xs text-[#9aa7b8]">No participants yet</p>
                    )}
                </div>
            </div>

            {/* See All modal */}
            {showAll && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm"
                    onClick={() => setShowAll(false)}
                >
                    <div
                        className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.25)]"
                        style={{ maxWidth: 448, height: "80vh" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-[#e7e9eb] px-6 py-4">
                            <h2 className="text-[16px] font-bold text-[#003060]">
                                All Participants
                                <span className="ml-1 font-normal text-[#9aa7b8]">({total})</span>
                            </h2>
                            <button
                                onClick={() => setShowAll(false)}
                                aria-label="Close"
                                className="text-[#9aa7b8] transition-colors hover:text-[#003060]"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-scroll flex-1 divide-y divide-gray-50 overflow-y-auto">
                            {modalItems.map((p, i) => (
                                <RankRow key={p.id} p={p} rank={i + 1} isMe={p.id === myMemberId} />
                            ))}
                        </div>

                        {canLoadMore && (
                            <div className="shrink-0 border-t border-[#e7e9eb] px-5 py-3">
                                <button
                                    onClick={() => setModalShown((n) => n + MODAL_PAGE)}
                                    className="w-full py-2 text-sm font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80"
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
