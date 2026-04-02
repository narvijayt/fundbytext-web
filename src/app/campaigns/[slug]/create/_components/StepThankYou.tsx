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
    const organizer     = members.find((m) => m.roles.some((r) => r.role === "organizer"));
    const organizerName = organizer
        ? `${organizer.first_name} ${organizer.last_name}`
        : "Organizer Name";

    return (
        <div>
            {/* Blue gradient header */}
            <div
                className="relative px-8 pt-8 pb-16 text-center"
                style={{ background: "linear-gradient(160deg, #38bdf8 0%, #0ea5e9 40%, #7dd3fc 100%)" }}
            >
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">Thank You Note</h2>
                <div
                    className="inline-flex items-center gap-2 mt-3 px-5 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: "rgba(2,52,97,0.55)" }}
                >
                    Write a heartfelt message for your donors
                </div>
            </div>

            {/* Preview card — overlaps the gradient */}
            <div className="mx-4 mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                        Hi [Donor Name],
                        <span className="text-red-400 ml-0.5">*</span>
                    </p>
                    <textarea
                        value={thankYou}
                        onChange={(e) => { setThankYou(e.target.value); clearFE("thank_you"); }}
                        maxLength={max}
                        rows={5}
                        placeholder="Thank you so much for supporting this campaign, your support means a lot and makes a real difference. We truly appreciate your contribution and the positive impact it brings."
                        className={`w-full text-sm leading-relaxed resize-none outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 ${
                            fieldErrors.thank_you
                                ? "text-red-500 border-b border-red-300"
                                : "text-gray-600 border-none"
                        }`}
                    />
                    {fieldErrors.thank_you && (
                        <p className="text-xs text-red-500">{fieldErrors.thank_you}</p>
                    )}
                    <div className="space-y-0.5 pt-1">
                        <p className="text-sm text-gray-700">Thank you so much,</p>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                            <span className="font-medium text-gray-700">{organizerName}</span>
                        </div>
                        {isOrg && orgDisplayName && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                                </svg>
                                <span className="text-gray-600">{orgDisplayName}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                    <p className={`text-xs font-semibold tracking-wide uppercase ${used > max * 0.9 ? "text-orange-500" : "text-gray-400"}`}>
                        {used}/{max} characters
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
        </div>
    );
}
