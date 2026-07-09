"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
    campaignSlug: string;
    participants: { id: string; first_name: string; last_name: string }[];
    isOrganizer: boolean;
    participantView?: boolean;
    myMemberId?: string; // pre-assign to self when in participant view
    /* Fixed-goal remaining cap for the suggested amount (cents). null = any
       campaign/goal type (uncapped); 0 = fixed goal already met (feature off). */
    maxPrefillCents?: number | null;
    onClose: () => void;
    onSuccess?: () => void;
};

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[13px] font-semibold text-[#003060]";

export default function AddDonorModal({ campaignSlug, participants, isOrganizer, participantView, myMemberId, maxPrefillCents, onClose, onSuccess }: Props) {
    const [firstName,   setFirstName]   = useState("");
    const [lastName,    setLastName]    = useState("");
    const [email,       setEmail]       = useState("");
    const [phone,       setPhone]       = useState("");
    const [assignedMemberId, setAssignedMemberId] = useState<string>(myMemberId ?? "");
    const [prefillEnabled, setPrefillEnabled] = useState(false);
    const [prefillRaw,  setPrefillRaw]  = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shown,       setShown]       = useState(false);

    const firstRef = useRef<HTMLInputElement>(null);

    // Suggested-amount cap: fixed-goal campaigns limit it to the remaining goal.
    const isFixedCap  = maxPrefillCents != null;         // fixed-goal individual campaign
    const goalMet     = maxPrefillCents === 0;           // fixed goal already reached
    const prefillCents = Math.round((parseFloat(prefillRaw) || 0) * 100);
    const prefillExceeds = isFixedCap && maxPrefillCents! > 0 && prefillCents > maxPrefillCents!;

    useEffect(() => {
        const raf = requestAnimationFrame(() => { setShown(true); firstRef.current?.focus(); });
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKey);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() {
        setShown(false);
        window.setTimeout(onClose, 170);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!firstName.trim())  errs.firstName = "First name is required.";
        if (!lastName.trim())   errs.lastName  = "Last name is required.";
        if (!email && !phone)   errs.contact   = "Please provide an email address or phone number.";
        const wantsPrefill = prefillEnabled && !goalMet;
        if (wantsPrefill) {
            if (prefillCents < 100)     errs.prefill = "Enter at least $1.";
            else if (prefillExceeds)    errs.prefill = `Max is ${usd(maxPrefillCents! / 100)}.`;
        }
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email || undefined,
                phone: phone || undefined,
                assigned_member_id: assignedMemberId || undefined,
                participant_view: participantView ?? false,
                prefill_amount_cents: wantsPrefill ? prefillCents : null,
            }),
        });

        if (res.ok) {
            onSuccess?.();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to add donor.");
            setSaving(false);
        }
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-donor-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                            </svg>
                        </span>
                        <div className="min-w-0">
                            <h2 id="add-donor-title" className="text-[16px] font-bold leading-tight">Add Donor</h2>
                            <p className="text-[12px] text-white/75">Invite someone to donate to this campaign</p>
                        </div>
                    </div>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* 2-column on desktop so the form fits without scrolling; stacks and
                    scrolls on smaller screens. */}
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="modal-scroll grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                        {/* Invite info */}
                        <div className="flex gap-2.5 rounded-xl border border-[#cfe0f3] bg-[#eef5fc] px-3.5 py-3 text-[12px] leading-snug text-[#0268c0] sm:col-span-2">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0268c0]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>This donor will receive an invite via email or SMS (or both) to donate to the campaign.</span>
                        </div>

                        <div>
                            <label className={LABEL}>First Name</label>
                            <input ref={firstRef} value={firstName} onChange={(e) => { setFirstName(e.target.value); setFieldErrors((f) => ({ ...f, firstName: "" })); }} className={fieldErrors.firstName ? INPUT_ERR : INPUT} placeholder="Jane" />
                            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Last Name</label>
                            <input value={lastName} onChange={(e) => { setLastName(e.target.value); setFieldErrors((f) => ({ ...f, lastName: "" })); }} className={fieldErrors.lastName ? INPUT_ERR : INPUT} placeholder="Smith" />
                            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
                        </div>

                        <div>
                            <label className={LABEL}>Email</label>
                            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }} className={fieldErrors.contact ? INPUT_ERR : INPUT} placeholder="jane@example.com" />
                        </div>
                        <div>
                            <label className={LABEL}>Phone</label>
                            <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }} className={fieldErrors.contact ? INPUT_ERR : INPUT} placeholder="(555) 000-0000" />
                        </div>
                        {fieldErrors.contact
                            ? <p className="text-xs text-red-500 sm:col-span-2">{fieldErrors.contact}</p>
                            : <p className="text-xs text-[#9aa7b8] sm:col-span-2">At least one of email or phone is required.</p>}

                        {/* Organizers can assign to any participant */}
                        {isOrganizer && participants.length > 0 && (
                            <div className="sm:col-span-2">
                                <label className={LABEL}>Assign to Participant</label>
                                <select value={assignedMemberId} onChange={(e) => setAssignedMemberId(e.target.value)} className={INPUT}>
                                    <option value="">— Unassigned (General) —</option>
                                    {participants.map((p) => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Suggested (prefilled) donation amount — opt-in */}
                        <div className="rounded-xl border border-[#e7e9eb] p-3.5 sm:col-span-2">
                            <label className={`flex items-start gap-3 ${goalMet ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                                <input
                                    type="checkbox"
                                    checked={prefillEnabled && !goalMet}
                                    disabled={goalMet}
                                    onChange={(e) => { setPrefillEnabled(e.target.checked); setFieldErrors((f) => ({ ...f, prefill: "" })); }}
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d4dee7] text-[#0268c0] focus:ring-2 focus:ring-[#0268c0]/30 disabled:opacity-50"
                                />
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-semibold text-[#003060]">Set a suggested donation amount</span>
                                    <span className="mt-0.5 block text-[12px] leading-snug text-[#7e8a96]">Pre-fills this amount when the donor opens their invite link. They can still change it.</span>
                                </span>
                            </label>

                            {goalMet && (
                                <p className="mt-2.5 text-xs text-[#9aa7b8]">This campaign has reached its fixed goal, so no amount can be suggested.</p>
                            )}

                            {prefillEnabled && !goalMet && (
                                <div className="mt-3 max-w-xs">
                                    <div className="mb-1.5 flex items-baseline justify-between">
                                        <label className="text-[12px] font-semibold text-[#003060]">Suggested amount</label>
                                        {isFixedCap && maxPrefillCents! > 0 && (
                                            <button type="button" onClick={() => { setPrefillRaw(String(maxPrefillCents! / 100)); setFieldErrors((f) => ({ ...f, prefill: "" })); }} className="text-[11px] font-semibold text-[#0268c0] hover:underline">
                                                Max: {usd(maxPrefillCents! / 100)}
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#9aa7b8]">$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={prefillRaw}
                                            onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) { setPrefillRaw(v); setFieldErrors((f) => ({ ...f, prefill: "" })); } }}
                                            placeholder="0.00"
                                            className={`w-full rounded-[12px] border bg-white py-2.5 pl-8 pr-4 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:outline-none focus:ring-2 ${fieldErrors.prefill || prefillExceeds ? "border-red-300 focus:border-red-400 focus:ring-red-400/25" : "border-[#d4dee7] focus:border-[#0268c0] focus:ring-[#0268c0]/20"}`}
                                        />
                                    </div>
                                    {fieldErrors.prefill || prefillExceeds ? (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.prefill || `Exceeds the remaining goal (max ${usd(maxPrefillCents! / 100)}).`}</p>
                                    ) : isFixedCap && maxPrefillCents! > 0 ? (
                                        <p className="mt-1 text-xs text-[#9aa7b8]">Limited to the remaining goal: {usd(maxPrefillCents! / 100)}.</p>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{error}</p>
                        )}
                    </div>

                    {/* Footer — pinned so it stays visible without scrolling */}
                    <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                        <button type="button" onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="rounded-[10px] bg-[#28c45d] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60">
                            {saving ? "Adding…" : "Add Donor"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
