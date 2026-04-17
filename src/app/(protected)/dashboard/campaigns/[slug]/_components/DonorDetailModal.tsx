"use client";

import { useEffect, useState } from "react";

type Donor = {
    id:                string;
    first_name:        string;
    last_name:         string;
    email:             string | null;
    phone:             string | null;
    status:            string;
    email_valid:       boolean;
    short_code:        string | null;
    assigned_member:   { id: string; first_name: string; last_name: string } | null;
    added_by_member:   { id: string; first_name: string; last_name: string; roles: { role: string }[] } | null;
    donations:         { amount: { toString(): string }; created_at: string }[];
};

type Props = {
    donorId:         string;
    campaignSlug:    string;
    isOrganizer:     boolean;
    currentMemberId: string;
    participants:    { id: string; first_name: string; last_name: string }[];
    isCompleted?:    boolean;
    onClose:         () => void;
    onRefresh?:      () => void;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const STATUS_BADGE: Record<string, string> = {
    donated:     "bg-green-100 text-green-700",
    contacted:   "bg-blue-100 text-blue-700",
    not_donated: "bg-gray-100 text-gray-500",
};

export default function DonorDetailModal({ donorId, campaignSlug, isOrganizer, currentMemberId, participants, isCompleted, onClose, onRefresh }: Props) {
    const [donor,       setDonor]       = useState<Donor | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [editing,     setEditing]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [assigning,     setAssigning]     = useState(false);
    const [assignSuccess, setAssignSuccess] = useState(false);
    const [assignError,   setAssignError]   = useState<string | null>(null);
    const [deleting,      setDeleting]      = useState(false);
    const [confirmDel,    setConfirmDel]    = useState(false);
    const [error,         setError]         = useState<string | null>(null);
    const [copied,        setCopied]        = useState(false);

    // Name edit fields
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");

    // Assignment
    const [assignTo, setAssignTo] = useState<string>("");

    useEffect(() => {
        fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
                setDonor(d.donor);
                setFirstName(d.donor.first_name);
                setLastName(d.donor.last_name);
                setAssignTo(d.donor.assigned_member?.id ?? "");
            })
            .catch(() => setError("Failed to load donor."))
            .finally(() => setLoading(false));
    }, [donorId, campaignSlug]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: firstName,
                last_name:  lastName,
                email:      donor?.email ?? null,
                phone:      donor?.phone ?? null,
            }),
        });
        if (res.ok) {
            onRefresh?.();
            setDonor((d) => d ? { ...d, first_name: firstName, last_name: lastName } : d);
            setEditing(false);
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Save failed.");
        }
        setSaving(false);
    }

    async function handleDelete() {
        setDeleting(true);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, { method: "DELETE" });
        if (res.ok || res.status === 204) { onRefresh?.(); onClose(); }
        else { const j = await res.json().catch(() => ({})); setError(j.error ?? "Delete failed."); }
        setDeleting(false);
    }

    async function handleAssign() {
        setAssigning(true);
        setAssignError(null);
        setAssignSuccess(false);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/donors/${donorId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigned_member_id: assignTo || null }),
        });
        if (res.ok) {
            onRefresh?.();
            const p = participants.find((p) => p.id === assignTo);
            setDonor((d) => d ? {
                ...d,
                assigned_member: p ? { id: p.id, first_name: p.first_name, last_name: p.last_name } : null,
            } : d);
            setAssignSuccess(true);
            setTimeout(() => setAssignSuccess(false), 3000);
        } else {
            const j = await res.json().catch(() => ({}));
            setAssignError(j.error ?? "Assignment failed.");
        }
        setAssigning(false);
    }

    const hasDonated = (donor?.donations?.length ?? 0) > 0;
    const INPUT = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100vh-4rem)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900">Donor Details</h2>
                    <div className="flex items-center gap-1">
                        {donor?.short_code && (donor.email || donor.phone) && (
                            <button
                                title={copied ? "Copied!" : "Copy donor link"}
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/d/${donor.short_code}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                            >
                                {copied ? (
                                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                    </svg>
                                )}
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading && <p className="text-center text-sm text-gray-400 py-8">Loading…</p>}
                    {error   && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

                    {donor && !loading && (
                        <div className="space-y-4">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                    {donor.first_name[0]}{donor.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{donor.first_name} {donor.last_name}</p>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[donor.status] ?? "bg-gray-100 text-gray-500"}`}>
                                        {donor.status === "not_donated" ? "Not Donated" : donor.status.charAt(0).toUpperCase() + donor.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {editing ? (
                                /* Edit — name only */
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">First Name</label>
                                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT} />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
                                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
                                            {saving ? "Saving…" : "Save"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-400">Email</span>
                                        <span className="font-medium">{donor.email ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-400">Phone</span>
                                        <span className="font-medium">{donor.phone ?? "—"}</span>
                                    </div>
                                    {donor.added_by_member && (() => {
                                        const addedByMe       = donor.added_by_member.id === currentMemberId;
                                        const adderIsOrg      = donor.added_by_member.roles.some(r => r.role === "organizer");
                                        const adderIsParticip = donor.added_by_member.roles.some(r => r.role === "participant");
                                        const addedByPureOrg  = adderIsOrg && !adderIsParticip;
                                        if (isOrganizer && addedByMe)
                                            return (
                                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                                    <span className="text-gray-400">Added by</span>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Me</span>
                                                </div>
                                            );
                                        if (!isOrganizer && addedByPureOrg)
                                            return (
                                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                                    <span className="text-gray-400">Added by</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {donor.added_by_member.first_name} {donor.added_by_member.last_name}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Organizer</span>
                                                    </div>
                                                </div>
                                            );
                                        return null;
                                    })()}
                                    {isOrganizer && !hasDonated && !isCompleted && participants.length > 0 ? (
                                        <div className="py-2 border-b border-gray-50">
                                            <p className="text-xs font-semibold text-gray-400 mb-1.5">Assign to Participant</p>
                                            <div className="flex gap-2">
                                                <select
                                                    value={assignTo}
                                                    onChange={(e) => { setAssignTo(e.target.value); setAssignSuccess(false); setAssignError(null); }}
                                                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                                                        assignSuccess ? "border-green-300 focus:ring-green-300" :
                                                        assignError   ? "border-red-300 focus:ring-red-300"    :
                                                                        "border-gray-200 focus:ring-orange-400"
                                                    }`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {participants.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.first_name} {p.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={handleAssign}
                                                    disabled={assigning || assignSuccess}
                                                    className={`px-3 py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-60 shrink-0 transition-colors ${
                                                        assignSuccess ? "bg-green-500" : "bg-orange-500 hover:bg-orange-600"
                                                    }`}
                                                >
                                                    {assigning ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                                                            </svg>
                                                            Saving…
                                                        </span>
                                                    ) : assignSuccess ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                            </svg>
                                                            Saved
                                                        </span>
                                                    ) : "Assign"}
                                                </button>
                                            </div>
                                            {assignSuccess && (
                                                <p className="mt-1.5 text-xs font-semibold text-green-600 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    {assignTo ? `Assigned to ${participants.find(p => p.id === assignTo)?.first_name ?? "participant"}` : "Removed from participant"}
                                                </p>
                                            )}
                                            {assignError && (
                                                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </svg>
                                                    {assignError}
                                                </p>
                                            )}
                                        </div>
                                    ) : donor.assigned_member ? (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-400">Assigned to</span>
                                            <span className="font-medium">{donor.assigned_member.first_name} {donor.assigned_member.last_name}</span>
                                        </div>
                                    ) : null}
                                    {donor.donations.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Donations</p>
                                            {donor.donations.map((d, i) => {
                                                const dt = new Date(d.created_at);
                                                return (
                                                    <div key={i} className="flex items-center justify-between py-1.5">
                                                        <div>
                                                            <p className="text-sm text-gray-500">{dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                                            <p className="text-xs text-gray-400">{dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                                                        </div>
                                                        <span className="font-bold text-green-600">{fmt(parseFloat(d.amount.toString()))}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {confirmDel ? (
                                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                                            <p className="text-sm font-semibold text-red-700">Remove this donor?</p>
                                            <p className="text-xs text-red-500">This cannot be undone.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfirmDel(false)}
                                                    className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                                                >
                                                    {deleting ? "Removing…" : "Yes, Remove"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 pt-3">
                                            {!isCompleted && (
                                                <button
                                                    onClick={() => setEditing(true)}
                                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    Edit Name
                                                </button>
                                            )}
                                            {!isCompleted && (
                                                hasDonated ? (
                                                    <button
                                                        disabled
                                                        title="Cannot remove a donor who has donated"
                                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed"
                                                    >
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDel(true)}
                                                        className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
