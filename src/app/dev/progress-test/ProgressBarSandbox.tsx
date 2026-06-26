"use client";

/*
 * ── SANDBOX COPY ─────────────────────────────────────────────────────────
 * Throwaway copy of `ProgressBar` from
 * `src/app/campaigns/[slug]/create/_components/WizardNav.tsx`, for visual
 * tweaking in isolation. Edit freely — none of this affects the real wizard.
 * Once a layout is confirmed, the equivalent changes get ported back into
 * WizardNav.tsx by hand.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const STEPS = [
    { num: 1, label: "Details" },
    { num: 2, label: "Funding Goal" },
    { num: 3, label: "Visuals" },
    { num: 4, label: "Participants" },
    { num: 5, label: "Finish" },
];

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

/* Below 1450px, cells use fixed px widths instead of percentages, so the row
   is wider than the viewport and becomes horizontally scrollable. The spacer
   stays fixed; the step width (`mobileStepPx`, computed per-render below)
   maxes out at 229px — chosen so 76 + 229*6 = 1450px, matching the
   percentage layout's breakpoint exactly with no leftover empty gap just
   below 1450px — but shrinks on narrow phones so at least two step cells
   stay visible at once. */
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

export function ProgressBarSandbox({
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

    /* Below md, the row switches to fixed px cells (overflow-x: auto), which
       per the CSS overflow spec also makes overflow-y compute to "auto" —
       so anything sticking out above the row's top edge (negative `top`
       offsets, the tall finish-active flag) gets clipped. Use a taller
       white flag zone on mobile to give those elements room. */
    const [viewportWidth, setViewportWidth] = useState(1024);
    const isMobile = viewportWidth < 1450;
    const FLAG_ZONE = isMobile ? 76 : 46;

    /* Step cell width on mobile: sized so the row's total width
       (76 + stepPx*6) matches the viewport exactly whenever possible — no
       scrolling on screens that are already wide enough. Capped at 229px (so
       the row never exceeds the 1450px breakpoint's width) and floored at
       140px on narrow phones, where two step cells still fit in view. */
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

    return (
        <div ref={scrollRef} className="fb-scroll no-scrollbar">
            <div className="fb-row select-none relative" style={{ height: FLAG_ZONE + BAR_H }}>
                <style jsx global>{`
                .fb-scroll {
                    overflow-x: auto;
                }
                .fb-row {
                    width: calc(${MOBILE_SPACER_PX}px + ${mobileStepPx}px * 6);
                }
                .fb-spacer {
                    flex: 0 0 ${MOBILE_SPACER_PX}px;
                }
                .fb-step {
                    flex: 0 0 ${mobileStepPx}px;
                }
                @media (min-width: 1450px) {
                    .fb-scroll {
                        overflow-x: visible;
                    }
                    .fb-row {
                        width: 100%;
                    }
                    .fb-spacer {
                        flex: 0 0 ${SPACER_WIDTH}%;
                    }
                    .fb-step {
                        flex: 0 0 ${STEP_WIDTH}%;
                    }
                }
            `}</style>

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
                    <div className="fb-spacer" />

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
                                className="uppercase font-black tracking-[1px] leading-none text-[12px] whitespace-nowrap"
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
                            <div key={num} className="fb-step relative">
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
                                <div className="absolute" style={{ bottom: BAR_H / (isFinish ? 1 : 1.03), ...flagStyle }}>
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
