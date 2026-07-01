"use client";

import { useState, useEffect } from "react";

type Props = {
    donorId:      string;
    campaignSlug: string;
    name:         string;
    hasDonated:   boolean;   // blocks removal (server rejects donors with completed donations)
    onClose:      () => void;
    onRefresh?:   () => void;
};

export default function RemoveDonorModal({ donorId, campaignSlug, name, hasDonated, onClose, onRefresh }: Props) {
    const [removing, setRemoving] = useState(false);
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

    async function handleRemove() {
        setRemoving(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, { method: "DELETE" });
        if (res.ok || res.status === 204) {
            onRefresh?.();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Delete failed.");
            setRemoving(false);
        }
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
            <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}>
                <div className="p-6">
                    <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${hasDonated ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                        {hasDonated ? (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" /></svg>
                        )}
                    </div>

                    {hasDonated ? (
                        <>
                            <h2 className="text-center text-[16px] font-bold text-[#003060]">Can&apos;t remove {name}</h2>
                            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#7e8a96]">This donor has made a donation, so they can&apos;t be removed from the campaign.</p>
                            <button onClick={close} className="mt-5 w-full rounded-[10px] bg-[#0268c0] py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110">Got it</button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-center text-[16px] font-bold text-[#003060]">Remove {name}?</h2>
                            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#7e8a96]">This donor will be removed from the campaign. This can&apos;t be undone.</p>
                            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-center text-[13px] font-medium text-red-600">{error}</p>}
                            <div className="mt-5 flex gap-3">
                                <button onClick={close} disabled={removing} className="flex-1 rounded-[10px] border border-[#d4dee7] py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                                <button onClick={handleRemove} disabled={removing} className="flex-1 rounded-[10px] bg-red-500 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60">{removing ? "Removing…" : "Remove"}</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
