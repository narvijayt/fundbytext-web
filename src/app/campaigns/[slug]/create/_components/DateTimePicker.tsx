"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [onClose]);

    const numDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first
    const cells: (number | null)[] = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: numDays }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const todayStr = new Date().toISOString().slice(0, 10);
    const minDt = minDate ? new Date(minDate + "T00:00") : null;

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
            {/* Month / year header + nav */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
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
            </div>

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
        </div>
        </AnchoredPopover>
    );
}

/* ── TimePopover ───────────────────────────────────────────────────────── */
function wrap(value: number, min: number, max: number): number {
    const span = max - min + 1;
    return ((value - min) % span + span) % span + min;
}

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
    const [hour, setHour] = useState(h24 % 12 || 12);
    const [minute, setMinute] = useState(m);
    const [ampm, setAmpm] = useState<"AM" | "PM">(h24 >= 12 ? "PM" : "AM");

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

    const spinBtnCls = "w-7 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors";

    return (
        <AnchoredPopover anchorRef={anchorRef} width={256}>
        <div ref={ref}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Select Time</p>

            <div className="flex items-center justify-center gap-2 mb-4">
                {/* Hour spinner */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" className={spinBtnCls} onClick={() => setHour((h) => wrap(h + 1, 1, 12))}>
                        <ChevronIcon dir="up" className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-blue-50 text-2xl font-black text-blue-700 tabular-nums">
                        {pad2(hour)}
                    </div>
                    <button type="button" className={spinBtnCls} onClick={() => setHour((h) => wrap(h - 1, 1, 12))}>
                        <ChevronIcon dir="down" className="w-3.5 h-3.5" />
                    </button>
                </div>

                <span className="text-2xl font-black text-gray-300 -mt-4">:</span>

                {/* Minute spinner */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" className={spinBtnCls} onClick={() => setMinute((mi) => wrap(mi + 5, 0, 59))}>
                        <ChevronIcon dir="up" className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-2xl font-black text-gray-700 tabular-nums">
                        {pad2(minute)}
                    </div>
                    <button type="button" className={spinBtnCls} onClick={() => setMinute((mi) => wrap(mi - 5, 0, 59))}>
                        <ChevronIcon dir="down" className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* AM / PM toggle */}
                <div className="flex flex-col gap-1 ml-1 -mt-4">
                    <button
                        type="button"
                        onClick={() => setAmpm("AM")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${ampm === "AM" ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-100"}`}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmpm("PM")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${ampm === "PM" ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-100"}`}
                    >
                        PM
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 text-xs font-bold tracking-wide">
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
