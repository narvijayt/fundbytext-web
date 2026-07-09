"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCampaignButton({ campaignSlug }: { campaignSlug: string }) {
    const router = useRouter();
    const [open,    setOpen]    = useState(false);
    const [shown,   setShown]   = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    function close() { if (loading) return; setShown(false); window.setTimeout(() => setOpen(false), 170); }

    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function handleDelete() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/campaigns/${campaignSlug}`, { method: "DELETE" });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error ?? "Something went wrong.");
                setLoading(false);
                return;
            }
            router.push("/admin/campaigns");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => { setError(""); setOpen(true); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-red-600 shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-red-50"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete Campaign
            </button>

            {open && (
                <div
                    className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
                    onClick={close}
                >
                    <div
                        role="dialog" aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
                    >
                        <div className="modal-scroll max-h-[calc(100dvh-2rem)] space-y-4 overflow-y-auto p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-bold text-[#003060]">Delete Draft Campaign</h2>
                                    <p className="mt-1 text-sm text-[#7e8a96]">This will permanently delete the campaign and all associated data. This action <span className="font-semibold text-[#5b6b7c]">cannot be undone</span>.</p>
                                </div>
                            </div>

                            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                            <div className="flex justify-end gap-3 pt-1">
                                <button onClick={close} disabled={loading} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                                <button onClick={handleDelete} disabled={loading} className="rounded-[10px] bg-red-500 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60">{loading ? "Deleting…" : "Confirm Delete"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
