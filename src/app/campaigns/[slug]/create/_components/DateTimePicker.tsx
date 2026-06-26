"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { inputCls, inputErrCls } from "./ui";

/* ── anchored portal ───────────────────────────────────────────────────────
   Popovers render into document.body and are positioned with `fixed`
   coordinates derived from the trigger button's rect. This escapes any
   `overflow-hidden`/stacking-context ancestors (e.g. QuestionCard's rounded
   white shell) that would otherwise clip or bury the popover. */
function useAnchoredRect(anchorRef: React.RefObject<HTMLElement | null>) {
    const [rect, setRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);

    useLayoutEffect(() => {
        function update() {
            const el = anchorRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, bottom: r.bottom });
        }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [anchorRef]);

    return rect;
}

function AnchoredPopover({
    anchorRef,
    width,
    children,
}: {
    anchorRef: React.RefObject<HTMLElement | null>;
    width: number;
    children: React.ReactNode;
}) {
    const rect = useAnchoredRect(anchorRef);
    const popRef = useRef<HTMLDivElement>(null);

    // Measure the rendered popover and place it directly via the DOM (not React
    // state) — flipping above the trigger when there's no room below, e.g. a
    // date field near the bottom of the viewport. Mutating style here avoids
    // the extra render cycle/flicker a setState-based reposition would cause.
    useLayoutEffect(() => {
        const el = popRef.current;
        if (!rect || !el) return;
        const gap = 8;
        const margin = 12;
        const popHeight = el.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom - margin;
        const spaceAbove = rect.top - margin;
        const placeAbove = popHeight > spaceBelow && spaceAbove > spaceBelow;
        const top = placeAbove ? rect.top - popHeight - gap : rect.bottom + gap;
        const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.visibility = "visible";
    });

    if (typeof document === "undefined" || !rect) return null;

    return createPortal(
        <div
            ref={popRef}
            className="fixed z-[200] bg-white rounded-2xl border border-gray-100 p-4"
            style={{
                top: rect.bottom + 8,
                left: rect.left,
                width,
                visibility: "hidden",
                boxShadow: "0px 24px 32px -12px rgba(2,104,192,0.25), 0px 8px 8px -6px rgba(2,104,192,0.06)",
            }}
        >
            {children}
        </div>,
        document.body
    );
}

/* ── shared chevron icons ──────────────────────────────────────────────── */
function ChevronIcon({ dir, className = "w-4 h-4" }: { dir: "left" | "right" | "up" | "down"; className?: string }) {
    const d = {
        left: "M15 19l-7-7 7-7",
        right: "M9 5l7 7-7 7",
        up: "M5 15l7-7 7 7",
        down: "M19 9l-7 7-7-7",
    }[dir];
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );
}

/* ── CalendarPopover ───────────────────────────────────────────────────── */
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

