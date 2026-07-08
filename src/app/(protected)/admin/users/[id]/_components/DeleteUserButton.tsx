"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({
    userId,
    isDeleted,
}: {
    userId:    string;
    isDeleted: boolean;
}) {
    const [open,    setOpen]    = useState(false);
    const [shown,   setShown]   = useState(false);
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

    function close() { if (loading) return; setShown(false); window.setTimeout(() => setOpen(false), 170); }

    async function run(method: "DELETE" | "PATCH") {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method,
                ...(method === "PATCH" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) } : {}),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setError(json.error ?? "Something went wrong.");
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
                onClick={() => { setError(""); setOpen(true); }}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    isDeleted
                        ? "border border-[#e7e9eb] bg-white text-[#003060] hover:bg-gray-50"
                        : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                }`}
            >
                {isDeleted ? "Restore Account" : "Delete Account"}
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
                        <div className="modal-scroll max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto p-6">
                            <div className="flex items-start gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDeleted ? "bg-blue-100 text-[#0268c0]" : "bg-red-100 text-red-600"}`}>
                                    {isDeleted ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" /></svg>
                                    )}
                                </div>
                                <div className="min-w-0 space-y-2">
                                    <h2 className="text-[16px] font-bold text-[#003060]">{isDeleted ? "Restore Account" : "Delete Account"}</h2>
                                    {isDeleted ? (
                                        <p className="text-sm text-[#7e8a96]">The user account will be restored and the user will be able to log in again. All their campaigns, donations, and data remain intact.</p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-[#7e8a96]">This is a <span className="font-semibold text-[#5b6b7c]">soft delete</span> — the account is deactivated and the user is immediately logged out. All campaigns, donations, and associated data are preserved and remain fully intact.</p>
                                            <p className="text-sm text-[#7e8a96]">The account can be restored at any time from this page.</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                            <div className="flex justify-end gap-3 pt-1">
                                <button onClick={close} disabled={loading} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                                <button
                                    onClick={() => run(isDeleted ? "PATCH" : "DELETE")}
                                    disabled={loading}
                                    className={`rounded-[10px] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors disabled:opacity-60 ${isDeleted ? "bg-[#0268c0] hover:brightness-110" : "bg-red-500 hover:bg-red-600"}`}
                                >
                                    {loading ? "…" : isDeleted ? "Confirm Restore" : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
