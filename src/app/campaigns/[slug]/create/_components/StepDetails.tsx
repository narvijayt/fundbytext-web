"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Field, LockedField, QuestionCard, inputCls, inputErrCls } from "./ui";
import { CalendarPopover, TimePopover, TimezonePopover, timezoneLabel } from "./DateTimePicker";
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
function ChevronDownSmIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
    const [showCalendar, setShowCalendar] = useState(false);
    const [showTime, setShowTime] = useState(false);
    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const timeBtnRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {/* Date row */}
            <div className="relative mb-1.5">
                <button
                    ref={dateBtnRef}
                    type="button"
                    onClick={() => !disabled && setShowCalendar((v) => !v)}
                    disabled={disabled}
                    className={`relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors
                        ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-blue-400"}
                        ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                >
                    <CalendarSmIcon />
                    <span className={dateValue ? "text-gray-800" : "text-gray-400"}>
                        {dateValue ? formatDate(dateValue) : "Select date"}
                    </span>
                </button>
                {showCalendar && (
                    <CalendarPopover
                        value={dateValue}
                        minDate={minDate}
                        anchorRef={dateBtnRef}
                        onSelect={onDateChange}
                        onClose={() => setShowCalendar(false)}
                    />
                )}
            </div>
            {/* Time row */}
            <div className="relative">
                <button
                    ref={timeBtnRef}
                    type="button"
                    onClick={() => !disabled && setShowTime((v) => !v)}
                    disabled={disabled}
                    className={`relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors
                        ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-blue-400"}
                        ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                >
                    <ClockSmIcon />
                    <span className={timeValue ? "text-gray-800" : "text-gray-400"}>
                        {timeValue ? formatTime(timeValue) : "Select time"}
                    </span>
                </button>
                {showTime && (
                    <TimePopover
                        value={timeValue}
                        anchorRef={timeBtnRef}
                        onSelect={onTimeChange}
                        onClose={() => setShowTime(false)}
                    />
                )}
            </div>
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

    const [showTimezone, setShowTimezone] = useState(false);
    const timezoneBtnRef = useRef<HTMLButtonElement>(null);

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
            <QuestionCard
                title="What type of campaign are you running?"
                description="This will be the title that everyone sees. Make it clear and catchy!"
                askBuddyText={
                    campaignType === "individual"
                        ? "Individual Campaigns are for a single person like yourself."
                        : "Organizational Campaigns are for groups of people, like sports teams, bands, clubs, schools — you name it."
                }
            >
                <div>
                    <div className={`flex flex-col lg:flex-row gap-4 ${typeDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                        {(["organization", "individual"] as const).map((type) => {
                            const active = campaignType === type;
                            const activeIcon   = type === "organization" ? "/assets/campaigns/organization-active.svg"     : "/assets/campaigns/individual-active.svg";
                            const inactiveIcon = type === "organization" ? "/assets/campaigns/organizational-icon.svg"     : "/assets/campaigns/individual-icon.svg";
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => !typeDisabled && setCampaignType(type)}
                                    disabled={typeDisabled}
                                    className="flex-1 min-w-0 lg:max-w-83.5 h-17 flex items-center justify-between bg-white text-left transition-all"
                                    style={{
                                        gap: active ? 8 : 6,
                                        borderRadius: 16,
                                        paddingTop: 18,
                                        paddingRight: 24,
                                        paddingBottom: 18,
                                        paddingLeft: 16,
                                        border: active ? "2px solid transparent" : "1px solid rgba(212,222,231,1)",
                                        backgroundImage: active
                                            ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                                            : undefined,
                                        backgroundOrigin: active ? "border-box" : undefined,
                                        backgroundClip: active ? "padding-box, border-box" : undefined,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="shrink-0 w-8 h-8 flex items-center justify-center">
                                            <Image
                                                src={active ? activeIcon : inactiveIcon}
                                                width={type === "organization" ? 32 : 17}
                                                height={type === "organization" ? 32 : 20}
                                                alt=""
                                            />
                                        </span>
                                        <span
                                            className="truncate"
                                            style={{
                                                fontFamily: "var(--font-satoshi, 'Satoshi Variable', sans-serif)",
                                                fontWeight: 500,
                                                fontSize: 20,
                                                lineHeight: "150%",
                                                letterSpacing: 0,
                                                color: "rgba(0,48,96,1)",
                                            }}
                                        >
                                            {type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                                        </span>
                                    </div>
                                    {active && (
                                        <span
                                            className="shrink-0"
                                            style={{ width: 16, height: 16, borderRadius: 100, background: "rgba(2,104,192,1)" }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {fieldErrors.campaign_type && (
                        <p className="text-xs text-red-500 mt-2">{fieldErrors.campaign_type}</p>
                    )}
                </div>
            </QuestionCard>

            {/* ── Card 2: Campaign Name ───────────────────────────────── */}
            <QuestionCard
                title="What's the name of your campaign?"
                description="This will be the title that everyone sees. Make it clear and catchy!"
                askBuddyText="Ask FundBuddy for your campaign description — our AI will suggest a great name based on your cause."
            >
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
            </QuestionCard>

            {/* ── Card 3: Organization Name (org only) ────────────────── */}
            {isOrg && (
                <QuestionCard
                    title="What's your organization name?"
                    description="This will be the name that everyone sees. Tell us who you are!"
                    askBuddyText="Ask FundBuddy for campaign name suggestions tailored to your organization type."
                >
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
                </QuestionCard>
            )}

            {/* ── Card 4: Campaign Story ──────────────────────────────── */}
            <QuestionCard
                title="Share your story!"
                description="Share a few sentences about your campaign. Tell us why you are fundraising and what the funds will be used for. This will be displayed on your campaign page, and used in communications with donors."
                askBuddyText="Ask FundBuddy for your campaign description — our AI will write a compelling story for you."
            >
                <RichTextEditor
                    value={story}
                    onChange={setStory}
                    placeholder="Tell donors why this campaign matters…"
                />
            </QuestionCard>

            {/* ── Card 5: Campaign Duration ───────────────────────────── */}
            <QuestionCard
                title="How long will your campaign last?"
                description="Choose a start and end date to keep your campaign on track. You can always extend it later if needed!"
                askBuddyText="Hey there, I see you're doing something unusual — we recommend campaigns run for at least a week to give your donors time to donate!"
            >
                <div className="space-y-4">
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
                        <div className="relative">
                            <button
                                ref={timezoneBtnRef}
                                type="button"
                                onClick={() => setShowTimezone((v) => !v)}
                                className="relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-400 text-sm text-left transition-colors cursor-pointer"
                            >
                                <span className="truncate text-gray-800">{timezoneLabel(timezone)}</span>
                                <ChevronDownSmIcon />
                            </button>
                            {showTimezone && (
                                <TimezonePopover
                                    value={timezone}
                                    anchorRef={timezoneBtnRef}
                                    onSelect={setTimezone}
                                    onClose={() => setShowTimezone(false)}
                                />
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">All dates above are interpreted in this timezone.</p>
                    </div>
                </div>
            </QuestionCard>
        </div>
    );
}
