"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DonationRow = {
    id:                 string;
    amount:             string;
    donor_display_name: string | null;
    donor_first_name:   string;
    donor_last_name:    string;
    is_anonymous:       boolean;
    created_at:         string;
};

type MemberDetail = {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    profile_photo_url: string | null;
    target_donors: number;
    joined_at: string | null;
    roles: { role: string }[];
    donations: DonationRow[];
    _count: { donors: number };
};

type Props = {
    memberId:     string;
    myMemberId?:  string;
    campaignSlug: string;
    isOrganizer:  boolean;
    raised:       number;
    isCompleted?: boolean;
    onClose:      () => void;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ParticipantDetailModal({ memberId, myMemberId, campaignSlug, isOrganizer, raised, isCompleted, onClose }: Props) {
    const router = useRouter();
    const [member,           setMember]           = useState<MemberDetail | null>(null);
    const [loading,          setLoading]          = useState(true);
    const [removing,         setRemoving]         = useState(false);
    const [confirmRemove,    setConfirmRemove]    = useState(false);
    const [error,            setError]            = useState<string | null>(null);
    const [toast,            setToast]            = useState<string | null>(null);
    const [showAllDonations, setShowAllDonations] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function showToast(msg: string) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(msg);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    }

    useEffect(() => {
        fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
                setMember(d.member);
            })
            .catch(() => setError("Failed to load participant."))
            .finally(() => setLoading(false));
    }, [memberId, campaignSlug]);

    const isSelf = memberId === myMemberId;

    async function handleRemove() {
        setRemoving(true);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, { method: "DELETE" });
        if (res.ok || res.status === 204) { router.refresh(); onClose(); }
        else { const j = await res.json().catch(() => ({})); setError(j.error ?? "Remove failed."); }
        setRemoving(false);
        setConfirmRemove(false);
    }

    const isTargetParticipant = member?.roles.some((r) => r.role === "participant");
    const hasDonations = raised > 0;
    // Allow remove when: organizer viewing another participant (not also an organizer),
    // OR organizer viewing themselves as participant (to drop their own participant role).
    const canRemove = isOrganizer && isTargetParticipant;

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "calc(100vh - 4rem)" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="font-bold text-gray-900">Participant Details</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading && <p className="text-center text-sm text-gray-400 py-8">Loading…</p>}
                    {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

                    {member && !loading && (
                        <div className="space-y-4">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0 overflow-hidden">
                                    {member.profile_photo_url
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={member.profile_photo_url} alt={member.first_name} className="w-full h-full object-cover" />
                                        : `${member.first_name[0]}${member.last_name[0]}`
                                    }
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{member.first_name} {member.last_name}</p>
                                    <p className="text-xs text-gray-400">{member.email ?? "—"}</p>
                                    <div className="flex gap-1 mt-1">
                                        {member.roles.map((r) => (
                                            <span key={r.role} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 capitalize">{r.role}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-lg font-bold text-gray-900">{fmt(raised)}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Raised</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-lg font-bold text-gray-900">{member._count.donors}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Donors</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400">Phone</span>
                                    <span className="font-medium">{member.phone ?? "—"}</span>
                                </div>
                                {member.joined_at && (
                                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-400">Joined</span>
                                        <span className="font-medium">
                                            {new Date(member.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            {" · "}
                                            {new Date(member.joined_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Donations received */}
                            {member.donations.length > 0 && (() => {
                                const visible = showAllDonations ? member.donations : member.donations.slice(0, 2);
                                return (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Donations Received</p>
                                        <div className="space-y-2">
                                            {visible.map((d) => {
                                                const name = d.is_anonymous
                                                    ? `${d.donor_first_name} ${d.donor_last_name}`
                                                    : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`);
                                                return (
                                                    <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-semibold text-gray-800">{name}</p>
                                                                {d.is_anonymous && (
                                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 whitespace-nowrap">
                                                                        Anonymous
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                {" · "}
                                                                {new Date(d.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {fmt(parseFloat(d.amount))}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {member.donations.length > 2 && (
                                            <button
                                                onClick={() => setShowAllDonations((v) => !v)}
                                                className="mt-2 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                            >
                                                {showAllDonations
                                                    ? "Show less"
                                                    : `See all ${member.donations.length} donations`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {isOrganizer && canRemove && !isCompleted && (
                                <div className="pt-1">
                                    {confirmRemove ? (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                                            <p className="text-sm font-semibold text-red-700">
                                                {isSelf ? "Leave participant role?" : "Remove this participant?"}
                                            </p>
                                            <p className="text-xs text-red-500">
                                                {isSelf
                                                    ? "Your organizer role will be kept. This cannot be undone."
                                                    : "This participant will be removed from the campaign. This cannot be undone."}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfirmRemove(false)}
                                                    className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleRemove}
                                                    disabled={removing}
                                                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                                                >
                                                    {removing ? "Removing…" : "Yes, Remove"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (hasDonations) {
                                                    showToast(`Cannot remove — this participant has raised ${fmt(raised)} in donations.`);
                                                } else {
                                                    setConfirmRemove(true);
                                                }
                                            }}
                                            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                                        >
                                            {isSelf ? "Leave Participant" : "Remove"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Toast — bottom right */}
        {toast && (
            <div className="fixed bottom-6 right-6 z-200 flex items-start gap-3 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-xl shadow-lg max-w-xs">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <span className="flex-1">{toast}</span>
                <button onClick={() => setToast(null)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        )}
        </>
    );
}
