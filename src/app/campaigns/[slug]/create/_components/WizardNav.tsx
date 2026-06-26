"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { STEPS } from "./types";
import { Loader } from "./ui";

/* ── Launch rocket icon (Figma stick-rocket, white strokes) ──────────── */
function RocketIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 21 27.5254" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5.51002 18.0407L1.06486 15.589C2.8355 12.1963 6.31486 11.3791 9.00177 12.1221" />
            <path d="M9.49705 22.0153L11.9487 26.4605C15.329 24.6899 16.1586 21.2105 15.4157 18.5236" />
            <path d="M5.52241 18.0283L5.55955 18.0531C7.16922 19.0436 8.51887 20.4057 9.50943 22.0153C12.704 20.1085 16.3196 18.2512 17.9788 16.5425C21.5572 12.964 19.477 8.06073 19.477 8.06073C19.477 8.06073 14.5737 5.98054 10.9953 9.55896C9.28656 11.2182 7.41686 14.8585 5.52241 18.0283Z" />
            <path d="M5.69575 25.3585C5.23762 25.8042 4.03656 26.2129 2.88502 26.5348C1.70873 26.8567 0.65625 25.8166 0.990566 24.6403C1.3125 23.5012 1.72111 22.2877 2.16686 21.8296C2.38974 21.582 2.67453 21.3838 2.9717 21.2476C3.28125 21.1114 3.60318 21.0371 3.9375 21.0371C4.27182 21.0371 4.60613 21.0991 4.91568 21.2229C5.22524 21.3467 5.51002 21.5324 5.74528 21.7677C5.98054 22.003 6.16627 22.2877 6.29009 22.5973C6.41391 22.9068 6.47583 23.2412 6.47583 23.5755C6.47583 23.9098 6.40153 24.2441 6.26533 24.5413C6.12913 24.8508 5.93101 25.1232 5.68337 25.3461L5.69575 25.3585Z" />
            <path d="M11.763 16.5796L13.1374 13.0755L9.01415 12.1097L9.1875 5.90625" />
            <path d="M9.21226 5.90625C10.5868 5.90625 11.7011 4.79198 11.7011 3.41745C11.7011 2.04293 10.5868 0.928656 9.21226 0.928656C7.83774 0.928656 6.72347 2.04293 6.72347 3.41745C6.72347 4.79198 7.83774 5.90625 9.21226 5.90625Z" />
            <path d="M9.06368 8.86557L4.50708 7.33019" />
        </svg>
    );
}

/* ── Step illustrations ──────────────────────────────────────────────── */
const STEP_ILLUSTRATIONS: Record<number, string> = {
    1: "/assets/campaigns/fundbuddy-campaign-details-illustration.svg",
    2: "/assets/campaigns/fundbuddy-funding-goal-illustration.svg",
    3: "/assets/campaigns/fundbuddy-campaign-visuals-illustration.svg",
    4: "/assets/campaigns/fundbuddy-add-donor-participant-illustration.svg",
    5: "/assets/campaigns/fundbuddy-thankyou-illustration.svg",
};

/*
 * Single-row layout: 7 cells total — a 5%-wide empty spacer at the start,
 * plus 6 equal step cells (0=Start … 5=Finish) filling the rest.
 *   5 + (95/6)*6 = 100
 *
 * Every step's flag/circle/label anchors to the LEFT edge of its own cell —
 * no per-step special-casing needed. The spacer cell is what creates the
 * buffer space before Start's circle; Finish's cell runs to the right edge.
 */
const SPACER_WIDTH = 5;       // percent, empty cell at the start (md+ layout)
const STEP_WIDTH = 95 / 6;    // percent, each of the 6 step cells (md+ layout)

/* Below 1024px, cells use fixed px widths instead of percentages, so the row
   is wider than the viewport and becomes horizontally scrollable. The spacer
   stays fixed; the step width (`mobileStepPx`, computed per-render below)
   maxes out at 229px, but in practice clamps to its 160px floor across this
   whole range — keeping at least two step cells visible at once. */
const MOBILE_SPACER_PX = 76;
const MOBILE_STEP_PX_MAX = 229;
const MOBILE_STEP_PX_MIN = 160;

/* Per-step illustration size + horizontal offset, in px. Each illustration is
   centered horizontally within its own cell, then nudged by `left` (+ = right).
   Vertically, every illustration sits flush above the green progress bar with
   a small `ILLUSTRATION_GAP` — see below. */
