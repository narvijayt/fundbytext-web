"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LockedField, QuestionCard, inputCls, inputErrCls } from "./ui";
import { CalendarPopover, TimePopover, TimezoneSelector } from "./DateTimePicker";
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

/* Default times applied when a date is chosen but no time has been set yet. */
const DEFAULT_START_TIME = "07:00";
const DEFAULT_END_TIME = "18:00";

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
            {error && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

/* ── RangeDash ───────────────────────────────────────────────────────────
   The "—" that joins a start/end pair (date row, time row). An invisible
   label spacer above the dash reserves the same height as each field's label,
   so the dash lines up with the input boxes rather than their labels. */
function RangeDash({ className = "flex" }: { className?: string }) {
    return (
        <div className={`shrink-0 flex-col select-none ${className}`} aria-hidden>
            <span className="block text-[12px] font-semibold mb-1.5 sm:mb-2 uppercase tracking-[1px] invisible">.</span>
            <span className="flex items-center justify-center h-11 sm:h-13 lg:h-14 text-lg text-[rgba(212,222,231,1)]">—</span>
        </div>
    );
}

/* ── CampaignSummary ─────────────────────────────────────────────────────
   Compact, read-only recap of the campaign type + name (both captured back in
   Step 0). Shown instead of re-asking those two questions on Step 1. */
function CampaignSummary({ isOrg, name }: { isOrg: boolean; name: string }) {
    return (
        <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0px 32px 40px -16px rgba(2,104,192,0.3), 0px 12px 12px -8px rgba(2,104,192,0.06)" }}
        >
            <div className="flex items-center gap-4 sm:gap-5 px-6 sm:px-10 py-5 sm:py-6">
                <span
                    className="shrink-0 flex items-center justify-center rounded-2xl w-12 h-12 sm:w-14 sm:h-14"
                    style={{ background: "#e2f1ff" }}
                >
                    <Image
                        src={isOrg ? "/assets/campaigns/organization-active.svg" : "/assets/campaigns/individual-active.svg"}
                        width={32}
                        height={32}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8"
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="uppercase tracking-[1px] text-[11px] sm:text-[12px] font-bold text-[#8f98a3] mb-1">
                        Your campaign
                    </p>
                    <h3
                        className="font-black text-[18px] sm:text-[22px] leading-[125%] truncate"
                        style={{ color: "rgba(0,48,96,1)" }}
                        title={name}
                    >
                        {name}
                    </h3>
                    <span className="inline-flex items-center mt-2 rounded-full bg-[#eaeef3] px-3 py-1 text-[12px] sm:text-[13px] font-semibold text-[#0268c0]">
                        {isOrg ? "Organization Campaign" : "Individual Campaign"}
                    </span>
                </div>
            </div>
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
    isOrg,
    name,
    orgDisplayName, setOrgDisplayName, orgDisplayNameLocked,
    story, setStory,
    timezone, setTimezone,
    startDate, setStartDate,
    endDate, setEndDate,
    fieldErrors, clearFE,
    isLaunched, isActive, isCompleted,
}: Props) {
    /* Split datetime-local strings into date + time */
    const { date: startD, time: startT } = splitDateTime(startDate);
    const { date: endD,   time: endT   } = splitDateTime(endDate);

    /* Nudge donors toward a longer run: only flag a duration shorter than a
       full week, and only once both ends of the range are actually picked. */
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const isShortRun = (() => {
        if (!startDate || !endDate) return false;
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) return false;
        return end > start && end - start < ONE_WEEK_MS;
    })();

    /* Date & time are stored together as one datetime-local string, so neither
       can stand alone. To let the time be set before a date (and vice-versa):
       picking a date fills in the default time if none was chosen yet, and
       picking a time falls back to today's date so the choice isn't discarded. */
    const todayLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    function handleStartDate(d: string) { setStartDate(joinDateTime(d, startT || DEFAULT_START_TIME)); }
    function handleStartTime(t: string) { setStartDate(joinDateTime(startD || todayLocal(), t)); }
    function handleEndDate(d: string)   { setEndDate(joinDateTime(d, endT || DEFAULT_END_TIME)); clearFE("end_date"); }
    function handleEndTime(t: string)   { setEndDate(joinDateTime(endD || todayLocal(), t)); clearFE("end_date"); }

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

            {/* ── Campaign summary — type & name (already chosen in Step 0,
            shown read-only here as a compact summary, not a question). ───── */}
            <CampaignSummary isOrg={isOrg} name={name} />

            {/* ── Card 3: Organization Name (org only) ────────────────── */}
            {isOrg && (
                <QuestionCard
                    title="What's your organization name?"
                    description="This will be the name that everyone sees. Tell us who you are!"
                    askBuddyText="Ask FundBuddy for organization name ideas."
                    askBuddySuggestionsHeading="Hey there buddy, here are some organization name ideas!"
                    askBuddySuggestions={[
                        "Lincoln High Soccer Boosters",
                        "Riverside Youth Basketball Club",
                        "Westfield Band Parents Association",
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
                                <p data-field-error className="text-xs sm:text-sm text-red-500 mt-1">{fieldErrors.org_display_name}</p>
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
                askBuddyText={isShortRun ? "Hey there, I saw you're doing something unusual, we recommend campaigns run for at least a week to give your donors time to donate!" : undefined}
            >
                <div className="space-y-4 sm:space-y-6">
                    {/* Start ── End date row */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3 lg:gap-4">
                        <PickerField
                            className="sm:flex-1"
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
                        <RangeDash className="hidden sm:flex" />
                        <PickerField
                            className="sm:flex-1"
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
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3 lg:gap-4">
                        <PickerField
                            className="sm:flex-1"
                            label="Start Time"
                            value={startT || DEFAULT_START_TIME}
                            displayValue={formatTime(startT || DEFAULT_START_TIME)}
                            placeholder="Select time"
                            icon={<ClockSmIcon />}
                            disabled={isCompleted}
                            renderPopover={(ref, close) => (
                                <TimePopover
                                    value={startT || DEFAULT_START_TIME}
                                    anchorRef={ref}
                                    onSelect={handleStartTime}
                                    onClose={close}
                                />
                            )}
                        />
                        <RangeDash className="hidden sm:flex" />
                        <PickerField
                            className="sm:flex-1"
                            label="End Time"
                            value={endT || DEFAULT_END_TIME}
                            displayValue={formatTime(endT || DEFAULT_END_TIME)}
                            placeholder="Select time"
                            icon={<ClockSmIcon />}
                            renderPopover={(ref, close) => (
                                <TimePopover
                                    value={endT || DEFAULT_END_TIME}
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

                    {/* Timezone — full-width selectable cards instead of a dropdown */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-500 mb-2 sm:mb-2.5 uppercase tracking-[1px]">Timezone</label>
                        <TimezoneSelector value={timezone} onSelect={setTimezone} disabled={isCompleted} />
                        <p className="text-[9px] sm:text-xs text-gray-400 mt-2 sm:mt-2.5">All dates above are interpreted in this timezone.</p>
                    </div>
                </div>
            </QuestionCard>
        </div>
    );
}
