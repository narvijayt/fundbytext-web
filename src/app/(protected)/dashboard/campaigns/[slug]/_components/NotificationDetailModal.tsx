"use client";

import { useEffect, useState } from "react";
import type { NotifItem } from "./ParticipantNotifications";

/* Maps a raw notification trigger_event to a short, human-readable name shown in
   the modal header. Handles dynamic suffixes (e.g. participant_goal_completed_<name>,
   goal_scaled_<amount>) by prefix, and falls back to a title-cased event name. */
const NAME_MAP: Record<string, string> = {
    participant_added:          "Welcome",
    donation_received:          "Donation Received",
    participant_goal_completed: "Goal Reached",
    campaign_goal_completed:    "Goal Reached",
    campaign_launched:          "Campaign Launched",
    campaign_now_active:        "Campaign Live",
    campaign_completed:         "Campaign Completed",
    campaign_ended_early:       "Campaign Ended",
    campaign_reactivated:       "Campaign Reactivated",
    donations_paused:           "Donations Paused",
    donations_resumed:          "Donations Resumed",
    start_date_changed:         "Start Date Updated",
    campaign_extended:          "Campaign Extended",
    goal_scaled:                "Goal Updated",
};

export function notificationName(trigger: string | null): string {
    if (!trigger) return "Notification";
    const t = trigger.replace(/_broadcast$/, "");
    if (NAME_MAP[t]) return NAME_MAP[t];
    for (const key of Object.keys(NAME_MAP)) {
        if (t.startsWith(key + "_")) return NAME_MAP[key];
    }
    return t.split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

const STATUS: Record<string, { label: string; cls: string }> = {
    sent:      { label: "Sent",      cls: "bg-[#dcf5e5] text-[#28c45d]" },
    scheduled: { label: "Scheduled", cls: "bg-[#eef5fc] text-[#0268c0]" },
    pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-600" },
    queued:    { label: "Queued",    cls: "bg-amber-50 text-amber-600" },
    failed:    { label: "Failed",    cls: "bg-red-50 text-red-600" },
    cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
};

function parts(ts: number | null) {
    if (!ts) return null;
    const d = new Date(ts);
    return {
        weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
        date:    d.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
        time:    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
}

type Props = {
    notif:            NotifItem;
    participantName:  string;
    organizerName:    string | null;
    organizationName: string | null;
    senderPhotoUrl:   string | null;
    onClose:          () => void;
};

export default function NotificationDetailModal({ notif, participantName, organizerName, organizationName, senderPhotoUrl, onClose }: Props) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    const title   = notificationName(notif.trigger_event);
    const message = notif.message ?? notif.helper_text ?? "";
    const status  = STATUS[notif.status] ?? STATUS.sent;
    const dt      = parts(notif.sent_at ?? notif.scheduled_at);
    const chars   = message.length;

    return (
        <div
            className={`fixed inset-0 z-[110] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="notif-detail-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_32px_0px_rgba(15,29,67,0.24)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#e8eaee] bg-[#0278de] py-4 pl-6 pr-4 text-white">
                    <h2 id="notif-detail-title" className="text-[18px] font-bold leading-tight">{title}</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-scroll flex-1 space-y-6 overflow-y-auto p-6">
                    {/* Message "letter" card */}
                    <div className="overflow-hidden rounded-2xl border border-[#dde0e3]">
                        {/* greeting strip */}
                        <div className="border-b border-[#d4dee7] bg-[#f4f5f6] px-6 py-4">
                            <p className="text-[15px] font-bold text-[#7e8a96]">Hi {participantName},</p>
                        </div>
                        {/* message + signature */}
                        <div className="flex flex-col items-end gap-6 px-6 py-7">
                            <p className="w-full whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#003060]">{message}</p>
                            <div className="flex items-center gap-2.5">
                                {senderPhotoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={senderPhotoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7e9eb] text-[10px] font-bold text-[#7e8a96]">
                                        {(organizerName ?? organizationName ?? "?").trim().charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-right text-[14px] font-medium leading-tight">
                                    <p className="text-[#003060]">Thanks,</p>
                                    {organizerName && <p className="mt-1.5 text-[#7e8a96]">{organizerName}</p>}
                                    {organizationName && <p className="text-[#7e8a96]">{organizationName}</p>}
                                </div>
                            </div>
                        </div>
                        {/* char count */}
                        <div className="border-t border-[#d4dee7] px-6 py-3.5">
                            <p className="text-[11px] font-black uppercase tracking-[1px] text-[#9aa7b8]">{chars}/160 Characters</p>
                        </div>
                    </div>

                    {/* Status + date/time */}
                    <div className="flex items-center gap-3">
                        <span className={`rounded-md px-1.5 pb-1.5 pt-1 text-[12px] font-bold leading-none ${status.cls}`}>{status.label}</span>
                        {dt && (
                            <div className="flex items-center gap-2 text-[13px] text-[#9aa7b8]">
                                <span className="font-medium">{dt.weekday}</span>
                                <span className="font-bold text-[#003060]">{dt.date}</span>
                                <span className="font-medium">{dt.time}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
