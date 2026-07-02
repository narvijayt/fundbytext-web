"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    donationId: string;
    isFlagged:  boolean;
    flagNote:   string;
    /** Called after a successful flag change so a client-owned table can refetch. */
    onChanged?: () => void;
};

export default function FlagDonationButton({ donationId, isFlagged, flagNote, onChanged }: Props) {
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
            if (onChanged) onChanged();
            else router.refresh();
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
                className={`rounded-lg p-1.5 transition-colors ${
                    isFlagged
                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                        : "text-[#9aa7b8] hover:bg-gray-100 hover:text-[#003060]"
                }`}
            >
                <svg className="h-4 w-4" fill={isFlagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5l9-2 9 2v10l-9-2-9 2" />
                </svg>
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm">
                    <div className="max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)]">
                        <h2 className="mb-1 text-[15px] font-bold text-[#003060]">
                            {isFlagged ? "Manage Flag" : "Flag Donation"}
                        </h2>
                        <p className="mb-4 text-sm text-[#7e8a96]">
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
                            className="w-full resize-none rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                        />
                        <p className="mt-1 text-right text-xs text-[#9aa7b8]">{note.length}/500</p>

                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                            {isFlagged && (
                                <button
                                    onClick={() => submit(false)}
                                    disabled={loading}
                                    className="flex-1 rounded-xl border border-[#e7e9eb] bg-white py-2.5 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Remove Flag
                                </button>
                            )}
                            <button
                                onClick={() => submit(true)}
                                disabled={loading}
                                className="flex-1 rounded-xl bg-red-500 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? "Saving…" : isFlagged ? "Update Flag" : "Flag Donation"}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-[#e7e9eb] bg-white py-2.5 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-50"
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
