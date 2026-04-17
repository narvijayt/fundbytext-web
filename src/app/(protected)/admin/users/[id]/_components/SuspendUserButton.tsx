"use client";

import { useState } from "react";
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
    const [message, setMessage] = useState(suspensionMessage ?? "");
    const [error,   setError]   = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function submit(suspend: boolean) {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    is_suspended:       suspend,
                    suspension_message: suspend ? (message.trim() || null) : null,
                }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setError(json.error ?? "Something went wrong. Please try again.");
                return;
            }
            setOpen(false);
            router.refresh();
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
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isSuspended
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }`}
            >
                {isSuspended ? "Unsuspend" : "Suspend"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">

                        {isSuspended ? (
                            <>
                                <h2 className="text-base font-bold text-gray-900">Unsuspend User</h2>
                                <p className="text-sm text-gray-500">
                                    The user will regain full access to their account immediately.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-bold text-gray-900">Suspend User</h2>
                                <p className="text-sm text-gray-500">
                                    The user will be immediately logged out and unable to sign in.
                                </p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Message shown at login{" "}
                                        <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="e.g. Your account has been suspended due to a violation of our terms of service."
                                        rows={3}
                                        maxLength={300}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                                    />
                                    <p className="text-right text-xs text-gray-400 mt-0.5">{message.length}/300</p>
                                </div>
                            </>
                        )}

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
                                onClick={() => submit(!isSuspended)}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                    isSuspended
                                        ? "bg-green-500 hover:bg-green-600 text-white"
                                        : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                            >
                                {loading
                                    ? "…"
                                    : isSuspended ? "Confirm Unsuspend" : "Confirm Suspend"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
