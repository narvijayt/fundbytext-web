"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuspendUserButton({
    userId,
    isSuspended,
    suspensionMessage,
}: {
    userId:            string;
    isSuspended:       boolean;
    suspensionMessage: string | null;
}) {
    const [open,    setOpen]    = useState(false);
    const [shown,   setShown]   = useState(false);
    const [message, setMessage] = useState(suspensionMessage ?? "");
    const [error,   setError]   = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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

    function openModal() { setError(""); setMessage(suspensionMessage ?? ""); setOpen(true); }
    function close() { if (loading) return; setShown(false); window.setTimeout(() => setOpen(false), 170); }

    async function submit(suspend: boolean) {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ is_suspended: suspend, suspension_message: suspend ? (message.trim() || null) : null }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setError(json.error ?? "Something went wrong. Please try again.");
                setLoading(false);
                return;
            }
            setShown(false);
            window.setTimeout(() => setOpen(false), 170);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={openModal}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    isSuspended
                        ? "bg-[#28c45d] text-white hover:brightness-105"
                        : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                }`}
            >
                {isSuspended ? "Unsuspend User" : "Suspend User"}
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
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSuspended ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                    {isSuspended ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-bold text-[#003060]">{isSuspended ? "Unsuspend User" : "Suspend User"}</h2>
                                    <p className="mt-1 text-sm text-[#7e8a96]">{isSuspended ? "The user will regain full access to their account immediately." : "The user will be immediately logged out and unable to sign in."}</p>
                                </div>
                            </div>

                            {!isSuspended && (
                                <div>
                                    <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]">Message shown at login <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(optional)</span></label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="e.g. Your account has been suspended due to a violation of our terms of service."
                                        rows={3}
                                        maxLength={300}
                                        className="w-full resize-none rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-sm text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                                    />
                                    <p className="mt-0.5 text-right text-xs text-[#9aa7b8]">{message.length}/300</p>
                                </div>
                            )}

                            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                            <div className="flex justify-end gap-3 pt-1">
                                <button onClick={close} disabled={loading} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                                <button
                                    onClick={() => submit(!isSuspended)}
                                    disabled={loading}
                                    className={`rounded-[10px] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors disabled:opacity-60 ${isSuspended ? "bg-[#28c45d] hover:brightness-105" : "bg-red-500 hover:bg-red-600"}`}
                                >
                                    {loading ? "…" : isSuspended ? "Confirm Unsuspend" : "Confirm Suspend"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
