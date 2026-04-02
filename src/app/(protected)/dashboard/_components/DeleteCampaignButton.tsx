"use client";

import { useState } from "react";
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete this campaign
                </button>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Campaign
                </button>
            )}

            {/* Confirmation dialog */}
            {open && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Campaign?</h2>
                        <p className="text-sm text-gray-500 text-center mb-4">
                            <span className="font-semibold text-gray-700">{campaignName ?? "This campaign"}</span> will be permanently deleted. This cannot be undone.
                        </p>
                        {error && (
                            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setOpen(false); setError(null); }}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
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
