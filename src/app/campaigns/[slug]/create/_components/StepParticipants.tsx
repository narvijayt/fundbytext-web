"use client";

import { type Donor, type Member } from "./types";
import { SectionTitle, inputCls } from "./ui";

type OrganizerInfo = { first_name: string; last_name: string; email: string; phone: string };

type Props = {
    isOrg: boolean;
    isLaunched: boolean;
    organizerInfo?: OrganizerInfo;
    // Org participants
    members: Member[];
    addFirst: string; setAddFirst: (v: string) => void;
    addLast: string;  setAddLast:  (v: string) => void;
    addEmail: string; setAddEmail: (v: string) => void;
    addPhone: string; setAddPhone: (v: string) => void;
    addingMember: boolean;
    onAddParticipant: () => void;
    onRemoveParticipant: (id: string) => void;
    // Individual donors
    donors: Donor[];
    dFirst: string; setDFirst: (v: string) => void;
    dLast: string;  setDLast:  (v: string) => void;
    dEmail: string; setDEmail: (v: string) => void;
    dPhone: string; setDPhone: (v: string) => void;
    addingDonor: boolean;
    onAddDonor: () => void;
    onRemoveDonor: (id: string) => void;
};

export default function StepParticipants({
    isOrg, isLaunched, organizerInfo,
    members,
    addFirst, setAddFirst,
    addLast, setAddLast,
    addEmail, setAddEmail,
    addPhone, setAddPhone,
    addingMember,
    onAddParticipant,
    onRemoveParticipant,
    donors,
    dFirst, setDFirst,
    dLast, setDLast,
    dEmail, setDEmail,
    dPhone, setDPhone,
    addingDonor,
    onAddDonor,
    onRemoveDonor,
}: Props) {
    function fillMyselfParticipant() {
        if (!organizerInfo) return;
        setAddFirst(organizerInfo.first_name);
        setAddLast(organizerInfo.last_name);
        setAddEmail(organizerInfo.email);
        setAddPhone(organizerInfo.phone);
    }

    const myselfAlreadyDonor = !!organizerInfo &&
        donors.some((d) => d.email?.toLowerCase() === organizerInfo.email?.toLowerCase());

    function fillMyselfDonor() {
        if (!organizerInfo) return;
        setDFirst(organizerInfo.first_name);
        setDLast(organizerInfo.last_name);
        setDEmail(organizerInfo.email);
        setDPhone(organizerInfo.phone);
    }

    if (!isOrg) {
        return (
            <div className="space-y-6">
                <div>
                    <SectionTitle>Donors</SectionTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Add the people you plan to contact for donations. They will receive your campaign outreach.
                    </p>
                </div>

                {isLaunched && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        <svg className="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Donor list is locked once the campaign is launched.
                    </div>
                )}

                {donors.length > 0 && (
                    <div className="space-y-2">
                        {donors.map((d) => (
                            <div
                                key={d.id}
                                className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {d.first_name} {d.last_name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {[d.email, d.phone].filter(Boolean).join(" · ") || "No contact info"}
                                    </p>
                                </div>
                                {!isLaunched && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveDonor(d.id)}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!isLaunched && (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Donor</p>
                            {organizerInfo && !myselfAlreadyDonor && (
                                <button
                                    type="button"
                                    onClick={fillMyselfDonor}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Add Myself
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={dFirst} onChange={(e) => setDFirst(e.target.value)} placeholder="First name" className={inputCls} />
                            <input value={dLast}  onChange={(e) => setDLast(e.target.value)}  placeholder="Last name"  className={inputCls} />
                        </div>
                        <input type="email" value={dEmail} onChange={(e) => setDEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                        <input type="tel"   value={dPhone} onChange={(e) => setDPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
                        <button
                            type="button"
                            onClick={onAddDonor}
                            disabled={addingDonor}
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {addingDonor ? "Adding…" : "+ Add Donor"}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Organization view
    const participants = members.filter((m) => m.roles.some((r) => r.role === "participant"));
    const isOrganizerOnly = (m: Member) =>
        m.roles.some((r) => r.role === "organizer") && !m.roles.some((r) => r.role === "participant");

    return (
        <div className="space-y-6">
            <div>
                <SectionTitle>Participants</SectionTitle>
                <p className="text-sm text-gray-500 mt-1">
                    Add people who will fundraise as part of this campaign. Each participant receives an invite link.
                </p>
            </div>

            {isLaunched && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <svg className="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Participant list is locked once the campaign is launched.
                </div>
            )}

            {participants.length > 0 && (
                <div className="space-y-2">
                    {participants.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    {m.first_name} {m.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{m.email ?? m.phone ?? "No contact info"}</p>
                            </div>
                            {/* Allow removal for everyone with participant role, including the organizer themselves */}
                            {!isLaunched && !isOrganizerOnly(m) && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveParticipant(m.id)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isLaunched && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Participant</p>
                        {organizerInfo && (
                            <button
                                type="button"
                                onClick={fillMyselfParticipant}
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Add Myself
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input value={addFirst} onChange={(e) => setAddFirst(e.target.value)} placeholder="First name" className={inputCls} />
                        <input value={addLast}  onChange={(e) => setAddLast(e.target.value)}  placeholder="Last name"  className={inputCls} />
                    </div>
                    <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                    <input type="tel"   value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
                    <button
                        type="button"
                        onClick={onAddParticipant}
                        disabled={addingMember}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {addingMember ? "Adding…" : "+ Add Participant"}
                    </button>
                </div>
            )}
        </div>
    );
}
