"use client";

import { useState, useCallback } from "react";

const MODAL_PAGE = 10;

function fmtDateTime(ts: number | null) {
    if (!ts) return null;
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " · "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export type NotifItem = {
    id:            string;
    message:       string | null;
    helper_text:   string | null;
    trigger_event: string | null;
    scheduled_at:  number | null;
    sent_at:       number | null;
    status:        string;
};

function NotifRow({ n }: { n: NotifItem }) {
    const dateStr = fmtDateTime(n.sent_at ?? n.scheduled_at);

    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-snug">
                    {n.message ?? n.trigger_event ?? "Notification"}
                </p>
                {dateStr && <p className="text-[10px] text-gray-400 mt-0.5">{dateStr}</p>}
            </div>
        </div>
    );
}

type Props = {
    notifications: NotifItem[];
    totalCount:    number;
    campaignSlug:  string;
};

export default function ParticipantNotifications({ notifications, totalCount, campaignSlug }: Props) {
    const [showAll,    setShowAll]    = useState(false);
    const [modalItems, setModalItems] = useState<NotifItem[]>([]);
    const [modalTotal, setModalTotal] = useState(0);
    const [modalSkip,  setModalSkip]  = useState(0);
    const [loading,    setLoading]    = useState(false);

    const fetchPage = useCallback(async (skip: number, replace = false) => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${campaignSlug}/notifications-list?skip=${skip}&take=${MODAL_PAGE}&type=participant`);
            const data = await res.json() as { notifications: NotifItem[]; total: number };
            setModalItems((prev) => replace ? data.notifications : [...prev, ...data.notifications]);
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

    const hasMore     = totalCount > notifications.length;
    const canLoadMore = modalSkip < modalTotal;

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">My Notifications</h3>
                    <div className="flex items-center gap-2">
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
                    {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-gray-400 text-center italic">No notifications yet.</p>
                    ) : (
                        notifications.map((n) => <NotifRow key={n.id} n={n} />)
                    )}
                </div>
            </div>

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
                                My Notifications
                                <span className="ml-1 text-gray-400 font-normal">({modalTotal || totalCount})</span>
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
                            {loading && modalItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                modalItems.map((n) => <NotifRow key={n.id} n={n} />)
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
