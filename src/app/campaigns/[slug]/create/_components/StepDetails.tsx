"use client";

import { Field, SectionTitle, inputCls, inputErrCls } from "./ui";
import RichTextEditor from "./RichTextEditor";

type Props = {
    campaignType: "individual" | "organization";
    setCampaignType: (t: "individual" | "organization") => void;
    campaignTypeReadOnly: boolean;
    isOrg: boolean;
    name: string;
    setName: (v: string) => void;
    nameReadOnly: boolean;
    orgDisplayName: string;
    setOrgDisplayName: (v: string) => void;
    orgDisplayNameLocked: boolean;
    story: string;
    setStory: (v: string) => void;
    timezone: string;
    setTimezone: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    isLaunched: boolean;
    isUpcoming: boolean;
    isActive: boolean;
    isCompleted: boolean;
};

export default function StepDetails({
    campaignType, setCampaignType, campaignTypeReadOnly,
    isOrg,
    name, setName, nameReadOnly,
    orgDisplayName, setOrgDisplayName, orgDisplayNameLocked,
    story, setStory,
    timezone, setTimezone,
    startDate, setStartDate,
    endDate, setEndDate,
    fieldErrors, clearFE,
    isLaunched, isUpcoming, isActive, isCompleted,
}: Props) {
    const typeDisabled = campaignTypeReadOnly || isLaunched;
    return (
        <div className="space-y-5">
            <SectionTitle>Campaign Details</SectionTitle>

            {isLaunched && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                    </svg>
                    Some fields are locked because this campaign has already launched.
                </div>
            )}

            {/* Campaign type */}
            <div>
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Campaign Type
                    {typeDisabled && (
                        <span className="ml-2 normal-case font-normal text-gray-400 inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            locked
                        </span>
                    )}
                </p>
                <div className={`grid grid-cols-2 gap-3 ${typeDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                    {(["individual", "organization"] as const).map((type) => (
                        <label
                            key={type}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                                typeDisabled ? "cursor-not-allowed" : "cursor-pointer"
                            } ${
                                campaignType === type
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200"
                            }`}
                        >
                            <input
                                type="radio"
                                value={type}
                                checked={campaignType === type}
                                onChange={() => !typeDisabled && setCampaignType(type)}
                                disabled={typeDisabled}
                                className="sr-only"
                            />
                            {type === "individual" ? (
                                <svg className={`w-8 h-8 ${campaignType === type ? "text-orange-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            ) : (
                                <svg className={`w-8 h-8 ${campaignType === type ? "text-orange-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            )}
                            <div className="text-center">
                                <p className={`text-sm font-semibold ${campaignType === type ? "text-orange-600" : "text-gray-700"}`}>
                                    {type === "individual" ? "Individual" : "Organization"}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {type === "individual" ? "Personal fundraising" : "Team fundraising"}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Campaign Name <span className="text-red-400 ml-0.5">*</span>
                    {nameReadOnly && (
                        <span className="ml-2 normal-case font-normal text-gray-400 inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            locked
                        </span>
                    )}
                </label>
                {nameReadOnly ? (
                    <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed select-none">
                        {name}
                    </div>
                ) : (
                    <input
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearFE("name"); }}
                        maxLength={50}
                        placeholder="Give your campaign a name"
                        className={fieldErrors.name ? inputErrCls : inputCls}
                    />
                )}
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>

            {isOrg && (
                orgDisplayNameLocked ? (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                            Organization Display Name <span className="text-red-400 ml-0.5">*</span>
                            <span className="ml-2 normal-case font-normal text-gray-400 inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                locked
                            </span>
                        </label>
                        <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed select-none">
                            {orgDisplayName}
                        </div>
                    </div>
                ) : (
                    <Field label="Organization Display Name" required error={fieldErrors.org_display_name}>
                        <input
                            value={orgDisplayName}
                            onChange={(e) => { setOrgDisplayName(e.target.value); clearFE("org_display_name"); }}
                            maxLength={100}
                            placeholder="Shown publicly on the campaign page"
                            className={fieldErrors.org_display_name ? inputErrCls : inputCls}
                        />
                    </Field>
                )
            )}

            <Field label="Campaign Story">
                <RichTextEditor
                    value={story}
                    onChange={setStory}
                    placeholder="Tell donors why this campaign matters…"
                />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Field label={`Start Date & Time${isCompleted ? " (locked)" : ""}`}>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={isCompleted}
                            className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        />
                    </Field>
                    {isActive && (
                        <p className="text-[10px] text-blue-500 mt-1">
                            Setting a future start date will revert this campaign to Upcoming.
                        </p>
                    )}
                </div>
                <Field label="End Date & Time" required error={fieldErrors.end_date}>
                    <input
                        type="datetime-local"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => { setEndDate(e.target.value); clearFE("end_date"); }}
                        className={fieldErrors.end_date ? inputErrCls : inputCls}
                    />
                </Field>
            </div>

            <Field label="Timezone">
                <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={inputCls}
                >
                    <optgroup label="United States">
                        <option value="America/New_York">Eastern Time (ET) — New York, Miami</option>
                        <option value="America/Chicago">Central Time (CT) — Chicago, Dallas</option>
                        <option value="America/Denver">Mountain Time (MT) — Denver, Phoenix</option>
                        <option value="America/Los_Angeles">Pacific Time (PT) — Los Angeles, Seattle</option>
                        <option value="America/Anchorage">Alaska Time (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                    </optgroup>
                    <optgroup label="Other">
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                        <option value="Europe/Paris">Paris / Berlin (CET)</option>
                        <option value="Asia/Kolkata">India (IST)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEST)</option>
                    </optgroup>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Dates above are interpreted in this timezone.</p>
            </Field>
        </div>
    );
}
