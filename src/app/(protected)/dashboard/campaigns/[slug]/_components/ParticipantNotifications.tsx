"use client";

import { useState, useCallback } from "react";
import NotificationDetailModal from "./NotificationDetailModal";

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

function NotifRow({ n, onClick }: { n: NotifItem; onClick: () => void }) {
    const dateStr = fmtDateTime(n.sent_at ?? n.scheduled_at);

    return (
        <button type="button" onClick={onClick} className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f7f9fb]">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef5fc]">
                <svg className="h-3.5 w-3.5 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-snug text-[#003060]">
                    {n.message ?? n.trigger_event ?? "Notification"}
                </p>
                {dateStr && <p className="mt-0.5 text-[10px] text-[#9aa7b8]">{dateStr}</p>}
            </div>
        </button>
    );
}

type Props = {
    notifications:    NotifItem[];
    totalCount:       number;
    campaignSlug:     string;
    participantName:  string;
    organizerName:    string | null;
    organizationName: string | null;
    senderPhotoUrl:   string | null;
};

export default function ParticipantNotifications({ notifications, totalCount, campaignSlug, participantName, organizerName, organizationName, senderPhotoUrl }: Props) {
    const [showAll,    setShowAll]    = useState(false);
    const [detail,     setDetail]     = useState<NotifItem | null>(null);
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
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-[15px] font-bold text-[#003060]">My Notifications</h3>
                    <div className="flex items-center gap-3">
                        {hasMore ? (
                            <button
                                onClick={openModal}
                                className="text-[13px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80"
                            >
                                See all
                            </button>
                        ) : (
                            <span className="text-xs text-[#9aa7b8]">{totalCount} total</span>
                        )}
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                        <p className="px-5 py-6 text-center text-xs italic text-[#9aa7b8]">No notifications yet.</p>
                    ) : (
                        notifications.map((n) => <NotifRow key={n.id} n={n} onClick={() => setDetail(n)} />)
                    )}
                </div>
            </div>

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
                                My Notifications
                                <span className="ml-1 font-normal text-[#9aa7b8]">({modalTotal || totalCount})</span>
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

                        <div className="flex-1 divide-y divide-gray-50 overflow-y-auto [scrollbar-width:thin]">
                            {loading && modalItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                                </div>
                            ) : (
                                modalItems.map((n) => <NotifRow key={n.id} n={n} onClick={() => setDetail(n)} />)
                            )}
                        </div>

                        {canLoadMore && (
                            <div className="shrink-0 border-t border-[#e7e9eb] px-5 py-3">
                                <button
                                    onClick={() => fetchPage(modalSkip)}
                                    disabled={loading}
                                    className="w-full py-2 text-sm font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80 disabled:opacity-50"
                                >
                                    {loading ? "Loading…" : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {detail && (
                <NotificationDetailModal
                    notif={detail}
                    participantName={participantName}
                    organizerName={organizerName}
                    organizationName={organizationName}
                    senderPhotoUrl={senderPhotoUrl}
                    onClose={() => setDetail(null)}
                />
            )}
        </>
    );
}
