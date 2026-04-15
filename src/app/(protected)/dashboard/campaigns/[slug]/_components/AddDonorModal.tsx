"use client";

import { useState } from "react";

type Props = {
    campaignSlug: string;
    participants: { id: string; first_name: string; last_name: string }[];
    isOrganizer: boolean;
    myMemberId?: string; // pre-assign to self when in participant view
    onClose: () => void;
    onSuccess?: () => void;
};

export default function AddDonorModal({ campaignSlug, participants, isOrganizer, myMemberId, onClose, onSuccess }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [assignedMemberId, setAssignedMemberId] = useState<string>(myMemberId ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email && !phone) {
            setError("Please provide an email address or phone number.");
            return;
        }
        setSaving(true);
        setError(null);

        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email || undefined,
                phone: phone || undefined,
                assigned_member_id: assignedMemberId || undefined,
            }),
        });

        if (res.ok) {
            onSuccess?.();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to add donor.");
        }
        setSaving(false);
    }

    const INPUT = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "calc(100vh - 4rem)" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900">Add Donor</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Notification info */}
                    <div className="flex gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                        <svg className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>This donor will receive an invite via email or SMS (or both) to donate to the campaign.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">First Name *</label>
                            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT} placeholder="Jane" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name *</label>
                            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT} placeholder="Smith" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} placeholder="jane@example.com" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="(555) 000-0000" />
                    </div>

                    <p className="text-xs text-gray-400 -mt-1">At least one of email or phone is required.</p>

                    {/* Organizers can assign to any participant */}
                    {isOrganizer && participants.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Assign to Participant</label>
                            <select value={assignedMemberId} onChange={(e) => setAssignedMemberId(e.target.value)} className={INPUT}>
                                <option value="">— Unassigned (General) —</option>
                                {participants.map((p) => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                            {saving ? "Adding…" : "Add Donor"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
