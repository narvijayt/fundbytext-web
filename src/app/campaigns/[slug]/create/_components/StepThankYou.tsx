"use client";

import { type Member } from "./types";

type Props = {
    thankYou: string;
    setThankYou: (v: string) => void;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    isOrg: boolean;
    orgDisplayName: string;
    members: Member[];
};

export default function StepThankYou({
    thankYou, setThankYou,
    fieldErrors, clearFE,
    isOrg, orgDisplayName,
    members,
}: Props) {
    const used = thankYou.length;
    const max  = 940;
    const pct  = used / max;

    const organizer     = members.find((m) => m.roles.some((r) => r.role === "organizer"));
    const organizerName = organizer
        ? `${organizer.first_name} ${organizer.last_name}`
        : "[Organizer Name]";

    const participant = members.find((m) => m.roles.some((r) => r.role === "participant"));
    const participantName = participant
        ? `${participant.first_name} ${participant.last_name}`
        : "[Participant Name]";

    return (
        <div className="px-4 pt-5 pb-6 space-y-4">

            {/* ── Message card ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Letter body */}
                <div className="p-5 space-y-3">
                    {/* Greeting */}
                    <p className="text-sm text-gray-400 font-medium">
                        Hi {isOrg ? "[Donor]" : "[Name]"},
                    </p>

                    {/* Editable message */}
                    <textarea
                        value={thankYou}
                        onChange={(e) => { setThankYou(e.target.value); clearFE("thank_you"); }}
                        maxLength={max}
                        rows={5}
                        placeholder="Thank you so much for supporting this campaign, your support means a lot and makes a real difference. We truly appreciate your contribution and the positive impact it brings."
                        className={`w-full text-sm leading-relaxed resize-none outline-none focus:ring-0 bg-transparent placeholder:text-gray-300 ${
                            fieldErrors.thank_you ? "text-red-500" : "text-gray-700"
                        }`}
                    />

                    {fieldErrors.thank_you && (
                        <p className="text-xs text-red-500">{fieldErrors.thank_you}</p>
                    )}

                    {/* Signature */}
                    <div className="text-right space-y-0.5 pt-1">
                        <p className="text-sm text-gray-600 font-medium">Thank you so much,</p>
                        <div className="flex items-center justify-end gap-1.5 text-sm text-gray-500">
                            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                            <span className="text-gray-500">({organizerName})</span>
                        </div>
                        {isOrg && orgDisplayName && (
                            <p className="text-xs text-gray-400">({orgDisplayName})</p>
                        )}
                    </div>
                </div>

                {/* Counter + FundBuddy row */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                    <p className={`text-[10px] font-semibold tracking-widest uppercase ${
                        pct > 0.9 ? "text-orange-500" : "text-gray-400"
                    }`}>
                        {used}/{max} Characters
                    </p>
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        Ask FundBuddy
                    </button>
                </div>
            </div>

            {/* ── Participant preview (org campaigns) ─────────────────── */}
            {isOrg && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden opacity-60">
                    <div className="p-5 space-y-3">
                        <p className="text-sm text-gray-400 font-medium">Hi [Name],</p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Thank you so much for supporting this campaign, your support means a lot and makes a real difference…
                        </p>
                        <div className="text-right space-y-0.5 pt-1">
                            <p className="text-sm text-gray-400 font-medium">Thank you so much,</p>
                            <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                </svg>
                                <span>({participantName})</span>
                            </div>
                            {orgDisplayName && <p className="text-xs text-gray-300">({orgDisplayName})</p>}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Participant preview</p>
                    </div>
                </div>
            )}

            {/* ── FundBuddy bar ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-orange-50">
                    <svg className="w-9 h-9 shrink-0" viewBox="0 0 48 48" fill="none">
                        <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
                        <circle cx="24" cy="16" r="11" fill="#F97316" />
                        <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
                        <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
                        <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
                        <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
                        <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
                        <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
                    </svg>
                    <p className="text-[11px] text-gray-600 flex-1 leading-relaxed">
                        Ask <span className="font-semibold text-orange-600">FundBuddy</span> for your personalized thank you note — our AI will craft a heartfelt message based on your campaign.
                    </p>
                    <button type="button" className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-full transition-colors">
                        Ask FundBuddy
                    </button>
                </div>
            </div>
        </div>
    );
}
