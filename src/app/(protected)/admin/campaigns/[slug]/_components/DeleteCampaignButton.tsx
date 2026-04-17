"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCampaignButton({ campaignSlug }: { campaignSlug: string }) {
    const router = useRouter();
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    async function handleDelete() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/campaigns/${campaignSlug}`, { method: "DELETE" });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error ?? "Something went wrong.");
                return;
            }
            router.push("/admin/campaigns");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => { setError(""); setOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Campaign
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        <h2 className="text-base font-bold text-gray-900">Delete Draft Campaign</h2>
                        <p className="text-sm text-gray-500">
                            This will permanently delete the campaign and all associated data. This action <span className="font-semibold text-gray-700">cannot be undone</span>.
                        </p>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                            >
                                {loading ? "Deleting…" : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
