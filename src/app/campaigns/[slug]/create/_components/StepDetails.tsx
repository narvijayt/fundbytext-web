"use client";

import { useState, useRef } from "react";
import { StepCard, CardHeader, CardDivider, FundBuddyBar, Field, LockedField, inputCls, inputErrCls } from "./ui";
import RichTextEditor from "./RichTextEditor";

/* ── helpers ─────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00");
    return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(timeStr: string): string {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function splitDateTime(dtLocal: string): { date: string; time: string } {
    if (!dtLocal) return { date: "", time: "" };
    const [date, time] = dtLocal.split("T");
    return { date: date ?? "", time: time?.slice(0, 5) ?? "00:00" };
}

function joinDateTime(date: string, time: string): string {
    if (!date) return "";
    return `${date}T${time || "00:00"}`;
}

/* ── icons ───────────────────────────────────────────────────────────── */
function BotIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8V4M8 4h8M9 14h.01M15 14h.01M9 18h6" />
        </svg>
    );
}
function CalendarIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}
function CalendarSmIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}
function ClockSmIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
    );
}
function OrgIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}
function PersonIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}
function CheckCircleIcon() {
    return (
        <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm4.7 7.3a1 1 0 00-1.4-1.4L11 12.18l-2.3-2.3a1 1 0 00-1.4 1.42l3 3a1 1 0 001.4 0l5-5z" clipRule="evenodd" />
        </svg>
    );
}