const ILLUSTRATION_LAYOUT: Record<number, { width: number; height: number; left: number }> = {
    1: { width: 41.454952239990234, height: 40.00033187866211, left: 0 },
    2: { width: 50, height: 38, left: 0 },
    3: { width: 85.69440460205078, height: 69.21980285644531, left: 0 },
    4: { width: 150.55386352539062, height: 44.000118255615234, left: 0 },
    5: { width: 109.7, height: 46, left: 25 },
};

/* Vertical gap between the bottom of the illustration and the top of the
   green progress bar — keeps illustrations from touching the bar. */
const ILLUSTRATION_GAP = 6;

/* Widest illustration (step 4) at scale 1, used as the reference for scaling
   illustrations down to fit narrower step cells. */
const WIDEST_ILLUSTRATION_WIDTH = ILLUSTRATION_LAYOUT[4].width;

/* Minimum horizontal margin (px, total across both sides) to leave between
   an illustration and the edges of its step cell. */
const ILLUSTRATION_MARGIN = 36;

/* Fill to the right edge of the active step's cell (100% of current cell). */
function fillPct(step: number): number {
    if (step === 5) return 100;
    return SPACER_WIDTH + (step + 1) * STEP_WIDTH;
}

export function ProgressBar({
    step,
    maxStep,
    isOrg,
    onStepClick,
}: {
    step: number;
    maxStep: number;
    isOrg: boolean;
    onStepClick?: (num: number) => void;
}) {
    const allSteps = [
        { num: 0, label: "Start" },
        ...STEPS.map((s) => ({
            num: s.num,
            label: s.num === 4 ? (isOrg ? "Participants" : "Donors") : s.label,
        })),
    ];
    const LAST = allSteps.length - 1; // 5
    const barFillPct = fillPct(step);

    const BAR_H = 32;

    /* White zone above the green bar reserved for flags/circles/illustrations.
       Below 1024px the row uses overflow-x:auto for horizontal scrolling,
       which (per the CSS overflow spec) also forces overflow-y to auto —
       clipping anything that pokes above the row's own box (the finish flag,
       the step-3 illustration). Give the row a tall-enough zone (76px) there
       so nothing pokes/clips, then pull the whole row up by the difference
       (30px) via negative margin so it overlaps the empty lower portion of
       the header instead of leaving a visible gap. */
    const [viewportWidth, setViewportWidth] = useState(1024);
    const isMobile = viewportWidth < 1024;
    const FLAG_ZONE = isMobile ? 76 : 46;

    /* Step cell width on mobile: sized so the row's total width
       (76 + stepPx*6) matches the viewport exactly whenever possible — no
       scrolling on screens that are already wide enough. Capped at 229px (so
       the row never exceeds the 1450px breakpoint's width) and floored at
       160px on narrow phones, where two step cells still fit in view. */
    const mobileStepPx = Math.min(MOBILE_STEP_PX_MAX, Math.max(MOBILE_STEP_PX_MIN, (viewportWidth - MOBILE_SPACER_PX) / 6));

    /* Illustrations are sized for the widest step cell (229px). Scale them
       down to fit the current cell width with a small margin on each side,
       so they never overlap into the neighboring cell's flag. */
    const illScale = Math.min(1, Math.max(0.4, (mobileStepPx - ILLUSTRATION_MARGIN) / WIDEST_ILLUSTRATION_WIDTH));

    useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    /* Below md, the row is wider than the viewport (fixed px cells) and
       scrollable. Keep the active step pinned to the left edge — re-run on
       resize so it re-aligns (with animation) as the viewport changes. */
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        // Leave a small margin so the active step's circle/flag (which are
        // centered ON the cell's left edge) aren't clipped by the viewport edge.
        const target = MOBILE_SPACER_PX + step * mobileStepPx - 14;
        el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }, [step, mobileStepPx]);

    const stepMeta = allSteps.map(({ num, label }) => {
        const isCurrent = num === step;
        const isPast = num <= step;
        const isFinish = num === LAST;

        const showBigFinishFlag = isFinish;
        const flagSrc = showBigFinishFlag
            ? (isCurrent ? "/assets/campaigns/finish-active.svg" : "/assets/campaigns/finish-flag-inactive.svg")
            : isPast
                ? "/assets/campaigns/flag-active.svg"
                : "/assets/campaigns/flag-inactive.svg";

        return {
            num,
            label,
            isCurrent,
            isPast,
            isFinish,
            flagSrc,
            flagW: showBigFinishFlag ? (isCurrent ? 68 : 65) : 23,
            flagH: showBigFinishFlag ? (isCurrent ? 71 : 68) : 22,
            clickable: num > 0 && num <= maxStep && !isCurrent,
        };
    });

    /* Below 1024px the row uses fixed px cells (wider than the viewport,
       horizontally scrollable); at/above 1024px it uses percentage cells
       spanning the full width. Computed in JS (rather than a CSS media
       query) since `isMobile` is already tracked via `viewportWidth`. */
    const spacerFlex = isMobile ? `0 0 ${MOBILE_SPACER_PX}px` : `0 0 ${SPACER_WIDTH}%`;
    const stepFlex = isMobile ? `0 0 ${mobileStepPx}px` : `0 0 ${STEP_WIDTH}%`;
    const rowWidth = isMobile ? `calc(${MOBILE_SPACER_PX}px + ${mobileStepPx}px * 6)` : "100%";

    return (
        <div
            ref={scrollRef}
            className="no-scrollbar"
            style={{ overflowX: isMobile ? "auto" : "visible", marginTop: isMobile ? -30 : 0 }}
        >
            <div className="select-none relative" style={{ height: FLAG_ZONE + BAR_H, width: rowWidth }}>
                {/* Green bar underlay */}
                <div
                    className="absolute left-0 right-0 overflow-hidden"
                    style={{ bottom: 0, height: BAR_H, zIndex: 0 }}
                >
                    <div className="absolute inset-0 bg-gray-200" />
                    <div
                        className="absolute top-0 left-0 h-full transition-all duration-700 ease-in-out"
                        style={{
                            width: barFillPct >= 100 ? "100%" : `calc(${barFillPct}% - 14px)`,
                            background: "linear-gradient(90deg, rgba(38,186,88,1) 0%, rgba(52,213,106,1) 100%)",
                            borderRadius: barFillPct >= 100 ? 0 : "0 50px 50px 0",
                            minWidth: step > 0 ? 40 : 0,
                        }}
                    />
                </div>

                {/* 8-cell row: spacer | 6 step cells | spacer. Each step cell holds its own
                flag (above) and circle+label (below), both anchored to the cell's left edge. */}
                <div className="absolute inset-0 flex" style={{ zIndex: 1 }}>
                    {/* left spacer */}
                    <div style={{ flex: spacerFlex }} />

                    {stepMeta.map(({ num, label, isCurrent, isPast, isFinish, flagSrc, flagW, flagH, clickable }) => {
                        const circle = (
                            <div
                                className="flex items-center justify-center rounded-full shrink-0 font-black uppercase tracking-[1px] leading-none transition-all duration-300"
                                style={{
                                    width: 20, height: 20, fontSize: 12,
                                    background: isPast ? "rgba(255,255,255,1)" : "rgba(212,222,231,1)",
                                    color: isPast ? "rgba(40,196,93,1)" : "rgba(255,255,255,1)",
                                }}
                            >
                                {num === 0 ? (
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPast ? "rgba(40,196,93,1)" : "rgba(255,255,255,1)" }} />
                                ) : num}
                            </div>
                        );

                        const labelEl = (
                            <span
                                className="uppercase font-black tracking-[1px] leading-none text-[10.8px] whitespace-nowrap"
                                style={{ color: isPast ? "rgba(255,255,255,1)" : "rgba(212,222,231,1)" }}
                            >
                                {label}
                            </span>
                        );

                        /* Anchor both the flag and the circle+label group to the cell's left edge.
                           translateX(-10px) on the group centers the circle (20px, radius 10px)
                           on the cell's left boundary; the label trails to its right. */
                        const groupStyle = { left: 0, transform: "translateX(-10px)" } as const;
                        const flagStyle = { left: 0, transform: "translateX(-50%)" } as const;
                        const content = <>{circle}{labelEl}</>;

                        return (
                            <div key={num} className="relative" style={{ flex: stepFlex }}>
                                {/* Active-step illustration — horizontally centered in this cell,
                                sitting flush above the green bar with a small gap, nudged
                                sideways per-step by `left` */}
                                {isCurrent && STEP_ILLUSTRATIONS[num] && ILLUSTRATION_LAYOUT[num] && (
                                    <div
                                        className="absolute"
                                        style={{
                                            left: "50%",
                                            bottom: BAR_H + ILLUSTRATION_GAP,
                                            width: ILLUSTRATION_LAYOUT[num].width,
                                            height: ILLUSTRATION_LAYOUT[num].height,
                                            transform: `translate(calc(-50% + ${ILLUSTRATION_LAYOUT[num].left}px), 0) scale(${illScale})`,
                                            transformOrigin: "bottom center",
                                            zIndex: 2,
                                        }}
                                    >
                                        <Image
                                            src={STEP_ILLUSTRATIONS[num]}
                                            width={ILLUSTRATION_LAYOUT[num].width}
                                            height={ILLUSTRATION_LAYOUT[num].height}
                                            alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                    </div>
                                )}

                                {/* Flag — pole extends down through the circle's center, so the
                                flag reads as "planted" at the circle rather than floating
                                above it with a gap. */}
                                <div className="absolute" style={{ bottom: BAR_H / (isFinish ? 1 : 1.03), zIndex: 1, ...flagStyle }}>
                                    <Image
                                        src={flagSrc}
                                        width={flagW}
                                        height={flagH}
                                        alt=""
                                        style={{ opacity: isPast ? 1 : 0.35, marginLeft: isFinish ? (isCurrent ? 65 : 60) : 18 }}
                                    />
                                </div>

                                {/* Circle + label */}
                                {clickable ? (
                                    <button
                                        type="button"
                                        onClick={() => onStepClick?.(num)}
                                        className="absolute flex items-center gap-1.25 focus:outline-none"
                                        style={{ bottom: 0, height: BAR_H, ...groupStyle }}
                                        title={`Go to ${label}`}
                                    >
                                        {content}
                                    </button>
                                ) : (
                                    <div className="absolute flex items-center gap-1.25" style={{ bottom: 0, height: BAR_H, ...groupStyle }}>
                                        {content}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Bottom navigation bar ───────────────────────────────────────────── */
export function BottomNav({
    step,
    saving,
    launching,
    exiting = false,
    uploadingPhoto,
    isLaunched,
    onBack,
    onNext,
    onLaunch,
    onExit,
}: {
    step: number;
    saving: boolean;
    launching: boolean;
    exiting?: boolean;
    uploadingPhoto: string | null;
    isLaunched: boolean;
    onBack: () => void;
    onNext: () => void;
    onLaunch: () => void;
    onExit: () => void;
}) {
    const isLastStep = step === 5;
    const busy = saving || launching || exiting || uploadingPhoto !== null;

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-[rgba(234,238,243,1)] px-4 md:px-10 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <button
                    type="button"
                    onClick={onExit}
                    disabled={busy}
                    className={`flex items-center gap-3 transition-opacity text-[rgba(0,48,96,1)] rounded-xl px-0.5 pt-3 pb-3.5 ${exiting ? "cursor-wait" : "hover:opacity-70 disabled:opacity-40"}`}
                >
                    {exiting ? (
                        <Loader className="w-[18px] h-[18px] shrink-0" />
                    ) : (
                        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                            <path d="M5 5l14 14M19 5L5 19" />
                        </svg>
                    )}
                    <span className="w-px h-5 bg-[rgba(212,222,231,1)] shrink-0" />
                    <span className="hidden md:inline text-base font-medium leading-[1.4]">{exiting ? "Saving Progress…" : "Exit and Save Progress"}</span>
                </button>

                <div className="flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={busy}
                            className="flex items-center justify-center transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 rounded-xl border border-[rgba(212,222,231,1)]"
                            style={{
                                width: 114,
                                height: 42,
                                background: "transparent",
                                fontFamily: "var(--font-sans)",
                                fontWeight: 500,
                                fontSize: 16,
                                lineHeight: "100%",
                                letterSpacing: "0.15px",
                                color: "rgba(0, 48, 96, 1)",
                            }}
                        >
                            Previous
                        </button>
                    )}

                    {isLastStep ? (
                        !isLaunched && (
                            <button
                                type="button"
                                onClick={onLaunch}
                                disabled={busy}
                                className="flex items-center justify-center gap-2 rounded-xl px-[18px] text-white transition hover:brightness-105 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100"
                                style={{ height: 48, background: "linear-gradient(76.24deg, #26BA58 1.19%, #34D56A 98.81%)" }}
                            >
                                {launching ? (
                                    <Loader className="w-5 h-5" light />
                                ) : (
                                    <>
                                        <span className="text-[16px] font-bold leading-[1.25]">Launch</span>
                                        <RocketIcon className="w-[19px] h-[25px]" />
                                    </>
                                )}
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={busy}
                            className="flex items-center justify-center transition active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100"
                            style={{
                                width: 114,
                                height: 42,
                                borderRadius: 12,
                                paddingLeft: 16,
                                paddingRight: 16,
                                gap: 8,
                                background: "rgba(2, 104, 192, 1)",
                                fontFamily: "var(--font-sans)",
                                fontWeight: 500,
                                fontSize: 16,
                                lineHeight: "100%",
                                letterSpacing: "0.15px",
                                color: "rgba(255, 255, 255, 1)",
                            }}
                        >
                            {saving ? <Loader className="w-5 h-5" light /> : "Next"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