export function CalendarPopover({
    value,
    minDate,
    anchorRef,
    onSelect,
    onClose,
}: {
    value: string;
    minDate?: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    onSelect: (date: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const initial = value ? new Date(value + "T12:00") : new Date();
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [pickingYear, setPickingYear] = useState(false);
    const selectedYearRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [onClose]);

    // When the year grid opens, scroll the current year into view.
    useEffect(() => {
        if (pickingYear) selectedYearRef.current?.scrollIntoView({ block: "center" });
    }, [pickingYear]);

    const numDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first
    const cells: (number | null)[] = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: numDays }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const todayStr = new Date().toISOString().slice(0, 10);
    const minDt = minDate ? new Date(minDate + "T00:00") : null;

    // Year-picker range — always includes the current view year + a generous
    // window around today so both past (edits) and future campaigns are reachable.
    const todayY = new Date().getFullYear();
    const yearFrom = Math.min(todayY, viewYear) - 8;
    const yearTo = Math.max(todayY, viewYear) + 12;
    const years = Array.from({ length: yearTo - yearFrom + 1 }, (_, i) => yearFrom + i);

    function goPrevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    }
    function goNextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    }

    return (
        <AnchoredPopover anchorRef={anchorRef} width={272}>
        <div ref={ref}>
            {/* Month / year header + nav — the label toggles the year picker */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => setPickingYear((v) => !v)}
                    className="flex items-center gap-1.5 text-[15px] font-bold text-gray-800 hover:text-blue-600 transition-colors"
                >
                    {MONTHS[viewMonth]} {viewYear}
                    <ChevronIcon dir={pickingYear ? "up" : "down"} className="w-4 h-4 text-gray-400" />
                </button>
                {!pickingYear && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={goPrevMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <ChevronIcon dir="left" />
                        </button>
                        <button
                            type="button"
                            onClick={goNextMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <ChevronIcon dir="right" />
                        </button>
                    </div>
                )}
            </div>

            {pickingYear ? (
                /* Year picker */
                <div className="grid grid-cols-4 gap-1.5 max-h-[196px] overflow-y-auto no-scrollbar py-1">
                    {years.map((y) => {
                        const sel = y === viewYear;
                        return (
                            <button
                                key={y}
                                ref={sel ? selectedYearRef : undefined}
                                type="button"
                                onClick={() => { setViewYear(y); setPickingYear(false); }}
                                className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                                    sel
                                        ? "bg-gradient-to-b from-[rgba(38,186,88,1)] to-[rgba(52,213,106,1)] text-white shadow-sm"
                                        : "text-gray-700 hover:bg-blue-50"
                                }`}
                            >
                                {y}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    {/* Weekday header */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map((w, i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">{w}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, i) => {
                            if (day === null) return <div key={i} />;
                            const dStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
                            const isSelected = dStr === value;
                            const isToday = dStr === todayStr;
                            const isDisabled = minDt ? new Date(dStr + "T00:00") < minDt : false;
                            return (
                                <div key={i} className="flex items-center justify-center">
                                    <button
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => { onSelect(dStr); onClose(); }}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-colors
                                            ${isSelected
                                                ? "bg-gradient-to-b from-[rgba(38,186,88,1)] to-[rgba(52,213,106,1)] text-white shadow-sm"
                                                : isDisabled
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : isToday
                                                        ? "text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50"
                                                        : "text-gray-700 hover:bg-blue-50"}`}
                                    >
                                        {day}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
        </AnchoredPopover>
    );
}

/* ── TimePopover ───────────────────────────────────────────────────────── */
function wrap(value: number, min: number, max: number): number {
    const span = max - min + 1;
    return ((value - min) % span + span) % span + min;
}

/* Material-style time picker: big hour/minute tiles (the active one is
   highlighted green) and a segmented AM/PM control. Each tile is focusable —
   type digits, use ↑/↓, or scroll to change it. */
const GREEN_TILE = "rgba(38,186,88,0.14)";
const GREEN_TEXT = "rgba(38,186,88,1)";

export function TimePopover({
    value,
    anchorRef,
    onSelect,
    onClose,
}: {
    value: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    onSelect: (time: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [h24, m] = value ? value.split(":").map(Number) : [7, 0];
    const [hour, setHour] = useState(h24 % 12 || 12);   // 1..12
    const [minute, setMinute] = useState(m);             // 0..59
    const [ampm, setAmpm] = useState<"AM" | "PM">(h24 >= 12 ? "PM" : "AM");
    const [active, setActive] = useState<"hour" | "minute">("hour");

    // Digit-entry buffers, so typing "1" then "2" makes 12.
    const hourBuf = useRef("");
    const minBuf = useRef("");

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [onClose]);

    function commit() {
        const h = (hour % 12) + (ampm === "PM" ? 12 : 0);
        onSelect(`${pad2(h)}:${pad2(minute)}`);
        onClose();
    }

    function onHourKey(e: React.KeyboardEvent) {
        if (e.key === "ArrowUp")        { e.preventDefault(); setHour((h) => wrap(h + 1, 1, 12)); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setHour((h) => wrap(h - 1, 1, 12)); }
        else if (e.key === "Enter")     { e.preventDefault(); commit(); }
        else if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            hourBuf.current = (hourBuf.current + e.key).slice(-2);
            let n = parseInt(hourBuf.current, 10);
            if (n > 12) { hourBuf.current = e.key; n = parseInt(e.key, 10); }
            setHour(n === 0 ? 12 : n);
        }
    }
    function onMinuteKey(e: React.KeyboardEvent) {
        if (e.key === "ArrowUp")        { e.preventDefault(); setMinute((mi) => wrap(mi + 1, 0, 59)); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setMinute((mi) => wrap(mi - 1, 0, 59)); }
        else if (e.key === "Enter")     { e.preventDefault(); commit(); }
        else if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            minBuf.current = (minBuf.current + e.key).slice(-2);
            let n = parseInt(minBuf.current, 10);
            if (n > 59) { minBuf.current = e.key; n = parseInt(e.key, 10); }
            setMinute(n);
        }
    }

    const tileCls =
        "flex-1 h-[76px] flex items-center justify-center rounded-2xl text-[44px] leading-none font-black tabular-nums transition-colors focus:outline-none cursor-pointer";
    const hourActive = active === "hour";
    const minActive = active === "minute";

    return (
        <AnchoredPopover anchorRef={anchorRef} width={300}>
        <div ref={ref} className="p-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Select Time</p>

            <div className="flex items-stretch gap-2 mb-5">
                {/* Hour + minute tiles */}
                <button
                    type="button"
                    onFocus={() => { setActive("hour"); hourBuf.current = ""; }}
                    onKeyDown={onHourKey}
                    onWheel={(e) => setHour((h) => wrap(h + (e.deltaY < 0 ? 1 : -1), 1, 12))}
                    className={tileCls}
                    style={{
                        background: hourActive ? GREEN_TILE : "rgba(241,243,245,1)",
                        color: hourActive ? GREEN_TEXT : "rgba(31,41,55,1)",
                    }}
                >
                    {hour}
                </button>

                <span className="self-center text-[40px] leading-none font-black text-gray-300">:</span>

                <button
                    type="button"
                    onFocus={() => { setActive("minute"); minBuf.current = ""; }}
                    onKeyDown={onMinuteKey}
                    onWheel={(e) => setMinute((mi) => wrap(mi + (e.deltaY < 0 ? 1 : -1), 0, 59))}
                    className={tileCls}
                    style={{
                        background: minActive ? GREEN_TILE : "rgba(241,243,245,1)",
                        color: minActive ? GREEN_TEXT : "rgba(31,41,55,1)",
                    }}
                >
                    {pad2(minute)}
                </button>

                {/* AM / PM segmented control */}
                <div className="shrink-0 w-13 flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                    {(["AM", "PM"] as const).map((ap, i) => {
                        const on = ampm === ap;
                        return (
                            <button
                                key={ap}
                                type="button"
                                onClick={() => setAmpm(ap)}
                                className={`flex-1 text-[13px] font-bold transition-colors ${i === 0 ? "border-b border-gray-200" : ""}`}
                                style={{
                                    background: on ? GREEN_TILE : "#fff",
                                    color: on ? GREEN_TEXT : "rgba(126,138,150,1)",
                                }}
                            >
                                {ap}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-end gap-5 text-[13px] font-bold tracking-wide">
                <button type="button" onClick={onClose} className="text-blue-600 hover:text-blue-800 transition-colors">
                    CANCEL
                </button>
                <button type="button" onClick={commit} className="text-blue-600 hover:text-blue-800 transition-colors">
                    OK
                </button>
            </div>
        </div>
        </AnchoredPopover>
    );
}

/* ── TimezonePopover ───────────────────────────────────────────────────── */
const TIMEZONE_GROUPS: { label: string; options: { value: string; label: string }[] }[] = [
    {
        label: "United States",
        options: [
            { value: "America/New_York", label: "Eastern Time (ET) — New York, Miami" },
            { value: "America/Chicago", label: "Central Time (CT) — Chicago, Dallas" },
            { value: "America/Denver", label: "Mountain Time (MT) — Denver, Phoenix" },
            { value: "America/Los_Angeles", label: "Pacific Time (PT) — Los Angeles, Seattle" },
            { value: "America/Anchorage", label: "Alaska Time (AKT)" },
            { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
        ],
    },
    {
        label: "Other",
        options: [
            { value: "UTC", label: "UTC" },
            { value: "Europe/London", label: "London (GMT/BST)" },
            { value: "Europe/Paris", label: "Paris / Berlin (CET)" },
            { value: "Asia/Kolkata", label: "India (IST)" },
            { value: "Asia/Dubai", label: "Dubai (GST)" },
            { value: "Asia/Tokyo", label: "Tokyo (JST)" },
            { value: "Australia/Sydney", label: "Sydney (AEST)" },
        ],
    },
];

export function timezoneLabel(value: string): string {
    for (const group of TIMEZONE_GROUPS) {
        const match = group.options.find((opt) => opt.value === value);
        if (match) return match.label;
    }
    return value;
}

export function TimezonePopover({
    value,
    anchorRef,
    onSelect,
    onClose,
}: {
    value: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    onSelect: (tz: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [onClose]);

    return (
        <AnchoredPopover anchorRef={anchorRef} width={320}>
            <div ref={ref} className="max-h-80 overflow-y-auto -m-1 p-1">
                {TIMEZONE_GROUPS.map((group) => (
                    <div key={group.label} className="mb-2 last:mb-0">
                        <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">{group.label}</p>
                        {group.options.map((opt) => {
                            const active = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onSelect(opt.value); onClose(); }}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors
                                        ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {active && (
                                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-b from-[rgba(38,186,88,1)] to-[rgba(52,213,106,1)] text-white shrink-0">
                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm4.7 7.3a1 1 0 00-1.4-1.4L11 12.18l-2.3-2.3a1 1 0 00-1.4 1.42l3 3a1 1 0 001.4 0l5-5z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </AnchoredPopover>
    );
}

/* ── TimezoneSelector ─────────────────────────────────────────────────────
   Full-width selectable cards instead of a dropdown. US zones (the common
   case) show up front; international zones live behind a collapsible toggle.
   Each card shows its live UTC offset (computed client-side to avoid SSR
   hydration drift). */
const US_TIMEZONES = TIMEZONE_GROUPS.find((g) => g.label === "United States")?.options ?? [];
const OTHER_TIMEZONES = TIMEZONE_GROUPS.find((g) => g.label === "Other")?.options ?? [];

function tzOffset(tz: string): string {
    try {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date());
        return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
        return "";
    }
}

export function TimezoneSelector({
    value,
    onSelect,
    disabled,
}: {
    value: string;
    onSelect: (tz: string) => void;
    disabled?: boolean;
}) {
    const [showOther, setShowOther] = useState(() => OTHER_TIMEZONES.some((o) => o.value === value));
    const [offsets, setOffsets] = useState<Record<string, string>>({});

    // Compute offsets after mount (client only) so server/client HTML match.
    useEffect(() => {
        const next: Record<string, string> = {};
        for (const opt of [...US_TIMEZONES, ...OTHER_TIMEZONES]) next[opt.value] = tzOffset(opt.value);
        setOffsets(next);
    }, []);

    function renderCard(opt: { value: string; label: string }) {
        const dash = opt.label.indexOf(" — ");
        const title = dash >= 0 ? opt.label.slice(0, dash) : opt.label;
        const cities = dash >= 0 ? opt.label.slice(dash + 3) : "";
        const active = opt.value === value;
        const offset = offsets[opt.value];
        return (
            <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(opt.value)}
                aria-pressed={active}
                className="group relative flex flex-col gap-1.5 text-left rounded-2xl p-3 sm:p-3.5 bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    border: active ? "2px solid transparent" : "2px solid rgba(212,222,231,1)",
                    backgroundImage: active
                        ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                        : undefined,
                    backgroundOrigin: active ? "border-box" : undefined,
                    backgroundClip: active ? "padding-box, border-box" : undefined,
                    boxShadow: active ? "0 10px 20px -12px rgba(2,104,192,0.5)" : undefined,
                }}
            >
                <div className="flex items-start justify-between gap-2 w-full">
                    <span className="font-bold text-[13px] sm:text-sm text-[rgba(0,48,96,1)] leading-snug">{title}</span>
                    {active ? (
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#0278DE,#0268c0)" }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        </span>
                    ) : (
                        <span className="shrink-0 w-5 h-5 rounded-full border-2 border-[rgba(212,222,231,1)] transition-colors group-hover:border-[rgba(2,104,192,0.45)]" />
                    )}
                </div>
                <div className="flex items-center gap-2 w-full min-h-[18px]">
                    {cities && <span className="text-[11px] sm:text-xs text-[rgba(87,114,141,1)] truncate">{cities}</span>}
                    {offset && (
                        <span className="ml-auto shrink-0 text-[10px] sm:text-[11px] font-bold text-[rgba(2,104,192,1)] bg-[rgba(2,104,192,0.08)] rounded-md px-1.5 py-0.5 tabular-nums">{offset}</span>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {US_TIMEZONES.map(renderCard)}
            </div>

            <div>
                <button
                    type="button"
                    onClick={() => setShowOther((s) => !s)}
                    className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[1px] text-[rgba(87,114,141,1)] hover:text-[rgba(2,104,192,1)] transition-colors"
                >
                    {showOther ? "Hide other regions" : "Other regions"}
                    <svg className={`w-3.5 h-3.5 transition-transform ${showOther ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {showOther && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mt-2.5">
                        {OTHER_TIMEZONES.map(renderCard)}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── StateSelect ───────────────────────────────────────────────────────────
   Custom, searchable US-state dropdown. Renders the list through a portal
   (AnchoredPopover) so it escapes the QuestionCard's overflow-hidden clip,
   and stores the 2-letter postal code (matching existing payout data). */
const US_STATES: [string, string][] = [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
    ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
    ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
    ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
    ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
    ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
    ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
    ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
    ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
    ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

export function StateSelect({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (code: string) => void;
    error?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const selected = US_STATES.find(([c]) => c === value);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`${error ? inputErrCls : inputCls} flex items-center justify-between gap-2 text-left cursor-pointer`}
            >
                <span className={`truncate ${value ? "" : "text-[rgba(126,138,150,1)]"}`}>
                    {selected ? selected[1] : "State"}
                </span>
                <ChevronIcon dir="down" className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#8f98a3] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <StatePopover
                    anchorRef={btnRef}
                    value={value}
                    onSelect={(code) => { onChange(code); setOpen(false); }}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

function StatePopover({
    anchorRef,
    value,
    onSelect,
    onClose,
}: {
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    value: string;
    onSelect: (code: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            const t = e.target as Node;
            if (ref.current && !ref.current.contains(t) && anchorRef.current && !anchorRef.current.contains(t)) onClose();
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [onClose, anchorRef]);

    const q = query.trim().toLowerCase();
    const filtered = q ? US_STATES.filter(([c, n]) => c.toLowerCase().includes(q) || n.toLowerCase().includes(q)) : US_STATES;

    return (
        <AnchoredPopover anchorRef={anchorRef} width={264}>
            <div ref={ref} className="-m-1">
                {/* Search */}
                <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search state…"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#d4dee7] bg-[#f8fafc] text-[14px] font-medium text-[#003060] outline-none transition-colors focus:border-[#0268c0] focus:bg-white placeholder:text-gray-400 placeholder:font-normal"
                    />
                </div>
                {/* List */}
                <div className="max-h-60 overflow-y-auto pr-0.5">
                    {filtered.length === 0 && (
                        <p className="px-2 py-5 text-center text-xs text-gray-400">No states found</p>
                    )}
                    {filtered.map(([code, name]) => {
                        const active = code === value;
                        return (
                            <button
                                key={code}
                                type="button"
                                onClick={() => onSelect(code)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[14px] font-medium transition-colors ${active ? "bg-blue-50 text-[#0268c0]" : "text-[#003060] hover:bg-gray-50"}`}
                            >
                                <span className="flex-1 truncate">{name}</span>
                                <span className={`text-[11px] font-bold shrink-0 ${active ? "text-[#0268c0]" : "text-gray-400"}`}>{code}</span>
                                {active && (
                                    <svg className="w-4 h-4 shrink-0 text-[#0268c0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </AnchoredPopover>
    );
}
