"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
    donorId:      string;
    campaignSlug: string;
    initialFirst: string;
    initialLast:  string;
    email:        string | null;   // read-only (re-sent unchanged so it isn't wiped)
    initialPhone: string | null;
    onClose:      () => void;
    onRefresh?:   () => void;
};

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]";

export default function EditDonorModal({ donorId, campaignSlug, initialFirst, initialLast, email, initialPhone, onClose, onRefresh }: Props) {
    const [firstName,   setFirstName]   = useState(initialFirst);
    const [lastName,    setLastName]    = useState(initialLast);
    const [phone,       setPhone]       = useState(initialPhone ?? "");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shown,       setShown]       = useState(false);
    const firstRef = useRef<HTMLInputElement>(null);

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
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email ?? null, phone: phone.trim() || null }),
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
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="edit-donor-title" className="text-[16px] font-bold">Edit Donor</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>

                    <div>
                        <label className={LABEL}>Phone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="(555) 000-0000" />
                    </div>

                    <div>
                        <label className={LABEL}>Email Address</label>
                        <input type="email" value={email ?? ""} disabled placeholder="—" className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]" />
                        <p className="mt-1 text-xs text-[#9aa7b8]">Email can&apos;t be changed.</p>
                    </div>

                    {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                    <button onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
                </div>
            </div>
        </div>
    );
}
