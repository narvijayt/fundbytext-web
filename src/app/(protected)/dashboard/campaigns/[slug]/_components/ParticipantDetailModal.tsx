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
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        <div className="min-w-0">
                            <h2 id="participant-detail-title" className="text-[16px] font-bold leading-tight">View Participant</h2>
                            <p className="text-[12px] text-white/75">Read-only participant overview</p>
                        </div>
                    </div>
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
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#aed9fe] text-[20px] font-bold text-[#0268c0] ring-4 ring-[#eef5fc]">
                                    {photo
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={photo} alt="" className="h-full w-full object-cover" />
                                        : `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[18px] font-bold leading-tight text-[#003060]">{member.first_name} {member.last_name}</p>
                                        {isSelf && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">You</span>}
                                    </div>
                                    {member.user?.username && <p className="mt-0.5 text-[13px] font-medium text-[#0268c0]">@{member.user.username}</p>}
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {member.roles.map((r) => (
                                            <span key={r.role} className="rounded-md bg-[#eef2f7] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#5b6b7c]">{r.role}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats — one card split into two */}
                            <div className="grid grid-cols-2 divide-x divide-[#eef1f4] overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white">
                                <div className="px-4 py-4 text-center">
                                    <p className="text-[22px] font-black leading-none text-[#28c45d]">{fmt(raised)}</p>
                                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">Raised</p>
                                </div>
                                <div className="px-4 py-4 text-center">
                                    <p className="text-[22px] font-black leading-none text-[#0268c0]">{member._count.donors}</p>
                                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">Donors</p>
                                </div>
                            </div>

                            {/* Contact / meta — icon-led rows */}
                            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb]">
                                {[
                                    { label: "Email",  value: member.email ?? "—", icon: <><path d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /><path d="M3.5 7.5l8.5 6 8.5-6" /></> },
                                    { label: "Phone",  value: member.phone ?? "—", icon: <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A16.5 16.5 0 015 6.1 1.5 1.5 0 016.5 3.5z" /> },
                                    { label: "Joined", value: dt(member.joined_at), icon: <><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M16 3v3M8 3v3M3.5 9.5h17" /></> },
                                ].map((row, i, arr) => (
                                    <div key={row.label} className={`flex items-center gap-3 px-3.5 py-3 ${i < arr.length - 1 ? "border-b border-[#eef1f4]" : ""}`}>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f6fa] text-[#0268c0]">
                                            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{row.icon}</svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9aa7b8]">{row.label}</p>
                                            <p className="truncate text-[13px] font-semibold text-[#003060]">{row.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Donations received */}
                            {member.donations.length > 0 && (() => {
                                const visible = showAllDonations ? member.donations : member.donations.slice(0, 3);
                                return (
                                    <div>
                                        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#9aa7b8]">Donations Received</p>
                                        <div className="space-y-2">
                                            {visible.map((d) => {
                                                const name = d.is_anonymous
                                                    ? `${d.donor_first_name} ${d.donor_last_name}`
                                                    : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`);
                                                const initials = `${(d.donor_first_name[0] ?? "").toUpperCase()}${(d.donor_last_name[0] ?? "").toUpperCase()}`;
                                                return (
                                                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-[#eef1f4] px-3 py-2.5">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eafaf1] text-[11px] font-bold text-[#28c45d]">{initials || "?"}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="truncate text-[13px] font-semibold text-[#003060]">{name}</p>
                                                                {d.is_anonymous && <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">Anon</span>}
                                                            </div>
                                                            <p className="text-[11px] text-[#9aa7b8]">{dt(d.created_at)}</p>
                                                        </div>
                                                        <span className="shrink-0 text-[14px] font-bold text-[#28c45d]">{fmt(parseFloat(d.amount))}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {member.donations.length > 3 && (
                                            <button onClick={() => setShowAllDonations((v) => !v)} className="mt-2.5 text-[12px] font-semibold text-[#0268c0] transition-colors hover:text-[#0268c0]/80">
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
