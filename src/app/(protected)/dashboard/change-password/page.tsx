"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
const inputErrCls = "w-full border border-red-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    function set(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
        setApiError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!form.current_password) errs.current_password = "Current password is required.";
        if (form.new_password.length < 8) errs.new_password = "New password must be at least 8 characters.";
        if (form.new_password !== form.confirm_password) errs.confirm_password = "Passwords do not match.";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/v1/user/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) {
                setApiError(json.error ?? "Failed to update password.");
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch {
            setApiError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {success ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Password updated!</p>
                        <p className="text-xs text-gray-400">Redirecting to dashboard…</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {apiError && (
                            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Current Password</label>
                            <input
                                type="password"
                                value={form.current_password}
                                onChange={(e) => set("current_password", e.target.value)}
                                autoComplete="current-password"
                                className={errors.current_password ? inputErrCls : inputCls}
                            />
                            {errors.current_password && <p className="text-xs text-red-500 mt-1">{errors.current_password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">New Password</label>
                            <input
                                type="password"
                                value={form.new_password}
                                onChange={(e) => set("new_password", e.target.value)}
                                autoComplete="new-password"
                                className={errors.new_password ? inputErrCls : inputCls}
                            />
                            {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Confirm New Password</label>
                            <input
                                type="password"
                                value={form.confirm_password}
                                onChange={(e) => set("confirm_password", e.target.value)}
                                autoComplete="new-password"
                                className={errors.confirm_password ? inputErrCls : inputCls}
                            />
                            {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? "Updating…" : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
