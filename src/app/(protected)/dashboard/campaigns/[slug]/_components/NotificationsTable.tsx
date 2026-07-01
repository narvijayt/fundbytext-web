"use client";

import { useState, useCallback } from "react";

const MODAL_PAGE = 10;

function fmtDate(ts: number | null) {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}
function fmtTime(ts: number | null) {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "");
}

export type NotificationRow = {
    id:                  string;
    notification_type:   string;
    trigger_event:       string | null;
    message:             string | null;
    helper_text:         string | null;
    scheduled_at:        number | null;
    sent_at:             number | null;
    status:              string;
    recipient_member_id: string | null;
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
    sent:      { label: "Sent",      cls: "bg-green-100 text-green-700" },
    scheduled: { label: "Scheduled", cls: "bg-blue-100 text-blue-700" },
    pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-700" },
    failed:    { label: "Failed",    cls: "bg-red-100 text-red-600" },
    cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
};
function StatusPill({ status }: { status: string }) {
    const s = STATUS_STYLES[status] ?? { label: status.charAt(0).toUpperCase() + status.slice(1), cls: "bg-gray-100 text-gray-500" };
    return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

function EyeIcon() {
    return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.6" />
        </svg>
    );
}

function msgOf(n: NotificationRow) { return n.message ?? n.trigger_event ?? "Notification"; }
function whenOf(n: NotificationRow) { return n.scheduled_at ?? n.sent_at; }

// Stacked row — used for mobile cards + the "See all" modal (narrow surfaces).
function NotifCard({ n }: { n: NotificationRow }) {
    const date = fmtDate(whenOf(n));
    const time = fmtTime(whenOf(n));
    return (
        <div className="flex items-start gap-2.5 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-[#9aa7b8]"><EyeIcon /></span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#003060]">{msgOf(n)}</p>
                <p className="mt-0.5 truncate text-[12px] text-[#7e8a96]">
                    {n.helper_text ? n.helper_text : (date ? `${date}${time ? ` · ${time}` : ""}` : "—")}
                </p>
            </div>
            <span className="shrink-0"><StatusPill status={n.status} /></span>
        </div>
    );
}

type Props = {
    title:         string;
    notifications: NotificationRow[];
    totalCount:    number;
    campaignSlug:  string;
};

export default function NotificationsTable({ title, notifications, totalCount, campaignSlug }: Props) {
    const [collapsed,  setCollapsed]  = useState(false);
    const [showAll,    setShowAll]    = useState(false);
    const [modalItems, setModalItems] = useState<NotificationRow[]>([]);
    const [modalTotal, setModalTotal] = useState(0);
    const [modalSkip,  setModalSkip]  = useState(0);
    const [loading,    setLoading]    = useState(false);

    const fetchPage = useCallback(async (skip: number, replace = false) => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/v1/campaigns/${campaignSlug}/notifications-list?skip=${skip}&take=${MODAL_PAGE}&type=campaign`);
            const data = await res.json() as { notifications: NotificationRow[]; total: number };
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
                {/* Blue title bar */}
                <div className="flex items-center justify-between gap-3 bg-[#0268c0] px-5 py-3.5 text-white">
                    <h3 className="text-[15px] font-bold">{title}</h3>
                    <div className="flex items-center gap-3">
                        {hasMore && (
                            <button onClick={openModal} className="text-[13px] font-semibold text-white/90 transition-colors hover:text-white">See all</button>
                        )}
                        <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"} className="inline-flex h-6 w-6 items-center justify-center rounded text-white/90 hover:bg-white/15">
                            <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" /></svg>
                        </button>
                    </div>
                </div>

                {!collapsed && (
                    notifications.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No notifications yet.</p>
                    ) : (
                        <>
                            {/* Desktop / tablet table */}
                            <div className="hidden md:block">
                                <table className="w-full table-fixed text-sm">
                                    <colgroup>
                                        <col className="w-[48px]" />
                                        <col />
                                        <col className="w-[22%]" />
                                        <col className="w-[112px]" />
                                        <col className="w-[92px]" />
                                        <col className="w-[104px]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b border-[#e7e9eb] text-left align-top text-[11px] font-bold uppercase tracking-[0.5px] text-[#003060]">
                                            <th className="py-3 pl-5" />
                                            <th className="px-3 py-3">Message</th>
                                            <th className="px-3 py-3">Helper Text</th>
                                            <th className="px-3 py-3">Scheduled Date</th>
                                            <th className="px-3 py-3">Scheduled Time</th>
                                            <th className="px-3 py-3 pr-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notifications.map((n) => (
                                            <tr key={n.id} className="border-b border-[#eef1f4] last:border-0 align-middle transition-colors hover:bg-[#f7f9fb]">
                                                <td className="py-3.5 pl-5 text-[#9aa7b8]"><EyeIcon /></td>
                                                <td className="px-3 py-3.5"><p className="truncate text-[13px] font-medium text-[#003060]">{msgOf(n)}</p></td>
                                                <td className="px-3 py-3.5"><p className="truncate text-[13px] text-[#7e8a96]">{n.helper_text ?? "—"}</p></td>
                                                <td className="px-3 py-3.5 text-[13px] text-[#003060]">{fmtDate(whenOf(n)) ?? "—"}</td>
                                                <td className="px-3 py-3.5 text-[13px] text-[#003060]">{fmtTime(whenOf(n)) ?? "—"}</td>
                                                <td className="px-3 py-3.5 pr-5"><StatusPill status={n.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-[#eef1f4] md:hidden">
                                {notifications.map((n) => <NotifCard key={n.id} n={n} />)}
                            </div>

                            {hasMore && (
                                <button onClick={openModal} className="w-full border-t border-[#eef1f4] py-3 text-[13px] font-semibold text-[#0268c0] transition-colors hover:bg-[#f7f9fb]">
                                    See all {totalCount} notifications
                                </button>
                            )}
                        </>
                    )
                )}
            </div>

            {/* See all modal */}
            {showAll && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm" onClick={() => setShowAll(false)}>
                    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)]" style={{ maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex shrink-0 items-center justify-between bg-[#0268c0] px-5 py-4 text-white">
                            <h2 className="text-[15px] font-bold">{title} <span className="font-normal text-white/70">({modalTotal || totalCount})</span></h2>
                            <button onClick={() => setShowAll(false)} aria-label="Close" className="text-white/80 transition-colors hover:text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 divide-y divide-[#eef1f4] overflow-y-auto [scrollbar-width:thin]">
                            {loading && modalItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                                </div>
                            ) : (
                                modalItems.map((n) => <NotifCard key={n.id} n={n} />)
                            )}
                        </div>
                        {canLoadMore && (
                            <div className="shrink-0 border-t border-[#eef1f4] px-5 py-3">
                                <button onClick={() => fetchPage(modalSkip)} disabled={loading} className="w-full py-2 text-sm font-semibold text-[#0268c0] transition-colors hover:brightness-110 disabled:opacity-50">
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
