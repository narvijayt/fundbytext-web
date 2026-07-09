"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
    donorId:      string;
    campaignSlug: string;
    initialFirst: string;
    initialLast:  string;
    initialEmail: string | null;   // locked if set at add time; editable (to add) if empty
    initialPhone: string | null;   // locked if set at add time; editable (to add) if empty
    initialPrefillCents?: number | null;   // current suggested amount (cents), if any
    maxPrefillCents?:     number | null;    // fixed-goal remaining cap; null = any, 0 = goal met
    hasPaid?:     boolean;          // donor has a completed donation → suggested amount is locked
    onClose:      () => void;
    onRefresh?:   () => void;
};

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[13px] font-semibold text-[#003060]";

export default function EditDonorModal({ donorId, campaignSlug, initialFirst, initialLast, initialEmail, initialPhone, initialPrefillCents, maxPrefillCents, hasPaid, onClose, onRefresh }: Props) {
    const [firstName,   setFirstName]   = useState(initialFirst);
    const [lastName,    setLastName]    = useState(initialLast);
    const [email,       setEmail]       = useState(initialEmail ?? "");
    const [phone,       setPhone]       = useState(initialPhone ?? "");
    const [prefillEnabled, setPrefillEnabled] = useState(initialPrefillCents != null);
    const [prefillRaw,  setPrefillRaw]  = useState(initialPrefillCents != null ? String(initialPrefillCents / 100) : "");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shown,       setShown]       = useState(false);
    const firstRef = useRef<HTMLInputElement>(null);

    // A contact field is locked if it was provided when the donor was added; a
    // field left empty can be filled in later. The suggested amount locks once
    // the donor has paid.
    const emailLocked   = !!(initialEmail && initialEmail.trim());
    const phoneLocked   = !!(initialPhone && initialPhone.trim());
    const prefillLocked = !!hasPaid;

    const isFixedCap      = maxPrefillCents != null;
    const goalMet         = maxPrefillCents === 0;
    const prefillDisabled = goalMet || prefillLocked;
    const prefillCents    = Math.round((parseFloat(prefillRaw) || 0) * 100);
    const prefillExceeds  = isFixedCap && maxPrefillCents! > 0 && prefillCents > maxPrefillCents!;

    useEffect(() => {
        const raf = requestAnimationFrame(() => { setShown(true); firstRef.current?.focus(); });
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    async function handleSave() {
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.firstName = "First name is required.";
        if (!lastName.trim())  errs.lastName  = "Last name is required.";
        if (!emailLocked && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            errs.email = "Enter a valid email address.";
        const wantsPrefill = prefillEnabled && !prefillDisabled;
        if (wantsPrefill) {
            if (prefillCents < 100)  errs.prefill = "Enter at least $1.";
            else if (prefillExceeds) errs.prefill = `Max is ${usd(maxPrefillCents! / 100)}.`;
        }
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);

        // Only send fields that can actually change: name always; a contact field
        // only if it was empty at add time; the suggested amount only if unpaid.
        const payload: Record<string, unknown> = { first_name: firstName.trim(), last_name: lastName.trim() };
        if (!emailLocked)   payload.email = email.trim() || null;
        if (!phoneLocked)   payload.phone = phone.trim() || null;
        if (!prefillLocked) payload.prefill_amount_cents = wantsPrefill ? prefillCents : null;

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });
        if (res.ok) {
            onRefresh?.();
            close();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to save changes.");
            setSaving(false);
        }
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
            <div role="dialog" aria-modal="true" aria-labelledby="edit-donor-title" onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="edit-donor-title" className="text-[16px] font-bold">Edit Donor</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                <div className="modal-scroll grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
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
                        {emailLocked ? (
                            <>
                                <input type="email" value={email} disabled placeholder="—" className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]" />
                                <p className="mt-1 text-xs text-[#9aa7b8]">Email can&apos;t be changed.</p>
                            </>
                        ) : (
                            <>
                                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }} className={fieldErrors.email ? INPUT_ERR : INPUT} placeholder="Add an email address" />
                                {fieldErrors.email
                                    ? <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                                    : <p className="mt-1 text-xs text-[#9aa7b8]">No email on file — add one to reach them by email.</p>}
                            </>
                        )}
                    </div>

                    <div>
                        <label className={LABEL}>Phone</label>
                        {phoneLocked ? (
                            <>
                                <input type="tel" value={phone} disabled placeholder="—" className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]" />
                                <p className="mt-1 text-xs text-[#9aa7b8]">Phone can&apos;t be changed.</p>
                            </>
                        ) : (
                            <>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="Add a phone number" />
                                <p className="mt-1 text-xs text-[#9aa7b8]">No phone on file — add one to reach them by SMS.</p>
                            </>
                        )}
                    </div>

                    {/* Suggested (prefilled) donation amount — opt-in */}
                    <div className="rounded-xl border border-[#e7e9eb] p-3.5 sm:col-span-2">
                        <label className={`flex items-start gap-3 ${prefillDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                            <input
                                type="checkbox"
                                checked={prefillEnabled && !prefillDisabled}
                                disabled={prefillDisabled}
                                onChange={(e) => { setPrefillEnabled(e.target.checked); setFieldErrors((f) => ({ ...f, prefill: "" })); }}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d4dee7] text-[#0268c0] focus:ring-2 focus:ring-[#0268c0]/30 disabled:opacity-50"
                            />
                            <span className="min-w-0">
                                <span className="block text-[13px] font-semibold text-[#003060]">Set a suggested donation amount</span>
                                <span className="mt-0.5 block text-[12px] leading-snug text-[#7e8a96]">Pre-fills this amount when the donor opens their invite link. They can still change it.</span>
                            </span>
                        </label>

                        {prefillLocked ? (
                            <p className="mt-2.5 text-xs text-[#9aa7b8]">This donor has already donated, so the suggested amount can no longer be changed.</p>
                        ) : goalMet ? (
                            <p className="mt-2.5 text-xs text-[#9aa7b8]">This campaign has reached its fixed goal, so no amount can be suggested.</p>
                        ) : null}

                        {prefillEnabled && !prefillDisabled && (
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

                    {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                    <button onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
                </div>
            </div>
        </div>
    );
}
