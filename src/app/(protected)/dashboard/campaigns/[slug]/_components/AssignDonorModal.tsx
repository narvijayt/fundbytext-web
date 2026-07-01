"use client";

import { useState, useEffect } from "react";

type Props = {
    donorId:          string;
    campaignSlug:     string;
    donorName:        string;
    currentAssigned:  string;   // current assigned_member id ("" = unassigned)
    participants:     { id: string; first_name: string; last_name: string }[];
    onClose:          () => void;
    onRefresh?:       () => void;
};

const INPUT  = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const LABEL  = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]";

export default function AssignDonorModal({ donorId, campaignSlug, donorName, currentAssigned, participants, onClose, onRefresh }: Props) {
    const [assignTo, setAssignTo] = useState(currentAssigned);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState<string | null>(null);
    const [shown,    setShown]    = useState(false);

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

    async function handleSave() {
        setSaving(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ assigned_member_id: assignTo || null }),
        });
        if (res.ok) {
            onRefresh?.();
            close();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Assignment failed.");
            setSaving(false);
        }
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
            <div role="dialog" aria-modal="true" aria-labelledby="assign-donor-title" onClick={(e) => e.stopPropagation()}
                className={`flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="assign-donor-title" className="text-[16px] font-bold">Assign Participant</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div>
                        <label className={LABEL}>Donor&apos;s Name</label>
                        <input value={donorName} disabled className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]" />
                    </div>
                    <div>
                        <label className={LABEL}>Participants</label>
                        <select value={assignTo} onChange={(e) => { setAssignTo(e.target.value); setError(null); }} className={INPUT}>
                            <option value="">Unassigned (General Fund)</option>
                            {participants.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
                        </select>
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
