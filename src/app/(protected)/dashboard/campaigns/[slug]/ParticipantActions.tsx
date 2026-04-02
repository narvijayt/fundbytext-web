"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
    memberId: string;
    campaignSlug: string;
    name: string;
    isOrganizer: boolean; // can't remove the organizer
};

export default function ParticipantActions({ memberId, campaignSlug, name, isOrganizer }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setConfirming(false);
                setError(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function handleRemove() {
        if (!confirming) { setConfirming(true); return; }
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setOpen(false);
            setConfirming(false);
            router.refresh();
        } else {
            const json = await res.json().catch(() => ({}));
            setError(json.error ?? "Failed to remove participant.");
        }
        setLoading(false);
    }

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => { setOpen((o) => !o); setConfirming(false); setError(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
                    <button
                        onClick={() => setOpen(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Participant
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Participant
                    </button>
                    {!isOrganizer && (
                        <>
                            <div className="border-t border-gray-100 my-1" />
                            {error && (
                                <p className="px-4 py-1 text-xs text-red-500">{error}</p>
                            )}
                            <button
                                onClick={handleRemove}
                                disabled={loading}
                                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {loading ? "Removing…" : confirming ? `Remove ${name}?` : "Remove"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
