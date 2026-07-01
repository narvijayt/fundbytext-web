"use client";

import { useEffect, useState } from "react";

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
    user: { profile_photo_url: string | null; username: string | null } | null;
};

type Props = {
    memberId:     string;
    myMemberId?:  string;
    campaignSlug: string;
    raised:       number;
    onClose:      () => void;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function dt(s: string | null) {
    if (!s) return "—";
    const d = new Date(s);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

// Read-only "View Participant" modal. Editing + removing live in their own modals
// (opened from the row's action menu), so this stays purely informational.
export default function ParticipantDetailModal({ memberId, myMemberId, campaignSlug, raised, onClose }: Props) {
    const [member,           setMember]           = useState<MemberDetail | null>(null);
    const [loading,          setLoading]          = useState(true);
    const [error,            setError]            = useState<string | null>(null);
    const [showAllDonations, setShowAllDonations] = useState(false);
    const [shown,            setShown]            = useState(false);

    useEffect(() => {
        fetch(`/api/v1/campaigns/${campaignSlug}/members/${memberId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => setMember(d.member))
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

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    const isSelf = memberId === myMemberId;
    const photo  = member ? (member.user?.profile_photo_url ?? member.profile_photo_url) : null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="participant-detail-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="participant-detail-title" className="text-[16px] font-bold">Participant Details</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                        </div>
                    )}
                    {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>}

                    {member && !loading && (
                        <div className="space-y-5">
                            {/* Identity */}
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#aed9fe] text-[18px] font-bold text-[#0268c0]">
                                    {photo
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={photo} alt="" className="h-full w-full object-cover" />
                                        : `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <p className="text-[17px] font-bold text-[#003060]">{member.first_name} {member.last_name}</p>
                                        {isSelf && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">You</span>}
                                    </div>
                                    {member.user?.username && <p className="text-[13px] font-medium text-[#0268c0]">@{member.user.username}</p>}
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {member.roles.map((r) => (
                                            <span key={r.role} className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-[10px] font-semibold capitalize text-[#5b6b7c]">{r.role}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-[#e7e9eb] bg-[#f7f9fb] p-3.5 text-center">
                                    <p className="text-[20px] font-black text-[#003060]">{fmt(raised)}</p>
                                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Raised</p>
                                </div>
                                <div className="rounded-2xl border border-[#e7e9eb] bg-[#f7f9fb] p-3.5 text-center">
                                    <p className="text-[20px] font-black text-[#003060]">{member._count.donors}</p>
                                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Donors</p>
                                </div>
                            </div>

                            {/* Contact / meta */}
                            <div className="text-[13px]">
                                <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] py-2.5">
                                    <span className="text-[#9aa7b8]">Email</span>
                                    <span className="truncate font-medium text-[#003060]">{member.email ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-b border-[#eef1f4] py-2.5">
                                    <span className="text-[#9aa7b8]">Phone</span>
                                    <span className="font-medium text-[#003060]">{member.phone ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 py-2.5">
                                    <span className="text-[#9aa7b8]">Joined</span>
                                    <span className="font-medium text-[#003060]">{dt(member.joined_at)}</span>
                                </div>
                            </div>

                            {/* Donations received */}
                            {member.donations.length > 0 && (() => {
                                const visible = showAllDonations ? member.donations : member.donations.slice(0, 3);
                                return (
                                    <div>
                                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.5px] text-[#003060]">Donations Received</p>
                                        <div className="space-y-2">
                                            {visible.map((d) => {
                                                const name = d.is_anonymous
                                                    ? `${d.donor_first_name} ${d.donor_last_name}`
                                                    : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`);
                                                return (
                                                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-3 py-2">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="truncate text-[13px] font-semibold text-[#003060]">{name}</p>
                                                                {d.is_anonymous && <span className="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Anonymous</span>}
                                                            </div>
                                                            <p className="text-[11px] text-[#9aa7b8]">{dt(d.created_at)}</p>
                                                        </div>
                                                        <span className="shrink-0 text-[13px] font-bold text-[#28c45d]">{fmt(parseFloat(d.amount))}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {member.donations.length > 3 && (
                                            <button onClick={() => setShowAllDonations((v) => !v)} className="mt-2 text-[12px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80">
                                                {showAllDonations ? "Show less" : `See all ${member.donations.length} donations`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
