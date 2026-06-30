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

// Donors aren't users (no photo) — give each a stable, varied colour so the feed
// looks like the Figma's colourful avatars; anonymous donors get a neutral grey.
const AVATAR_PALETTE = [
    { bg: "#d6f5e3", fg: "#1a9d52" },
    { bg: "#aed9fe", fg: "#0268c0" },
    { bg: "#ffe0cc", fg: "#e0651f" },
    { bg: "#e9d8fd", fg: "#7c3aed" },
    { bg: "#cdeef0", fg: "#0e8a99" },
    { bg: "#fdd8e8", fg: "#c63a78" },
];
function avatarColor(key: string) {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function DonorRow({ d }: { d: DonationFeedItem }) {
    const hasName  = Boolean(d.donor_first_name || d.donor_last_name);
    const realName = hasName ? [d.donor_first_name, d.donor_last_name].filter(Boolean).join(" ") : "Anonymous";
    const initials = realName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const c = d.is_anonymous ? { bg: "#e7e9eb", fg: "#7e8a96" } : avatarColor(realName);
    return (
        <div className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: c.bg, color: c.fg }}>
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-[14px] font-semibold text-[#003060] truncate">{realName}</p>
                    {d.is_anonymous && hasName && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            Anonymous
                        </span>
                    )}
                </div>
                <p className="text-[12px] text-[#9aa7b8]">{timeAgo(d.created_at)}</p>
            </div>
            <span className="text-[14px] font-bold text-[#003060] shrink-0">
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

    // Figma modal has no "Load more" footer — load the next page on scroll instead.
    function onModalScroll(e: React.UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        if (!loading && modalSkip < modalTotal && el.scrollHeight - el.scrollTop - el.clientHeight < 140) {
            fetchPage(modalSkip);
        }
    }

    const hasMore     = totalCount > donations.length;

    return (
        <>
            {/* Preview card */}
            <div className="bg-white rounded-2xl border border-[#e7e9eb] shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isCompleted && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        <h2 className="text-[15px] font-bold text-[#003060]">
                            {isCompleted ? "All Donations" : "Live Donation Feed"}
                        </h2>
                    </div>
                    {hasMore ? (
                        <button
                            onClick={openModal}
                            className="text-[13px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80"
                        >
                            See all
                        </button>
                    ) : (
                        <span className="text-xs text-gray-400">{totalCount} total</span>
                    )}
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

            {/* See All modal — matches Figma "Live Donation Feed" dialog (396px, scrollable, no footer) */}
            {showAll && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm"
                    onClick={() => setShowAll(false)}
                >
                    <div
                        className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.25)]"
                        style={{ maxWidth: 396, maxHeight: "85vh" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-[#e7e9eb] px-6 py-4">
                            <h2 className="text-[16px] font-bold text-[#003060]">Live Donation Feed</h2>
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

                        <div
                            className="flex-1 divide-y divide-gray-50 overflow-y-auto [scrollbar-width:thin]"
                            onScroll={onModalScroll}
                        >
                            {loading && modalItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                                </div>
                            ) : (
                                <>
                                    {modalItems.map((d) => <DonorRow key={d.id} d={d} />)}
                                    {loading && modalItems.length > 0 && (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
