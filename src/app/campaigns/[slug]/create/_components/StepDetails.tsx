"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LockedField, QuestionCard, inputCls, inputErrCls } from "./ui";
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
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}
function ClockSmIcon() {
    return (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
    );
}
function ChevronDownSmIcon() {
    return (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

/* ── PickerField ─────────────────────────────────────────────────────── */
function PickerField({
    label,
    required,
    value,
    displayValue,
    placeholder,
    icon,
    error,
    disabled,
    className,
    renderPopover,
}: {
    label: string;
    required?: boolean;
    value: string;
    displayValue: string;
    placeholder: string;
    icon: React.ReactNode;
    error?: string;
    disabled?: boolean;
    className?: string;
    renderPopover: (anchorRef: React.RefObject<HTMLButtonElement | null>, close: () => void) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    return (
        <div className={`min-w-0 ${className ?? ""}`}>
            <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-[1px]">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <button
                    ref={btnRef}
                    type="button"
                    onClick={() => !disabled && setOpen((v) => !v)}
                    disabled={disabled}
                    className={`relative w-full flex items-center justify-between gap-2 sm:gap-3 pl-3 pr-2 py-2 sm:pl-4 sm:pr-2.5 sm:py-2.5 lg:py-3 rounded-xl sm:rounded-2xl border text-sm sm:text-base text-left transition-colors
                        ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-blue-400"}
                        ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                >
                    <span className={`truncate flex-1 ${value ? "text-gray-800" : "text-gray-400"}`}>
                        {value ? displayValue : placeholder}
                    </span>
                    <span className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50">
                        {icon}
                    </span>
                </button>
                {/* eslint-disable-next-line react-hooks/refs -- anchorRef.current is only read inside the popover's own effects, after render */}
                {open && renderPopover(btnRef, () => setOpen(false))}
            </div>
            {error && <p className="text-[9px] sm:text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

/* ── RangeDash ───────────────────────────────────────────────────────────
   The "—" that joins a start/end pair (date row, time row). An invisible
   label spacer above the dash reserves the same height as each field's label,
   so the dash lines up with the input boxes rather than their labels. */
function RangeDash() {
    return (
        <div className="shrink-0 flex flex-col select-none" aria-hidden>
            <span className="block text-[12px] font-semibold mb-1.5 sm:mb-2 uppercase tracking-[1px] invisible">.</span>
            <span className="flex items-center justify-center h-11 sm:h-13 lg:h-14 text-lg text-[rgba(212,222,231,1)]">—</span>
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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {isLaunched && (
                <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-amber-700">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                    </svg>
                    Some fields are locked because this campaign has already launched.
                </div>
            )}

            {/* ── Card 1: Campaign Type ───────────────────────────────── */}
            <QuestionCard
                title="What type of campaign are you running?"
                description="Choose the campaign type that best fits your fundraising goal."
                askBuddyText={
                    campaignType === "individual"
                        ? "Individual Campaigns are for a single person like yourself."
                        : "Organizational Campaigns are for groups of people, like sports teams, bands, clubs, schools; you name it."
                }
            >
                <div>
                    <div className={`flex flex-col lg:flex-row gap-[16px] ${typeDisabled ? "opacity-60 pointer-events-none" : ""}`}>
                        {(["organization", "individual"] as const).map((type) => {
                            const active = campaignType === type;
                            const activeIcon   = type === "organization" ? "/assets/campaigns/organization-active.svg"     : "/assets/campaigns/individual-active.svg";
                            const inactiveIcon = type === "organization" ? "/assets/campaigns/organizational-icon.svg"     : "/assets/campaigns/individual-inactive.svg";
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => !typeDisabled && setCampaignType(type)}
                                    disabled={typeDisabled}
                                    className="flex-1 min-w-0 h-15 lg:h-17 flex items-center justify-between bg-white text-left transition-all"
                                    style={{
                                        gap: "8px",
                                        borderRadius: "16px",
                                        paddingTop: "18px",
                                        paddingRight: "24px",
                                        paddingBottom: "18px",
                                        paddingLeft: "16px",
                                        border: active ? "2px solid transparent" : "2px solid rgba(212,222,231,1)",
                                        backgroundImage: active
                                            ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                                            : undefined,
                                        backgroundOrigin: active ? "border-box" : undefined,
                                        backgroundClip: active ? "padding-box, border-box" : undefined,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="shrink-0 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center">
                                            <Image
                                                src={active ? activeIcon : inactiveIcon}
                                                width={32}
                                                height={32}
                                                alt=""
                                                className="w-6 h-6 lg:w-8 lg:h-8"
                                            />
                                        </span>
                                        <span
                                            className="truncate text-[14px] sm:text-[20px]"
                                            style={{
                                                fontFamily: "var(--font-sans)",
                                                fontWeight: 500,
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
                                            className="shrink-0 flex items-center justify-center rounded-full"
                                            style={{
                                                width: "18px",
                                                height: "18px",
                                                border: "2px solid rgba(2,104,192,1)",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <span
                                                className="rounded-full"
                                                style={{ width: "8px", height: "8px", background: "rgba(2,104,192,1)" }}
                                            />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {fieldErrors.campaign_type && (
                        <p className="text-xs sm:text-sm text-red-500 mt-2">{fieldErrors.campaign_type}</p>
                    )}
                </div>
            </QuestionCard>

            {/* ── Card 2: Campaign Name ───────────────────────────────── */}
            <QuestionCard
                title="What's the name of your campaign?"
                description="This will be the title that everyone sees. Make it clear and catchy!"
                askBuddyText="Ask FundBuddy for your campaign description."
                askBuddySuggestionsHeading="Hey there buddy, here are some great campaign name suggestions!"
                askBuddySuggestions={[
                    "New Gear for Samuel's Soccer Team",
                    "Fund John's Wrestling Team's Travel Expenses",
                    "New Uniforms for Jason's Little League Team",
                ]}
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
                                className={`${fieldErrors.name ? inputErrCls : inputCls} pr-16 sm:pr-20`}
                            />
                            <span className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-[12px] sm:text-[14px] text-[#8f98a3] font-medium">
                                Max. {50 - name.length}
                            </span>
                        </div>
                        {fieldErrors.name && <p className="text-xs sm:text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
                    </div>
                )}
            </QuestionCard>

            {/* ── Card 3: Organization Name (org only) ────────────────── */}
            {isOrg && (
                <QuestionCard
                    title="What's your organization name?"
                    description="This will be the name that everyone sees. Tell us who you are!"
                    askBuddyText="Ask FundBuddy for campaign name suggestions."
                    askBuddySuggestionsHeading="Hey there buddy, here are some great campaign name suggestions!"
                    askBuddySuggestions={[
                        "New Gear for Samuel's Soccer Team",
                        "Fund John's Wrestling Team's Travel Expenses",
                        "New Uniforms for Jason's Little League Team",
                    ]}
                >
                    {orgDisplayNameLocked ? (
                        <LockedField value={orgDisplayName} label="Organization Display Name" />
                    ) : (
                        <div>
                            <input
                                value={orgDisplayName}
                                onChange={(e) => { setOrgDisplayName(e.target.value); clearFE("org_display_name"); }}
                                maxLength={100}
                                placeholder="Your organization name here"
                                className={fieldErrors.org_display_name ? inputErrCls : inputCls}
                            />
                            {fieldErrors.org_display_name && (
                                <p className="text-xs sm:text-sm text-red-500 mt-1">{fieldErrors.org_display_name}</p>
                            )}
                        </div>
                    )}
                </QuestionCard>
            )}

            {/* ── Card 4: Campaign Story ──────────────────────────────── */}
            <QuestionCard
                title="Share your story!"
                icon="/assets/campaigns/question-story.svg"
                description="Share a few sentences about your campaign. Tell us why you are fundraising and what the funds will be used for. This will be displayed on your campaign page, and used in communications with donors."
                askBuddyText="Ask FundBuddy for your campaign description."
                askBuddySuggestionsHeading="Hey there buddy, here are some tips for a great story!"
                askBuddySuggestions={[
                    "Introduce who you are and what your cause is about.",
                    "Explain why you're fundraising and your specific goal.",
                    "Tell donors exactly how their support will make a difference.",
                ]}
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
                icon="/assets/campaigns/question-calendar.svg"
                description="Choose a start and end date to keep your campaign on track. You can always extend it later if needed!"
                askBuddyText="Hey there, I saw you're doing something unusual, we recommend campaigns run for at least a week to give your donors time to donate!"
            >
                <div className="space-y-4 sm:space-y-6">
                    {/* Start ── End date row */}
                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                        <PickerField
                            className="flex-1"
                            label="Start Date"
                            value={startD}
                            displayValue={formatDate(startD)}
                            placeholder="Select date"
                            icon={<CalendarSmIcon />}
                            disabled={isCompleted}
                            renderPopover={(ref, close) => (
                                <CalendarPopover
                                    value={startD}
                                    anchorRef={ref}
                                    onSelect={handleStartDate}
                                    onClose={close}
                                />
                            )}
                        />
                        <RangeDash />
                        <PickerField
                            className="flex-1"
                            label="End Date"
                            required
                            value={endD}
                            displayValue={formatDate(endD)}
                            placeholder="Select date"
                            icon={<CalendarSmIcon />}
                            error={fieldErrors.end_date}
                            renderPopover={(ref, close) => (
                                <CalendarPopover
                                    value={endD}
                                    minDate={startD || undefined}
                                    anchorRef={ref}
                                    onSelect={handleEndDate}
                                    onClose={close}
                                />
                            )}
                        />
                    </div>
                    {/* Start ── End time row */}
                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                        <PickerField
                            className="flex-1"
                            label="Start Time"
                            value={startT || "07:00"}
                            displayValue={formatTime(startT || "07:00")}
                            placeholder="Select time"
                            icon={<ClockSmIcon />}
                            disabled={isCompleted}
                            renderPopover={(ref, close) => (
                                <TimePopover
                                    value={startT || "07:00"}
                                    anchorRef={ref}
                                    onSelect={handleStartTime}
                                    onClose={close}
                                />
                            )}
                        />
                        <RangeDash />
                        <PickerField
                            className="flex-1"
                            label="End Time"
                            value={endT || "18:00"}
                            displayValue={formatTime(endT || "18:00")}
                            placeholder="Select time"
                            icon={<ClockSmIcon />}
                            renderPopover={(ref, close) => (
                                <TimePopover
                                    value={endT || "18:00"}
                                    anchorRef={ref}
                                    onSelect={handleEndTime}
                                    onClose={close}
                                />
                            )}
                        />
                    </div>
                    {isActive && (
                        <p className="text-[9px] sm:text-xs text-blue-500">
                            Setting a future start date will revert this campaign to Upcoming.
                        </p>
                    )}

                    {/* Timezone */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-[1px]">
                            Timezone
                        </label>
                        <div className="relative">
                            <button
                                ref={timezoneBtnRef}
                                type="button"
                                onClick={() => setShowTimezone((v) => !v)}
                                className="relative w-full flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 bg-white hover:border-blue-400 text-sm sm:text-base text-left transition-colors cursor-pointer"
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
                        <p className="text-[9px] sm:text-xs text-gray-400 mt-1 sm:mt-1.5">All dates above are interpreted in this timezone.</p>
                    </div>
                </div>
            </QuestionCard>
        </div>
    );
}