/* ── DateTimeField ───────────────────────────────────────────────────── */
function DateTimeField({
    label,
    required,
    dateValue,
    timeValue,
    onDateChange,
    onTimeChange,
    minDate,
    error,
    disabled,
}: {
    label: string;
    required?: boolean;
    dateValue: string;
    timeValue: string;
    onDateChange: (v: string) => void;
    onTimeChange: (v: string) => void;
    minDate?: string;
    error?: string;
    disabled?: boolean;
}) {
    const dateRef = useRef<HTMLInputElement>(null);
    const timeRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {/* Date row */}
            <button
                type="button"
                onClick={() => dateRef.current?.showPicker?.()}
                disabled={disabled}
                className={`relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors mb-1.5
                    ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-blue-400"}
                    ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
            >
                <CalendarSmIcon />
                <span className={dateValue ? "text-gray-800" : "text-gray-400"}>
                    {dateValue ? formatDate(dateValue) : "Select date"}
                </span>
                <input
                    ref={dateRef}
                    type="date"
                    value={dateValue}
                    min={minDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    disabled={disabled}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    tabIndex={-1}
                />
            </button>
            {/* Time row */}
            <button
                type="button"
                onClick={() => timeRef.current?.showPicker?.()}
                disabled={disabled}
                className={`relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors
                    ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-blue-400"}
                    ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
            >
                <ClockSmIcon />
                <span className={timeValue ? "text-gray-800" : "text-gray-400"}>
                    {timeValue ? formatTime(timeValue) : "Select time"}
                </span>
                <input
                    ref={timeRef}
                    type="time"
                    value={timeValue}
                    onChange={(e) => onTimeChange(e.target.value)}
                    disabled={disabled}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    tabIndex={-1}
                />
            </button>
            {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

/* ── Props ───────────────────────────────────────────────────────────── */
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

/* ── StepDetails ─────────────────────────────────────────────────────── */
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
    isLaunched, isActive, isCompleted,
}: Props) {
    const typeDisabled = campaignTypeReadOnly || isLaunched;

    /* Split datetime-local strings into date + time */
    const { date: startD, time: startT } = splitDateTime(startDate);
    const { date: endD,   time: endT   } = splitDateTime(endDate);

    function handleStartDate(d: string) { setStartDate(joinDateTime(d, startT)); }
    function handleStartTime(t: string) { setStartDate(joinDateTime(startD, t)); }
    function handleEndDate(d: string)   { setEndDate(joinDateTime(d, endT)); clearFE("end_date"); }
    function handleEndTime(t: string)   { setEndDate(joinDateTime(endD, t)); }

    return (
        <div className="space-y-4">
            {isLaunched && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                    </svg>
                    Some fields are locked because this campaign has already launched.
                </div>
            )}

            {/* ── Card 1: Campaign Type ───────────────────────────────── */}
            <StepCard>
                <CardHeader
                    icon={<BotIcon />}
                    title="What type of campaign are you running?"
                    description="This will be the title that everyone sees. Make it clear and catchy!"
                />
                <CardDivider />
                <div className="px-5 py-4">
                    <div className={`flex flex-col sm:flex-row gap-3 ${typeDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                        {(["organization", "individual"] as const).map((type) => {
                            const active = campaignType === type;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => !typeDisabled && setCampaignType(type)}
                                    disabled={typeDisabled}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all text-left ${
                                        active
                                            ? "bg-blue-700 border-blue-700 text-white shadow-md"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                                    }`}
                                >
                                    {type === "organization" ? <OrgIcon active={active} /> : <PersonIcon active={active} />}
                                    <span className="flex-1">
                                        {type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                                    </span>
                                    {active && <CheckCircleIcon />}
                                </button>
                            );
                        })}
                    </div>
                    {fieldErrors.campaign_type && (
                        <p className="text-xs text-red-500 mt-2">{fieldErrors.campaign_type}</p>
                    )}
                </div>
                <FundBuddyBar
                    text={
                        campaignType === "individual"
                            ? "Individual Campaigns are for a single person like yourself."
                            : "Organizational Campaigns are for groups of people, like sports teams, bands, clubs, schools — you name it."
                    }
                />
            </StepCard>

            {/* ── Card 2: Campaign Name ───────────────────────────────── */}
            <StepCard>
                <CardHeader
                    icon={<BotIcon />}
                    title="What's the name of your campaign?"
                    description="This will be the title that everyone sees. Make it clear and catchy!"
                />
                <CardDivider />
                <div className="px-5 py-4">
                    {nameReadOnly ? (
                        <LockedField value={name} label="Campaign Name" />
                    ) : (
                        <div>
                            <div className="relative">
                                <input
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); clearFE("name"); }}
                                    maxLength={50}
                                    placeholder="Give your campaign a catchy name…"
                                    className={`${fieldErrors.name ? inputErrCls : inputCls} pr-16`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                                    {name.length}/50
                                </span>
                            </div>
                            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                        </div>
                    )}
                </div>
                <FundBuddyBar
                    text="Ask FundBuddy for your campaign description — our AI will suggest a great name based on your cause."
                    onAsk={() => {}}
                />
            </StepCard>

            {/* ── Card 3: Organization Name (org only) ────────────────── */}
            {isOrg && (
                <StepCard>
                    <CardHeader
                        icon={<BotIcon />}
                        title="What's your organization name?"
                        description="This will be the name that everyone sees. Tell us who you are!"
                    />
                    <CardDivider />
                    <div className="px-5 py-4">
                        {orgDisplayNameLocked ? (
                            <LockedField value={orgDisplayName} label="Organization Display Name" />
                        ) : (
                            <Field label="Organization Display Name" required error={fieldErrors.org_display_name}>
                                <input
                                    value={orgDisplayName}
                                    onChange={(e) => { setOrgDisplayName(e.target.value); clearFE("org_display_name"); }}
                                    maxLength={100}
                                    placeholder="Your organization name here"
                                    className={fieldErrors.org_display_name ? inputErrCls : inputCls}
                                />
                            </Field>
                        )}
                    </div>
                    <FundBuddyBar
                        text="Ask FundBuddy for campaign name suggestions tailored to your organization type."
                        onAsk={() => {}}
                    />
                </StepCard>
            )}

            {/* ── Card 4: Campaign Story ──────────────────────────────── */}
            <StepCard>
                <CardHeader
                    icon={<CalendarIcon />}
                    title="Share your story!"
                    description="Share a few sentences about your campaign. Tell us why you are fundraising and what the funds will be used for. This will be displayed on your campaign page, and used in communications with donors."
                />
                <CardDivider />
                <div className="px-5 py-4">
                    <RichTextEditor
                        value={story}
                        onChange={setStory}
                        placeholder="Tell donors why this campaign matters…"
                    />
                </div>
                <FundBuddyBar
                    text="Ask FundBuddy for your campaign description — our AI will write a compelling story for you."
                    onAsk={() => {}}
                />
            </StepCard>

            {/* ── Card 5: Campaign Duration ───────────────────────────── */}
            <StepCard>
                <CardHeader
                    icon={<CalendarIcon />}
                    title="How long will your campaign last?"
                    description="Choose a start and end date to keep your campaign on track. You can always extend it later if needed!"
                />
                <CardDivider />
                <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <DateTimeField
                            label="Start Date"
                            dateValue={startD}
                            timeValue={startT || "07:00"}
                            onDateChange={handleStartDate}
                            onTimeChange={handleStartTime}
                            disabled={isCompleted}
                        />
                        <DateTimeField
                            label="End Date"
                            required
                            dateValue={endD}
                            timeValue={endT || "18:00"}
                            onDateChange={handleEndDate}
                            onTimeChange={handleEndTime}
                            minDate={startD || undefined}
                            error={fieldErrors.end_date}
                        />
                    </div>
                    {isActive && (
                        <p className="text-[10px] text-blue-500">
                            Setting a future start date will revert this campaign to Upcoming.
                        </p>
                    )}

                    {/* Timezone */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Timezone
                        </label>
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
                        <p className="text-[10px] text-gray-400 mt-1">All dates above are interpreted in this timezone.</p>
                    </div>
                </div>
                <FundBuddyBar
                    text="Hey there, I see you're doing something unusual — we recommend campaigns run for at least a week to give your donors time to donate!"
                />
            </StepCard>
        </div>
    );
}
