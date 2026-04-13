"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Props = {
    campaignSlug: string;
    memberId:     string;
    raised:       number;
};

export default function RemoveParticipantRoleButton({ campaignSlug, memberId, raised }: Props) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [removing,   setRemoving]   = useState(false);
    const [toast,      setToast]      = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function showToast(msg: string) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(msg);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    }

    async function handleRemove() {
        setRemoving(true);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, {
            method: "DELETE",
        });
        if (res.ok || res.status === 204) {
            router.push(`/dashboard/campaigns/${campaignSlug}`);
        } else {
            const j = await res.json().catch(() => ({}));
            showToast(j.error ?? "Failed to remove participant role.");
            setRemoving(false);
            setConfirming(false);
        }
    }

    return (
        <>
            {confirming ? (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Remove your participant role?</span>
                    <button
                        onClick={handleRemove}
                        disabled={removing}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {removing ? "Removing…" : "Yes, remove"}
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        className="px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => {
                        if (raised > 0) {
                            showToast(`Cannot leave — you have raised ${fmt(raised)} in donations.`);
                        } else {
                            setConfirming(true);
                        }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                    Leave Participant Role
                </button>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-xl shadow-lg max-w-xs">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    <span className="flex-1">{toast}</span>
                    <button onClick={() => setToast(null)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}
