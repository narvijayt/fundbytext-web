"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────
type EditingField = "name" | "email" | "phone" | null;
type FormState = { first_name: string; last_name: string; email: string; confirm_email: string; phone: string };
type User = { first_name: string; last_name: string; email: string; phone: string | null; profile_photo_url: string | null };

// Exact Figma (vuesax/linear/edit) glyph — inherits the row's text colour.
function EditIcon() {
    return (
        <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.16667 1.66667H7.5C3.33333 1.66667 1.66667 3.33333 1.66667 7.5V12.5C1.66667 16.6667 3.33333 18.3333 7.5 18.3333H12.5C16.6667 18.3333 18.3333 16.6667 18.3333 12.5V10.8333" />
            <path d="M13.3667 2.51667L6.8 9.08333C6.55 9.33333 6.3 9.825 6.25 10.1833L5.89167 12.6917C5.75833 13.6 6.4 14.2333 7.30833 14.1083L9.81667 13.75C10.1667 13.7 10.6583 13.45 10.9167 13.2L17.4833 6.63333C18.6167 5.5 19.15 4.18333 17.4833 2.51667C15.8167 0.85 14.5 1.38333 13.3667 2.51667Z" />
            <path d="M12.425 3.45833C12.9833 5.45 14.5417 7.00833 16.5417 7.575" />
        </svg>
    );
}

const FIELD_BOX = "flex min-h-[52px] items-center rounded-[12px] border border-[#d4dee7] bg-white px-4";
const INPUT = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-3 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const LABEL = "mb-3 block text-[12px] font-black uppercase leading-none tracking-[1px] text-[#003060]";

// ── Modal shell — portal overlay over the (still-mounted) page ──
export default function EditProfileModal({ onClose }: { onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        fetch("/api/v1/user/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
    }, []);
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f1d43]/45 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_32px_0px_rgba(15,29,67,0.24)]"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#e8eaee] bg-[#0278de] px-6 py-4">
                    <h2 className="text-[18px] font-bold leading-[1.15] text-white">Edit Profile</h2>
                    <button onClick={onClose} aria-label="Close" className="text-white/90 transition-colors hover:text-white">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {user ? (
                    <ModalBody user={user} onClose={onClose} />
                ) : (
                    <div className="flex h-64 items-center justify-center"><span className="text-sm text-[#7e8a96]">Loading…</span></div>
                )}
            </div>
        </div>,
        document.body,
    );
}

