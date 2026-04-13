"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    campaignSlug: string;
    onClose:      () => void;
};

export default function AddParticipantModal({ campaignSlug, onClose }: Props) {
    const router = useRouter();

    const [firstName,      setFirstName]      = useState("");
    const [lastName,       setLastName]        = useState("");
    const [email,          setEmail]           = useState("");
    const [phone,          setPhone]           = useState("");
    const [saving,         setSaving]          = useState(false);
    const [error,          setError]           = useState<string | null>(null);
    const [fieldErrors,    setFieldErrors]     = useState<Record<string, string>>({});

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

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName.trim(),
                last_name:  lastName.trim(),
                email:      email.trim() || null,
                phone:      phone.trim() || null,
            }),
        });

        if (res.ok) {
            router.refresh();
            onClose();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to add participant.");
        }
        setSaving(false);
    }

    const INPUT     = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
    const INPUT_ERR = "w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Add Participant</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Invite info */}
                    <div className="flex gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                        <svg className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        <span>This participant will be invited via email, SMS, or both. If they are new to the platform, they will also receive login credentials.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">First Name</label>
                            <input
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setFieldErrors((f) => ({ ...f, firstName: "" })); }}
                                className={fieldErrors.firstName ? INPUT_ERR : INPUT}
                                placeholder="Jane"
                            />
                            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
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
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }}
                            className={fieldErrors.contact ? INPUT_ERR : INPUT}
                            placeholder="jane@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, contact: "" })); }}
                            className={fieldErrors.contact ? INPUT_ERR : INPUT}
                            placeholder="(555) 000-0000"
                        />
                        {fieldErrors.contact
                            ? <p className="mt-1 text-xs text-red-500">{fieldErrors.contact}</p>
                            : <p className="mt-1 text-xs text-gray-400">At least one of email or phone is required.</p>
                        }
                    </div>

                    {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                            {saving ? "Adding…" : "Add Participant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
