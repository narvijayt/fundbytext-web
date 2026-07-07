"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// Shared field styles — same tokens as the Create/Edit User + Edit Profile modals.
const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 pr-11 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 pr-11 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]";

type FormState = { new_password: string; confirm_password: string };
type ShowState = { next: boolean; confirm: boolean };

function EyeButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa7b8] transition-colors hover:text-[#003060]"
        >
            {shown ? (
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
        </button>
    );
}

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [shown, setShown]     = useState(false);
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [errors, setErrors]   = useState<Record<string, string>>({});
    const [reveal, setReveal]   = useState<ShowState>({ next: false, confirm: false });
    const [form, setForm]       = useState<FormState>({ new_password: "", confirm_password: "" });
    const firstRef = useRef<HTMLInputElement>(null);
    // Only close on a backdrop click that *started* on the backdrop — so dragging
    // a text selection out of an input doesn't dismiss the modal.
    const downOnBackdrop = useRef(false);

    useEffect(() => { setMounted(true); }, []);
    // Once mounted (portal painted at opacity-0/scale-95), flip on the next frame
    // so the enter transition plays. Gating render on `mounted` keeps the server
    // and first client render identical (null) — no hydration mismatch.
    useEffect(() => {
        if (!mounted) return;
        const raf = requestAnimationFrame(() => { setShown(true); firstRef.current?.focus(); });
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        window.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    function close() { if (saving) return; setShown(false); window.setTimeout(onClose, 170); }

    function set(field: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
        setApiError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
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
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                setApiError(typeof json.error === "string" ? json.error : "Failed to update password.");
                return;
            }
            setSuccess(true);
            window.setTimeout(() => close(), 1400);
        } catch {
            setApiError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onMouseDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
            onClick={(e) => { if (downOnBackdrop.current && e.target === e.currentTarget) close(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="change-password-title" className="text-[16px] font-bold">Change Password</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {success ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-12">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-[15px] font-bold text-[#003060]">Password updated!</p>
                        <p className="text-[13px] text-[#9aa7b8]">You can keep using your account as normal.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                            {apiError && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{apiError}</p>}

                            <div>
                                <label className={LABEL}>New Password</label>
                                <div className="relative">
                                    <input ref={firstRef} type={reveal.next ? "text" : "password"} value={form.new_password} onChange={(e) => set("new_password", e.target.value)} autoComplete="new-password" className={errors.new_password ? INPUT_ERR : INPUT} placeholder="Min. 8 characters" />
                                    <EyeButton shown={reveal.next} onToggle={() => setReveal((r) => ({ ...r, next: !r.next }))} />
                                </div>
                                {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password}</p>}
                            </div>

                            <div>
                                <label className={LABEL}>Confirm New Password</label>
                                <div className="relative">
                                    <input type={reveal.confirm ? "text" : "password"} value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)} autoComplete="new-password" className={errors.confirm_password ? INPUT_ERR : INPUT} placeholder="Re-enter new password" />
                                    <EyeButton shown={reveal.confirm} onToggle={() => setReveal((r) => ({ ...r, confirm: !r.confirm }))} />
                                </div>
                                {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                            <button type="button" onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                                {saving ? "Updating…" : "Update Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body,
    );
}
