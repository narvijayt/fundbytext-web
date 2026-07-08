"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────
type FormState = { first_name: string; last_name: string; email: string; confirm_email: string; phone: string };
type User = { first_name: string; last_name: string; email: string; phone: string | null; profile_photo_url: string | null; is_email_verified: boolean };
type EditKey = "name" | "email" | "phone";

// Compact field tokens — scaled to the app's other modals (View Participant etc.).
const LABEL      = "text-[11px] font-bold uppercase tracking-[0.5px] text-[#003060]";
const FIELD_BASE = "h-11 w-full rounded-[10px] border bg-white px-4 text-[14px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:outline-none";
const INPUT      = `${FIELD_BASE} border-[#d4dee7] focus:border-[#0268c0] focus:ring-2 focus:ring-[#0268c0]/15`;
const INPUT_ERR  = `${FIELD_BASE} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20`;

// Vuesax "linear/edit" — the exact Figma edit icon.
function EditIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.16667 1.66667H7.5C3.33333 1.66667 1.66667 3.33333 1.66667 7.5V12.5C1.66667 16.6667 3.33333 18.3333 7.5 18.3333H12.5C16.6667 18.3333 18.3333 16.6667 18.3333 12.5V10.8333" />
            <path d="M13.3667 2.51667L6.8 9.08333C6.55 9.33333 6.3 9.825 6.25 10.1833L5.89167 12.6917C5.75833 13.6 6.4 14.2333 7.30833 14.1083L9.81667 13.75C10.1667 13.7 10.6583 13.45 10.9167 13.2L17.4833 6.63333C18.6167 5.5 19.15 4.18333 17.4833 2.51667C15.8167 0.85 14.5 1.38333 13.3667 2.51667Z" />
            <path d="M12.425 3.45833C12.9833 5.45 14.5417 7.00833 16.5417 7.575" />
        </svg>
    );
}

// A read-only field row that reveals its editor when the "Edit" button is pressed.
// `accessory` renders on the right of the label (e.g. the email verify status).
function ReadOnlyRow({ label, value, empty, onEdit, accessory }: { label: string; value: string; empty?: boolean; onEdit: () => void; accessory?: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex min-h-[18px] items-center justify-between gap-2">
                <span className={LABEL}>{label}</span>
                {accessory}
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="group flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-[#d4dee7] bg-white px-4 text-left transition-colors hover:border-[#0268c0]"
            >
                <span className={`truncate text-[14px] ${empty ? "text-[#aeb5bd]" : "text-[#7e8a96]"}`}>{value}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-[#4b5563] transition-colors group-hover:text-[#0268c0]">
                    <EditIcon />
                    Edit
                </span>
            </button>
        </div>
    );
}

// Email verification status shown beside the Email label. Verified → a green pill;
// unverified → a "Verify email" button that sends the verification link.
function EmailVerifyStatus({ verified }: { verified: boolean }) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [msg, setMsg] = useState("");

    if (verified) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eafaf1] px-2 py-0.5 text-[11px] font-bold text-[#1a9f4b]">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                Verified
            </span>
        );
    }

    async function send() {
        setStatus("sending");
        setMsg("");
        try {
            const r = await fetch("/api/v1/user/verify-email", { method: "POST" });
            const d = await r.json().catch(() => ({}));
            if (r.ok) setStatus("sent");
            else { setStatus("error"); setMsg(typeof d.error === "string" ? d.error : "Couldn't send"); }
        } catch { setStatus("error"); setMsg("Couldn't send"); }
    }

    if (status === "sent") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#28c45d]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                Sent — check your inbox
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={send}
            disabled={status === "sending"}
            title={status === "error" ? msg : "Send a verification link to your email"}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/75 disabled:opacity-60"
        >
            <span className={`h-1.5 w-1.5 rounded-full ${status === "error" ? "bg-red-500" : "bg-[#f47435]"}`} />
            {status === "sending" ? "Sending…" : status === "error" ? "Retry verify" : "Verify email"}
        </button>
    );
}