// ── Body + footer (edit-in-place form) ─────────────────────────
function ModalBody({ user, onClose }: { user: User; onClose: () => void }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState<EditingField>(null);
    const [imgError, setImgError] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<User>(user);

    const [form, setForm] = useState<FormState>({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        confirm_email: "",
        phone: user.phone ?? "",
    });

    function set(key: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
        setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
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
        const errors: Record<string, string> = {};
        if (!form.first_name.trim()) errors.first_name = "Required";
        if (!form.last_name.trim()) errors.last_name = "Required";
        if (editing === "email") {
            if (!form.email) errors.email = "Required";
            else if (!z.email().safeParse(form.email).success) errors.email = "Invalid email";
            if (form.email !== form.confirm_email) errors.confirm_email = "Emails do not match";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        setServerError(null);

        let profile_photo_url = saved.profile_photo_url;
        if (photoFile) {
            const fd = new globalThis.FormData();
            fd.append("photo", photoFile);
            const uploadRes = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            if (!uploadRes.ok) {
                const j = await uploadRes.json().catch(() => ({}));
                setServerError(j.error ?? "Photo upload failed");
                setSaving(false);
                return;
            }
            profile_photo_url = (await uploadRes.json()).url;
        }

        const payload: Record<string, unknown> = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone: form.phone.trim() || null,
            profile_photo_url,
        };
        if (editing === "email") payload.email = form.email;

        const res = await fetch("/api/v1/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setSaving(false);

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setServerError(j.error ?? "Failed to save");
            return;
        }

        const { user: updated } = await res.json();
        setSaved(updated);
        setEditing(null);
        setPhotoFile(null);
        setPreview(null);
        router.refresh();
        onClose();
    }

    const photoSrc = preview ?? saved.profile_photo_url;
    const displayName = `${form.first_name} ${form.last_name}`.trim();

    return (
        <>
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                {/* Change profile picture */}
                <div className="flex items-center gap-5">
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9eb]">
                        {photoSrc && !imgError ? (
                            <Image src={photoSrc} alt={displayName} width={72} height={72} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                        ) : (
                            <span className="text-2xl font-bold text-[#7e8a96]">{form.first_name[0]?.toUpperCase() ?? "?"}</span>
                        )}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <p className="text-[16px] font-medium text-[#003060]">Change Profile Picture</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full bg-gradient-to-b from-[#ea6725] to-[#ff8c53] px-5 py-1.5 text-[12px] font-medium tracking-[0.25px] text-white shadow-[0px_8px_15px_-8px_#ea6725] transition-[filter] hover:brightness-105"
                        >
                            Upload
                        </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
                </div>

                {/* Fields */}
                <div className="mt-7 space-y-6">
                    {/* Full name */}
                    <div>
                        <label className={LABEL}>Full Name</label>
                        {editing === "name" ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="First Name" className={INPUT} />
                                    {fieldErrors.first_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.first_name}</p>}
                                </div>
                                <div>
                                    <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="Last Name" className={INPUT} />
                                    {fieldErrors.last_name && <p className="mt-1 text-xs text-red-500">{fieldErrors.last_name}</p>}
                                </div>
                            </div>
                        ) : (
                            <FieldDisplay value={displayName} onEdit={() => setEditing("name")} />
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className={LABEL}>Email Address</label>
                        {editing === "email" ? (
                            <div className="space-y-5">
                                <div>
                                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Enter a valid email address" className={INPUT} />
                                    {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                                </div>
                                <div>
                                    <label className={LABEL}>Confirm Email Address</label>
                                    <input type="email" value={form.confirm_email} onChange={(e) => set("confirm_email", e.target.value)} placeholder="Confirm valid email address" className={INPUT} />
                                    {fieldErrors.confirm_email && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirm_email}</p>}
                                </div>
                            </div>
                        ) : (
                            <FieldDisplay value={form.email} onEdit={() => { set("confirm_email", ""); setEditing("email"); }} />
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={LABEL}>Phone</label>
                        {editing === "phone" ? (
                            <div className="flex min-h-[52px] items-center overflow-hidden rounded-[12px] border border-[#d4dee7] focus-within:border-[#0268c0] focus-within:ring-2 focus-within:ring-[#0268c0]/20">
                                <span className="shrink-0 self-stretch border-r border-[#d4dee7] bg-[#f6f8fa] px-4 py-3 text-[15px] text-[#7e8a96]">+1</span>
                                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(214) 987-6543" className="w-full px-4 py-3 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none" />
                            </div>
                        ) : (
                            <FieldDisplay value={form.phone ? `+1 ${form.phone}` : "—"} onEdit={() => setEditing("phone")} />
                        )}
                    </div>

                    {serverError && <p className="text-sm text-red-500">{serverError}</p>}
                </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e8eaee] bg-white px-6 py-4">
                <button onClick={onClose} className="rounded-[10px] border border-[#dde0e3] px-4 pt-2.5 pb-3 text-[14px] font-medium leading-none text-[#003060] transition-colors hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="rounded-[10px] bg-[#0268c0] px-5 pt-2.5 pb-3 text-[14px] font-medium leading-none text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </>
    );
}

// ── Display row (value + Edit link) ────────────────────────────
function FieldDisplay({ value, onEdit }: { value: string; onEdit: () => void }) {
    return (
        <div className={`${FIELD_BOX} justify-between`}>
            <span className="truncate text-[15px] font-medium text-[#7e8a96]">{value}</span>
            <button onClick={onEdit} className="ml-3 flex shrink-0 items-center gap-2 text-[#4b5563] transition-colors hover:text-[#0268c0]">
                <EditIcon />
                <span className="text-[14px] font-medium">Edit</span>
            </button>
        </div>
    );
}
