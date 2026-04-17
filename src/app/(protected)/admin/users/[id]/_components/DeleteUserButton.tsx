"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({
    userId,
    isDeleted,
}: {
    userId:    string;
    isDeleted: boolean;
}) {
    const [open,    setOpen]    = useState(false);
    const [error,   setError]   = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setError(json.error ?? "Something went wrong.");
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

    async function handleRestore() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ restore: true }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                setError(json.error ?? "Something went wrong.");
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
                    isDeleted
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }`}
            >
                {isDeleted ? "Restore Account" : "Delete Account"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">

                        {isDeleted ? (
                            <>
                                <h2 className="text-base font-bold text-gray-900">Restore Account</h2>
                                <p className="text-sm text-gray-500">
                                    The user account will be restored and the user will be able to log in again. All their campaigns, donations, and data remain intact.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-bold text-gray-900">Delete Account</h2>
                                <p className="text-sm text-gray-500">
                                    This is a <span className="font-semibold text-gray-700">soft delete</span> — the account is deactivated and the user is immediately logged out. All campaigns, donations, and associated data are preserved and remain fully intact.
                                </p>
                                <p className="text-sm text-gray-500">
                                    The account can be restored at any time from this page.
                                </p>
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
                                onClick={isDeleted ? handleRestore : handleDelete}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                    isDeleted
                                        ? "bg-[#0268c0] hover:bg-[#0257a0] text-white"
                                        : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                            >
                                {loading
                                    ? "…"
                                    : isDeleted ? "Confirm Restore" : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
