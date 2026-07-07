"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
    slug: string;
    campaignName: string | null;
    /** Where to redirect after deletion — defaults to /dashboard */
    redirectTo?: string;
    /** Render as an icon-only button (for use inside cards) */
    compact?: boolean;
};

export default function DeleteCampaignButton({
    slug,
    campaignName,
    redirectTo = "/dashboard",
    compact = false,
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [shown, setShown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function close() { setShown(false); window.setTimeout(() => { setOpen(false); setError(null); }, 200); }

    // Enter/exit animation + scroll-lock + Escape.
    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) close(); };
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function handleDelete() {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${slug}`, { method: "DELETE" });
        if (res.ok) {
            router.push(redirectTo);
            router.refresh();
        } else {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Failed to delete campaign.");
            setLoading(false);
        }
    }

    return (
        <>
            {compact ? (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#8f98a3] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete this campaign
                </button>
            ) : (
                /* Campaign-view header button — icon-only on mobile (like Edit Campaign), icon + label on sm+ */
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Delete Campaign"
                    title="Delete Campaign"
                    className="inline-flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-2 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Delete Campaign</span>
                </button>
            )}

            {/* Confirmation dialog */}
            {open && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={() => { if (!loading) close(); }} />
                    {/* Modal */}
                    <div className={`relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0px_24px_48px_-12px_rgba(0,48,96,0.35)] max-h-[calc(100vh-2rem)] overflow-y-auto transition-all duration-200 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}>
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h2 className="mb-1.5 text-center text-[18px] font-black text-[rgba(0,48,96,1)]">Delete this campaign?</h2>
                        <p className="mb-5 text-center text-[14px] leading-relaxed text-[#57728d]">
                            <span className="font-bold text-[rgba(0,48,96,1)]">{campaignName ?? "This campaign"}</span>{" "}will be permanently deleted. This can&rsquo;t be undone.
                        </p>
                        {error && (
                            <p className="mb-3 text-center text-[13px] font-medium text-red-500">{error}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={close}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-[#d4dee7] py-3 text-sm font-semibold text-[rgba(0,48,96,1)] transition-colors hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? "Deleting…" : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
