"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
    memberId:     string;
    campaignSlug: string;
    onClose:      () => void;
};

const INPUT     = "w-full rounded-[12px] border border-[#d4dee7] bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";
const INPUT_ERR = "w-full rounded-[12px] border border-red-300 bg-white px-4 py-2.5 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25";
const LABEL     = "mb-1.5 block text-[13px] font-semibold text-[#003060]";

export default function EditParticipantModal({ memberId, campaignSlug, onClose }: Props) {
    const router = useRouter();

    const [loading,     setLoading]     = useState(true);
    const [firstName,   setFirstName]   = useState("");
    const [lastName,    setLastName]    = useState("");
    const [phone,       setPhone]       = useState("");
    const [email,       setEmail]       = useState<string | null>(null);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [shown,       setShown]       = useState(false);

    const firstRef = useRef<HTMLInputElement>(null);

    // Load current values (name + phone) — the same GET the detail modal uses.
    useEffect(() => {
        fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
                const m = d.member;
                if (m) { setFirstName(m.first_name ?? ""); setLastName(m.last_name ?? ""); setPhone(m.phone ?? ""); setEmail(m.email ?? null); }
            })
            .catch(() => setError("Failed to load participant."))
            .finally(() => setLoading(false));
    }, [memberId, campaignSlug]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setShown(true));
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

    useEffect(() => { if (!loading) firstRef.current?.focus(); }, [loading]);

    function close() {
        setShown(false);
        window.setTimeout(onClose, 170);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.firstName = "First name is required.";
        if (!lastName.trim())  errs.lastName  = "Last name is required.";
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setSaving(true);
        setError(null);

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            // Name-only: the campaign display name. Email, phone, and photo can't be
            // changed after adding, and this never touches the participant's account name.
            body: JSON.stringify({
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
            }),
        });

        if (res.ok) {
            router.refresh();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to save changes.");
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
                aria-labelledby="edit-participant-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </span>
                        <div className="min-w-0">
                            <h2 id="edit-participant-title" className="text-[16px] font-bold leading-tight">Edit Participant</h2>
                            <p className="text-[12px] text-white/75">Update this participant&apos;s details</p>
                        </div>
                    </div>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-scroll flex-1 space-y-4 overflow-y-auto p-5">
                        <div className="flex gap-2.5 rounded-xl border border-[#cfe0f3] bg-[#eef5fc] px-3.5 py-3 text-[12px] leading-snug text-[#0268c0]">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0268c0]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>Only the name shown for this campaign can be changed here. It won&apos;t change the participant&apos;s account name, and their email, phone, and photo can&apos;t be edited.</span>
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

                        {/* Phone + email are shown for reference but cannot be changed */}
                        <div>
                            <label className={LABEL}>Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                disabled
                                placeholder="—"
                                className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]"
                            />
                            <p className="mt-1 text-xs text-[#9aa7b8]">Phone can&apos;t be changed.</p>
                        </div>

                        <div>
                            <label className={LABEL}>Email</label>
                            <input
                                type="email"
                                value={email ?? ""}
                                disabled
                                placeholder="—"
                                className="w-full cursor-not-allowed rounded-[12px] border border-[#e7e9eb] bg-[#f4f6f9] px-4 py-2.5 text-[15px] text-[#7e8a96]"
                            />
                            <p className="mt-1 text-xs text-[#9aa7b8]">Email can&apos;t be changed.</p>
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={close} className="flex-1 rounded-[10px] border border-[#d4dee7] py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="flex-1 rounded-[10px] bg-[#0268c0] py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
