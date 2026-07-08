"use client";

import { useState, useEffect } from "react";
import type { AdminContactRow } from "../_lib/query";

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

type Props = {
    submission:   AdminContactRow;
    busy:         boolean;
    onToggleRead: () => void;
    onClose:      () => void;
};

export default function ContactDetailModal({ submission, busy, onToggleRead, onClose }: Props) {
    const [shown, setShown] = useState(false);
    const s = submission;

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    useEffect(() => {
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initials = `${s.first_name[0] ?? ""}${s.last_name[0] ?? ""}`.toUpperCase();

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog" aria-modal="true" aria-labelledby="contact-detail-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="contact-detail-title" className="text-[16px] font-bold">Contact Submission</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-scroll flex-1 space-y-5 overflow-y-auto p-5">
                    {/* Sender */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#aed9fe] text-sm font-bold text-[#0268c0]">{initials || "?"}</div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="truncate text-[15px] font-bold text-[#003060]">{s.first_name} {s.last_name}</p>
                                {!s.is_read && <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">Unread</span>}
                            </div>
                            <a href={`mailto:${s.email}`} className="break-all text-[13px] text-[#0268c0] hover:underline">{s.email}</a>
                        </div>
                    </div>

                    {/* Meta tiles */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[#9aa7b8]">Inquiry Type</p>
                            <span className="mt-1.5 inline-flex items-center rounded-full bg-[#feece4] px-2.5 py-1 text-[11px] font-semibold text-[#f47435]">{s.inquiry_type}</span>
                        </div>
                        <div className="rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[#9aa7b8]">Received</p>
                            <p className="mt-1 text-sm font-semibold text-[#003060]">{fmtDate(s.created_at)}</p>
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Message</p>
                        <div className="modal-scroll max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#eef1f4] bg-[#fbfcfe] px-4 py-3.5 text-sm leading-relaxed text-[#5b6b7c]">{s.message}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-5 py-4">
                    <button
                        onClick={onToggleRead}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#d4dee7] px-4 py-2.5 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60"
                    >
                        {busy ? "…" : s.is_read ? "Mark as Unread" : "Mark as Read"}
                    </button>
                    <div className="flex items-center gap-3">
                        <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#d4dee7] px-4 py-2.5 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                            <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Reply
                        </a>
                        <button onClick={close} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
