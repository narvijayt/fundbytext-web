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

    const sb      = STATUS[donor.status] ?? STATUS.not_donated;
    const canCopy = donor.short_code && (donor.email || donor.phone);
    const total   = donor.donations.reduce((s, d) => s + d.amount, 0);
    const count   = donor.donations.length;
    const initials = `${(donor.first_name[0] ?? "").toUpperCase()}${(donor.last_name[0] ?? "").toUpperCase()}`;

    // "Added by" value — organizer viewing own-added donor, or participant viewing a pure-organizer-added donor.
    let addedBy: React.ReactNode = null;
    if (donor.added_by_member) {
        const addedByMe   = donor.added_by_member.id === myMemberId;
        const adderIsOrg  = donor.added_by_member.roles.some((r) => r.role === "organizer");
        const adderIsPart = donor.added_by_member.roles.some((r) => r.role === "participant");
        if (isOrganizer && addedByMe) {
            addedBy = <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">Me</span>;
        } else if (!isOrganizer && adderIsOrg && !adderIsPart) {
            addedBy = <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-[#003060]">{donor.added_by_member.first_name} {donor.added_by_member.last_name}</span><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">Organizer</span></span>;
        }
    }

    const rows: { label: string; icon: React.ReactNode; value: React.ReactNode }[] = [
        { label: "Email", icon: <><path d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /><path d="M3.5 7.5l8.5 6 8.5-6" /></>, value: donor.email ?? "—" },
        { label: "Phone", icon: <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A16.5 16.5 0 015 6.1 1.5 1.5 0 016.5 3.5z" />, value: donor.phone ?? "—" },
        { label: "Assigned to", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>, value: donor.assigned_member ? `${donor.assigned_member.first_name} ${donor.assigned_member.last_name}` : "General pool" },
    ];
    if (donor.prefill_amount_cents) {
        rows.push({ label: "Suggested amount", icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><path d="M7 7h.01" /></>, value: fmt(donor.prefill_amount_cents / 100) });
    }
    if (addedBy) {
        rows.push({ label: "Added by", icon: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>, value: addedBy });
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
            <div role="dialog" aria-modal="true" aria-labelledby="donor-info-title" onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-2 bg-[#0268c0] px-5 py-4 text-white">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                            </svg>
                        </span>
                        <div className="min-w-0">
                            <h2 id="donor-info-title" className="text-[16px] font-bold leading-tight">View Donor</h2>
                            <p className="text-[12px] text-white/75">Read-only donor overview</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-5">
                        {/* Identity */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#aed9fe] text-[20px] font-bold text-[#0268c0] ring-4 ring-[#eef5fc]">
                                {initials || "?"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[18px] font-bold leading-tight text-[#003060]">{donor.first_name} {donor.last_name}</p>
                                <div className="mt-1.5">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sb.cls}`}>{sb.label}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats — one card split into two */}
                        <div className="grid grid-cols-2 divide-x divide-[#eef1f4] overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white">
                            <div className="px-4 py-4 text-center">
                                <p className="text-[22px] font-black leading-none text-[#28c45d]">{fmt(total)}</p>
                                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">Total Given</p>
                            </div>
                            <div className="px-4 py-4 text-center">
                                <p className="text-[22px] font-black leading-none text-[#0268c0]">{count}</p>
                                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">{count === 1 ? "Donation" : "Donations"}</p>
                            </div>
                        </div>

                        {/* Contact / meta — icon-led rows */}
                        <div className="overflow-hidden rounded-2xl border border-[#e7e9eb]">
                            {rows.map((row, i) => (
                                <div key={row.label} className={`flex items-center gap-3 px-3.5 py-3 ${i < rows.length - 1 ? "border-b border-[#eef1f4]" : ""}`}>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f6fa] text-[#0268c0]">
                                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{row.icon}</svg>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">{row.label}</p>
                                        <div className="truncate text-[13px] font-semibold text-[#003060]">{row.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Donations */}
                        {count > 0 && (
                            <div>
                                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#9aa7b8]">Donations</p>
                                <div className="space-y-2">
                                    {donor.donations.map((don, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-xl border border-[#eef1f4] px-3 py-2.5">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eafaf1] text-[#28c45d]">
                                                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="truncate text-[13px] font-semibold text-[#003060]">{dt(don.donated_at)}</p>
                                                    {don.is_anonymous && <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">Anon</span>}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[14px] font-bold text-[#28c45d]">{fmt(don.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
