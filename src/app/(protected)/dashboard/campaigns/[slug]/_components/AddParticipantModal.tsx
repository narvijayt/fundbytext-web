"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import UploadBox from "@/app/campaigns/[slug]/create/_components/UploadBox";
import { downscaleImage, DOWNSCALE_PRESETS } from "@/app/campaigns/[slug]/create/_components/downscaleImage";

type Props = {
    campaignSlug: string;
    onClose:      () => void;
};

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[13px] font-semibold text-[#003060]";

export default function AddParticipantModal({ campaignSlug, onClose }: Props) {
    const router = useRouter();

    const [firstName,      setFirstName]      = useState("");
    const [lastName,       setLastName]       = useState("");
    const [email,          setEmail]          = useState("");
    const [phone,          setPhone]          = useState("");
    const [photoUrl,       setPhotoUrl]       = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [fieldErrors,    setFieldErrors]    = useState<Record<string, string>>({});
    const [shown,          setShown]          = useState(false);

    const firstRef = useRef<HTMLInputElement>(null);

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

    // Upload-on-select, matching the campaign wizard's visual uploader: downscale
    // client-side, POST to the shared profile-photo route, surface the busy key so
    // UploadBox shows its Loader spinner, and return the stored URL.
    async function uploadPhoto(file: File, type: string, key?: string): Promise<string | null> {
        if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return null; }
        setError(null);
        setUploadingPhoto(key ?? type);
        try {
            const optimized = await downscaleImage(file, DOWNSCALE_PRESETS.profile);
            const fd = new globalThis.FormData();
            fd.append("photo", optimized);
            const res  = await fetch("/api/v1/upload/profile-photo", { method: "POST", body: fd });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) { setError(json.error ?? "Photo upload failed."); return null; }
            return json.url as string;
        } catch {
            setError("Photo upload failed. Please try again.");
            return null;
        } finally {
            setUploadingPhoto(null);
        }
    }

    function validate() {
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.firstName = "First name is required.";
        if (!lastName.trim())  errs.lastName  = "Last name is required.";
        // Email is required — it creates the participant's account. Phone is optional.
        if (!email.trim())     errs.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
        return errs;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);

        // The photo is already uploaded (on select); just persist its URL on the
        // member — it propagates to the participant's user account server-side.
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
                email:      email.trim(),
                phone:      phone.trim() || null,
                profile_photo_url: photoUrl,
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
                className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
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

                {/* Form — 2-column on desktop so it fits without scrolling; stacks and
                    scrolls on smaller screens. */}
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="modal-scroll grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                        {/* Invite info */}
                        <div className="flex gap-2.5 rounded-xl border border-[#cfe0f3] bg-[#eef5fc] px-3.5 py-3 text-[12px] leading-snug text-[#0268c0] sm:col-span-2">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0268c0]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>This participant will be invited via email, SMS, or both. If they are new to the platform, they will also receive login credentials.</span>
                        </div>

                        {/* Profile photo (optional) — same uploader, loader and behaviour as the
                            campaign creation wizard's visual uploads. */}
                        <div className="sm:col-span-2">
                            <label className={LABEL}>Profile Photo <span className="font-normal text-[#9aa7b8]">(optional)</span></label>
                            <div className="flex items-center gap-4">
                                <UploadBox
                                    url={photoUrl}
                                    type="profile"
                                    onUploaded={setPhotoUrl}
                                    onRemoved={() => setPhotoUrl(null)}
                                    uploadingPhoto={uploadingPhoto}
                                    uploadPhoto={uploadPhoto}
                                    defaultImage={null}
                                    className="h-[104px] w-[104px] shrink-0"
                                />
                                <p className="text-[13px] leading-relaxed text-[#7e8a96]">
                                    Add a photo so supporters recognise this participant.
                                    <br />
                                    <span className="text-[#9aa7b8]">JPG, PNG or WebP · up to 5MB</span>
                                </p>
                            </div>
                        </div>

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

                        <div>
                            <label className={LABEL}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }}
                                className={fieldErrors.email ? INPUT_ERR : INPUT}
                                placeholder="jane@example.com"
                            />
                            {fieldErrors.email
                                ? <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                                : <p className="mt-1 text-xs text-[#9aa7b8]">Used to create their account and send the invite.</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Phone <span className="font-normal text-[#9aa7b8]">(optional)</span></label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={INPUT}
                                placeholder="(555) 000-0000"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 sm:col-span-2">{error}</p>
                        )}
                    </div>

                    {/* Footer — pinned so it stays visible without scrolling */}
                    <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                        <button type="button" onClick={close} disabled={saving} className="rounded-[10px] border border-[#d4dee7] px-5 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving || !!uploadingPhoto} className="rounded-[10px] bg-[#28c45d] px-5 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60">
                            {saving ? "Adding…" : "Add Participant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
