"use client";

import { useState, useCallback } from "react";

const MODAL_PAGE = 10;

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export type DonationFeedItem = {
    id:                 string;
    amount:             string;
    donor_display_name: string | null;
    donor_first_name:   string | null;
    donor_last_name:    string | null;
    is_anonymous:       boolean;
    created_at:         number;   // Unix timestamp (ms)
};

function DonorRow({ d }: { d: DonationFeedItem }) {
    const realName = [d.donor_first_name, d.donor_last_name].filter(Boolean).join(" ") || "Unknown";
    const initials = realName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{realName}</p>
                    {d.is_anonymous && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            Anonymous
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400">{timeAgo(d.created_at)}</p>
            </div>
            <span className="text-sm font-bold text-gray-900 shrink-0">
                {fmt(parseFloat(d.amount))}
            </span>
        </div>
    );
}

type Props = {
    donations:    DonationFeedItem[];
    totalCount:   number;
    campaignSlug: string;
    isCompleted?: boolean;
};

export default function LiveDonationFeed({ donations, totalCount, campaignSlug, isCompleted }: Props) {
    const [showAll,    setShowAll]    = useState(false);
    const [modalItems, setModalItems] = useState<DonationFeedItem[]>([]);
    const [modalTotal, setModalTotal] = useState(0);
    const [modalSkip,  setModalSkip]  = useState(0);
    const [loading,    setLoading]    = useState(false);

    const fetchPage = useCallback(async (skip: number, replace = false) => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${campaignSlug}/donations-feed?skip=${skip}&take=${MODAL_PAGE}`);
            const data = await res.json() as { donations: DonationFeedItem[]; total: number };
            setModalItems((prev) => replace ? data.donations : [...prev, ...data.donations]);
            setModalTotal(data.total);
            setModalSkip(skip + MODAL_PAGE);
        } finally {
            setLoading(false);
        }
    }, [campaignSlug]);

    function openModal() {
        setShowAll(true);
        setModalItems([]);
        setModalSkip(0);
        fetchPage(0, true);
    }

    const hasMore     = totalCount > donations.length;
    const canLoadMore = modalSkip < modalTotal;

    return (
        <>
            {/* Preview card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isCompleted && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        <h2 className="text-sm font-bold text-gray-900">
                            {isCompleted ? "All Donations" : "Live Donation Feed"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{totalCount} total</span>
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
                    {donations.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <p className="text-sm text-gray-400">No donations yet.</p>
                            <p className="text-xs text-gray-300 mt-1">Donations will appear here in real time.</p>
                        </div>
                    ) : (
                        donations.map((d) => <DonorRow key={d.id} d={d} />)
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
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <h2 className="text-sm font-bold text-gray-900">All Donations</h2>
                                <span className="text-xs text-gray-400">({modalTotal || totalCount})</span>
                            </div>
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
                            {loading && modalItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                modalItems.map((d) => <DonorRow key={d.id} d={d} />)
                            )}
                        </div>

                        {canLoadMore && (
                            <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => fetchPage(modalSkip)}
                                    disabled={loading}
                                    className="w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? "Loading…" : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
