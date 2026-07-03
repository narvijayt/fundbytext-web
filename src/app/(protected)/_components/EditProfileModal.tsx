"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────
type FormState = { first_name: string; last_name: string; email: string; confirm_email: string; phone: string };
type User = { first_name: string; last_name: string; email: string; phone: string | null; profile_photo_url: string | null };

// Shared field styles — same tokens as the Create/Edit User modals.
const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#003060]";

// ── Modal shell — portal overlay over the (still-mounted) page ──
export default function EditProfileModal({ onClose }: { onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        fetch("/api/v1/user/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
    }, []);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        window.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    if (!mounted) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-profile-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="edit-profile-title" className="text-[16px] font-bold">Edit Profile</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {user ? (
                    <ModalBody user={user} onClose={close} />
                ) : (
                    <div className="flex h-64 items-center justify-center"><span className="text-sm text-[#7e8a96]">Loading…</span></div>
                )}
            </div>
        </div>,
        document.body,
    );
}

// ── Body + footer (direct-edit form) ───────────────────────────
function ModalBody({ user, onClose }: { user: User; onClose: () => void }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const firstRef = useRef<HTMLInputElement>(null);
    const [imgError, setImgError] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<FormState>({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        confirm_email: "",
        phone: user.phone ?? "",
    });

    useEffect(() => { firstRef.current?.focus(); }, []);

    // Ask for a confirmation only when the login email is actually being changed.
    const emailChanged = form.email.trim().toLowerCase() !== user.email.trim().toLowerCase();

    function set(key: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) { setServerError("Only JPEG, PNG, WebP, or GIF allowed"); return; }
        if (file.size > 5 * 1024 * 1024) { setServerError("File must be under 5MB"); return; }
        setPhotoFile(file);
        setPreview(URL.createObjectURL(file));
        setImgError(false);
        setServerError(null);
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!form.first_name.trim()) e.first_name = "First name is required.";
        if (!form.last_name.trim()) e.last_name = "Last name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!z.email().safeParse(form.email.trim()).success) e.email = "Enter a valid email address.";
        if (emailChanged && form.email.trim() !== form.confirm_email.trim()) e.confirm_email = "Emails do not match.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        setServerError(null);

        let profile_photo_url = user.profile_photo_url;
        if (photoFile) {
            const fd = new globalThis.FormData();
            fd.append("photo", photoFile);
            const uploadRes = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            if (!uploadRes.ok) {
                const j = await uploadRes.json().catch(() => ({}));
                setServerError(typeof j.error === "string" ? j.error : "Photo upload failed");
                setSaving(false);
                return;
            }
            profile_photo_url = (await uploadRes.json()).url;
        }

        const res = await fetch("/api/v1/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
                profile_photo_url,
            }),
        });

        if (res.ok) {
            router.refresh();
            onClose();
            return;
        }

        const j = await res.json().catch(() => ({}));
        const msg = typeof j.error === "string" ? j.error : "Failed to save changes.";
        if (res.status === 409) setErrors({ email: msg });
        else setServerError(msg);
        setSaving(false);
    }

    const photoSrc = preview ?? user.profile_photo_url;
    const displayName = `${form.first_name} ${form.last_name}`.trim();

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="flex flex-1 flex-col overflow-hidden"
        >
            <div className="grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                {/* Profile photo */}
                <div className="flex items-center gap-4 rounded-[14px] border border-[#eef1f4] bg-[#f9fbfd] p-4 sm:col-span-2">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9eb] ring-2 ring-white">
                        {photoSrc && !imgError ? (
                            <Image src={photoSrc} alt={displayName} width={64} height={64} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                        ) : (
                            <span className="text-xl font-bold text-[#7e8a96]">{form.first_name[0]?.toUpperCase() ?? "?"}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#003060]">Profile photo</p>
                        <p className="mt-0.5 text-[12px] text-[#9aa7b8]">JPG, PNG, WebP or GIF · Max 5MB</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 rounded-full bg-gradient-to-b from-[#ea6725] to-[#ff8c53] px-5 py-2 text-[13px] font-semibold text-white shadow-[0px_8px_15px_-8px_#ea6725] transition-[filter] hover:brightness-105"
                    >
                        {photoSrc ? "Change" : "Upload"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
                </div>

                {/* Name */}
                <div>
                    <label className={LABEL}>First Name</label>
                    <input ref={firstRef} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={errors.first_name ? INPUT_ERR : INPUT} placeholder="Jane" />
                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                </div>
                <div>
                    <label className={LABEL}>Last Name</label>
                    <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={errors.last_name ? INPUT_ERR : INPUT} placeholder="Smith" />
                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                    <label className={LABEL}>Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={errors.email ? INPUT_ERR : INPUT} placeholder="jane@example.com" />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Confirm email — only when the address is being changed */}
                {emailChanged && (
                    <div className="sm:col-span-2">
                        <label className={LABEL}>Confirm New Email</label>
                        <input type="email" value={form.confirm_email} onChange={(e) => set("confirm_email", e.target.value)} className={errors.confirm_email ? INPUT_ERR : INPUT} placeholder="Re-enter your new email" />
                        {errors.confirm_email && <p className="mt-1 text-xs text-red-500">{errors.confirm_email}</p>}
                    </div>
                )}

                {/* Phone */}
                <div className="sm:col-span-2">
                    <label className={LABEL}>Phone <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(optional)</span></label>
                    <div className="flex overflow-hidden rounded-[12px] border border-[#d4dee7] bg-white transition-colors focus-within:border-[#0268c0] focus-within:ring-2 focus-within:ring-[#0268c0]/20">
                        <span className="shrink-0 self-stretch border-r border-[#d4dee7] bg-[#f6f8fa] px-4 py-2.5 text-[15px] text-[#7e8a96]">+1</span>
                        <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(214) 987-6543" className="w-full px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none" />
                    </div>
                </div>

                {serverError && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{serverError}</p>}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                <button type="button" onClick={onClose} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">
                    Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
