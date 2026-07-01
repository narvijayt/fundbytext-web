"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
    campaignSlug: string;
    onClose:      () => void;
};

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[13px] font-semibold text-[#003060]";

export default function AddParticipantModal({ campaignSlug, onClose }: Props) {
    const router = useRouter();

    const [firstName,   setFirstName]   = useState("");
    const [lastName,    setLastName]    = useState("");
    const [email,       setEmail]       = useState("");
    const [phone,       setPhone]       = useState("");
    const [photoFile,   setPhotoFile]   = useState<File | null>(null);
    const [preview,     setPreview]     = useState<string | null>(null);
    const [uploading,   setUploading]   = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shown,       setShown]       = useState(false);

    const firstRef = useRef<HTMLInputElement>(null);
    const fileRef  = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const raf = requestAnimationFrame(() => { setShown(true); firstRef.current?.focus(); });
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKey);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() {
        setShown(false);
        window.setTimeout(onClose, 170);
    }

    // Revoke the object URL when the preview changes or the modal unmounts.
    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview); };
    }, [preview]);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-selecting the same file after a remove
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) { setError("Only JPEG, PNG, WebP, or GIF images are allowed."); return; }
        if (file.size > 5 * 1024 * 1024)  { setError("Image must be under 5MB."); return; }
        setError(null);
        setPhotoFile(file);
        setPreview(URL.createObjectURL(file));
    }

    function removePhoto() {
        setPhotoFile(null);
        setPreview(null);
    }

    function validate() {
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.firstName = "First name is required.";
        if (!lastName.trim())  errs.lastName  = "Last name is required.";
        if (!email && !phone)  errs.contact   = "Provide an email address or phone number.";
        return errs;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);

        // Upload the chosen photo first (deferred until submit so cancelling the
        // modal never leaves an orphaned blob). Its URL is stored on the member
        // and propagates to the participant's user account server-side.
        let profilePhotoUrl: string | null = null;
        if (photoFile) {
            setUploading(true);
            const fd = new globalThis.FormData();
            fd.append("photo", photoFile);
            const up = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            setUploading(false);
            if (!up.ok) {
                const j = await up.json().catch(() => ({}));
                setError(j.error ?? "Photo upload failed.");
                setSaving(false);
                return;
            }
            profilePhotoUrl = (await up.json()).url;
        }

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
                email:      email.trim() || null,
                phone:      phone.trim() || null,
                profile_photo_url: profilePhotoUrl,
            }),
        });

        if (res.ok) {
            router.refresh();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to add participant.");
            setSaving(false);
        }
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-participant-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
                            </svg>
                        </span>
                        <div className="min-w-0">
                            <h2 id="add-participant-title" className="text-[16px] font-bold leading-tight">Add Participant</h2>
                            <p className="text-[12px] text-white/75">Invite someone to fundraise for this campaign</p>
                        </div>
                    </div>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
                    {/* Invite info */}
                    <div className="flex gap-2.5 rounded-xl border border-[#cfe0f3] bg-[#eef5fc] px-3.5 py-3 text-[12px] leading-snug text-[#0268c0]">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0268c0]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>This participant will be invited via email, SMS, or both. If they are new to the platform, they will also receive login credentials.</span>
                    </div>

                    {/* Profile photo (optional) */}
                    <div>
                        <label className={LABEL}>Profile Photo <span className="font-normal text-[#9aa7b8]">(optional)</span></label>
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#d4dee7] bg-[#f4f8fc]">
                                    {preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={preview} alt="Selected profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <svg className="h-6 w-6 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                                        </svg>
                                    )}
                                </div>
                                {preview && (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        aria-label="Remove photo"
                                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-[filter] hover:brightness-105"
                                    >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                    </button>
                                )}
                            </div>
                            <div className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#0268c0] px-3.5 py-2 text-[13px] font-semibold text-[#0268c0] transition-colors hover:bg-[#eef5fc]"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                    {preview ? "Change Photo" : "Upload Photo"}
                                </button>
                                <p className="mt-1.5 text-xs text-[#9aa7b8]">JPG, PNG, WebP or GIF · up to 5MB</p>
                            </div>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={LABEL}>First Name</label>
                            <input
                                ref={firstRef}
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setFieldErrors((f) => ({ ...f, firstName: "" })); }}
                                className={fieldErrors.firstName ? INPUT_ERR : INPUT}
                                placeholder="Jane"
                            />
                            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Last Name</label>
                            <input
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); setFieldErrors((f) => ({ ...f, lastName: "" })); }}
                                className={fieldErrors.lastName ? INPUT_ERR : INPUT}
                                placeholder="Smith"
                            />
                            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }}
                            className={fieldErrors.contact ? INPUT_ERR : INPUT}
                            placeholder="jane@example.com"
                        />
                    </div>

                    <div>
                        <label className={LABEL}>Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }}
                            className={fieldErrors.contact ? INPUT_ERR : INPUT}
                            placeholder="(555) 000-0000"
                        />
                        {fieldErrors.contact
                            ? <p className="mt-1 text-xs text-red-500">{fieldErrors.contact}</p>
                            : <p className="mt-1 text-xs text-[#9aa7b8]">At least one of email or phone is required.</p>}
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={close} className="flex-1 rounded-[10px] border border-[#d4dee7] py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-[10px] bg-[#28c45d] py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60">
                            {uploading ? "Uploading photo…" : saving ? "Adding…" : "Add Participant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
