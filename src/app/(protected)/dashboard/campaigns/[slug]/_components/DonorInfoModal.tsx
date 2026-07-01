"use client";

import { useState, useEffect } from "react";
import type { DonorRow } from "./DonorsTable";

type Props = {
    donor:       DonorRow;
    isOrganizer: boolean;
    myMemberId?: string;
    onClose:     () => void;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function dt(ts: number) {
    const d = new Date(ts);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}
const STATUS: Record<string, { label: string; cls: string }> = {
    donated:     { label: "Donated",     cls: "bg-green-100 text-green-700" },
    contacted:   { label: "Contacted",   cls: "bg-blue-100 text-blue-700"   },
    not_donated: { label: "Not Donated", cls: "bg-red-100 text-red-600"     },
};

export default function DonorInfoModal({ donor, isOrganizer, myMemberId, onClose }: Props) {
    const [shown,  setShown]  = useState(false);
    const [copied, setCopied] = useState(false);

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

    const sb = STATUS[donor.status] ?? STATUS.not_donated;
    const canCopy = donor.short_code && (donor.email || donor.phone);

    // "Added by" — organizer viewing own-added donor, or participant viewing a pure-organizer-added donor
    let addedBy: React.ReactNode = null;
    if (donor.added_by_member) {
        const addedByMe   = donor.added_by_member.id === myMemberId;
        const adderIsOrg  = donor.added_by_member.roles.some((r) => r.role === "organizer");
        const adderIsPart = donor.added_by_member.roles.some((r) => r.role === "participant");
        if (isOrganizer && addedByMe) {
            addedBy = <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">Me</span>;
        } else if (!isOrganizer && adderIsOrg && !adderIsPart) {
            addedBy = <span className="inline-flex items-center gap-1.5"><span className="font-medium text-[#003060]">{donor.added_by_member.first_name} {donor.added_by_member.last_name}</span><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">Organizer</span></span>;
        }
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
            <div role="dialog" aria-modal="true" aria-labelledby="donor-info-title" onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-2 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="donor-info-title" className="text-[16px] font-bold">Donor Information</h2>
                    <div className="flex items-center gap-1">
                        {canCopy && (
                            <button
                                title={copied ? "Copied!" : "Copy donor link"}
                                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/d/${donor.short_code}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25"
                            >
                                {copied
                                    ? <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    : <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                            </button>
                        )}
                        <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[17px] font-bold text-[#003060]">{donor.first_name} {donor.last_name}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${sb.cls}`}>{sb.label}</span>
                    </div>

                    <div className="text-[13px]">
                        <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] py-2.5">
                            <span className="text-[#9aa7b8]">Email</span>
                            <span className="truncate font-medium text-[#003060]">{donor.email ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] py-2.5">
                            <span className="text-[#9aa7b8]">Phone</span>
                            <span className="font-medium text-[#003060]">{donor.phone ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] py-2.5">
                            <span className="text-[#9aa7b8]">Assigned to</span>
                            <span className="font-medium text-[#003060]">{donor.assigned_member ? `${donor.assigned_member.first_name} ${donor.assigned_member.last_name}` : "—"}</span>
                        </div>
                        {addedBy && (
                            <div className="flex items-center justify-between gap-4 py-2.5">
                                <span className="text-[#9aa7b8]">Added by</span>
                                <span className="text-right">{addedBy}</span>
                            </div>
                        )}
                    </div>

                    {donor.donations.length > 0 && (
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-[#003060]">Donations</p>
                            <div className="space-y-2">
                                {donor.donations.map((don, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-[#9aa7b8]">{dt(don.donated_at)}</p>
                                            {don.is_anonymous && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Anonymous</span>}
                                        </div>
                                        <span className="shrink-0 text-[13px] font-bold text-[#28c45d]">{fmt(don.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
