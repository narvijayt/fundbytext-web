"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    donationId: string;
    isFlagged:  boolean;
    flagNote:   string;
};

export default function FlagDonationButton({ donationId, isFlagged, flagNote }: Props) {
    const router = useRouter();

    const [open, setOpen]       = useState(false);
    const [note, setNote]       = useState(flagNote);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function submit(flag: boolean) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/admin/donations/${donationId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ is_flagged: flag, flag_note: flag ? note.trim() : "" }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Something went wrong.");
                setLoading(false);
                return;
            }
            setOpen(false);
            router.refresh();
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => { setNote(flagNote); setError(null); setOpen(true); }}
                title={isFlagged ? "Flagged — click to manage" : "Flag this donation"}
                className={`p-1.5 rounded-lg transition-colors ${
                    isFlagged
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                }`}
            >
                <svg className="w-4 h-4" fill={isFlagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5l9-2 9 2v10l-9-2-9 2" />
                </svg>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        <h2 className="text-base font-bold text-gray-900 mb-1">
                            {isFlagged ? "Manage Flag" : "Flag Donation"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {isFlagged
                                ? "Update the note or remove the flag from this donation."
                                : "Add an optional note explaining why this donation is suspicious."}
                        </p>

                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Optional note (e.g. suspected duplicate, chargebacks…)"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40"
                        />
                        <p className="text-xs text-gray-400 text-right mt-1">{note.length}/500</p>

                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="flex items-center gap-2 mt-4">
                            {isFlagged && (
                                <button
                                    onClick={() => submit(false)}
                                    disabled={loading}
                                    className="flex-1 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Remove Flag
                                </button>
                            )}
                            <button
                                onClick={() => submit(true)}
                                disabled={loading}
                                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                            >
                                {loading ? "Saving…" : isFlagged ? "Update Flag" : "Flag Donation"}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="flex-1 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