// ── Modal shell — portal overlay over the (still-mounted) page ──
export default function EditProfileModal({ onClose }: { onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    // Only treat it as an outside-click when the press *started* on the backdrop,
    // so selecting text inside an input and releasing on the backdrop won't close.
    const downOnBackdrop = useRef(false);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        fetch("/api/v1/user/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
    }, []);
    // Once mounted (portal painted at opacity-0/scale-95), flip on the next frame
    // so the enter transition plays. Gating render on `mounted` keeps the server
    // and first client render identical (null) — no hydration mismatch.
    useEffect(() => {
        if (!mounted) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        window.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    function close() { setShown(false); window.setTimeout(onClose, 170); }

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
                aria-labelledby="edit-profile-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="edit-profile-title" className="text-[16px] font-bold leading-tight">Edit Profile</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
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

// ── Body + footer (edit-in-place form) ─────────────────────────
function ModalBody({ user, onClose }: { user: User; onClose: () => void }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const firstRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const [imgError, setImgError] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Record<EditKey, boolean>>({ name: false, email: false, phone: false });

    const [form, setForm] = useState<FormState>({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        confirm_email: "",
        phone: user.phone ?? "",
    });

    // Ask for a confirmation only when the login email is actually being changed.
    const emailChanged = form.email.trim().toLowerCase() !== user.email.trim().toLowerCase();

    function set(key: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    }

    // Reveal a field's editor with the current value pre-filled, then focus its
    // first input on the next frame (select-all so the value is easy to replace).
    function startEdit(key: EditKey) {
        setEditing((s) => ({ ...s, [key]: true }));
        requestAnimationFrame(() => {
            const el = ({ name: firstRef, email: emailRef, phone: phoneRef })[key].current;
            el?.focus();
            el?.select();
        });
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
        // Auto-open any field that has an error so the user can see/fix it.
        if (e.first_name || e.last_name) setEditing((s) => ({ ...s, name: true }));
        if (e.email || e.confirm_email) setEditing((s) => ({ ...s, email: true }));
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
        if (res.status === 409) { setErrors({ email: msg }); setEditing((s) => ({ ...s, email: true })); }
        else setServerError(msg);
        setSaving(false);
    }

    const photoSrc = preview ?? user.profile_photo_url;
    const displayName = `${form.first_name} ${form.last_name}`.trim();
    const initial = user.first_name[0]?.toUpperCase() ?? "?";

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-1 flex-col overflow-hidden">
            <div className="modal-scroll flex flex-1 flex-col gap-5 overflow-y-auto p-5">
                {/* Change Profile Picture */}
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9eb]">
                        {photoSrc && !imgError ? (
                            <Image src={photoSrc} alt={displayName} width={64} height={64} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                        ) : (
                            <span className="text-xl font-bold text-[#7e8a96]">{initial}</span>
                        )}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <p className="text-[14px] font-semibold leading-tight text-[#003060]">Change Profile Picture</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#ea6725] to-[#ff8c53] px-4 py-1.5 text-[12px] font-semibold tracking-[0.25px] text-white shadow-[0px_8px_15px_-8px_#ea6725,0px_12px_40px_-12px_rgba(255,140,83,0.4)] transition-[filter] hover:brightness-105"
                        >
                            {photoSrc ? "Change" : "Upload"}
                        </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
                </div>

                {/* Profile details */}
                <div className="flex flex-col gap-5">
                    {/* Full Name */}
                    {editing.name ? (
                        <div className="flex flex-col gap-1.5">
                            <span className={LABEL}>Full Name</span>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <input ref={firstRef} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={errors.first_name ? INPUT_ERR : INPUT} placeholder="First Name" />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={errors.last_name ? INPUT_ERR : INPUT} placeholder="Last Name" />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ReadOnlyRow label="Full Name" value={displayName || "Not added"} empty={!displayName} onEdit={() => startEdit("name")} />
                    )}

                    {/* Email address */}
                    {editing.email ? (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <span className={LABEL}>Email Address</span>
                                <input ref={emailRef} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={errors.email ? INPUT_ERR : INPUT} placeholder="Enter a valid email address" />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className={LABEL}>Confirm Email Address</span>
                                <input type="email" value={form.confirm_email} onChange={(e) => set("confirm_email", e.target.value)} className={errors.confirm_email ? INPUT_ERR : INPUT} placeholder="Confirm a valid email address" />
                                {errors.confirm_email && <p className="mt-1 text-xs text-red-500">{errors.confirm_email}</p>}
                            </div>
                        </>
                    ) : (
                        <ReadOnlyRow label="Email Address" value={form.email} onEdit={() => startEdit("email")} accessory={<EmailVerifyStatus verified={user.is_email_verified} />} />
                    )}

                    {/* Phone */}
                    {editing.phone ? (
                        <div className="flex flex-col gap-1.5">
                            <span className={LABEL}>Phone <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(optional)</span></span>
                            <div className="flex h-11 items-center rounded-[10px] border border-[#d4dee7] bg-white transition-colors focus-within:border-[#0268c0] focus-within:ring-2 focus-within:ring-[#0268c0]/15">
                                <span className="pl-4 pr-2.5 text-[14px] text-[#7e8a96]">+1</span>
                                <span className="h-5 w-px bg-[#d4dee7]" />
                                <input ref={phoneRef} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(214) 987-6543" className="h-full w-full rounded-r-[10px] bg-transparent px-3 text-[14px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none" />
                            </div>
                        </div>
                    ) : (
                        <ReadOnlyRow label="Phone" value={form.phone ? `+1 ${form.phone}` : "Not added"} empty={!form.phone} onEdit={() => startEdit("phone")} />
                    )}

                    {serverError && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{serverError}</p>}
                </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
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
