"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { STEPS } from "./types";

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
    toast,
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
    toast: string | null;
    uploadingPhoto: string | null;
    isLaunched: boolean;
    onBack: () => void;
    onNext: () => void;
    onLaunch: () => void;
    onExit: () => void;
}) {
    const isLastStep = step === 5;
    const busy = saving || launching || uploadingPhoto !== null;

    return (
        <>
            {toast && (
                <div className="fixed bottom-20 right-6 z-100 flex items-start gap-3 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-xs">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                    </svg>
                    <span>{toast}</span>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-[rgba(234,238,243,1)] px-4 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <button
                    type="button"
                    onClick={onExit}
                    disabled={busy}
                    className="flex items-center gap-3 transition-opacity hover:opacity-70 disabled:opacity-40 text-[rgba(0,48,96,1)] md:rounded-xl md:pt-3 md:pr-0.5 md:pb-3.5 md:pl-0.5"
                >
                    <Image src="/assets/campaigns/exit.svg" width={18} height={18} alt="" />
                    <span className="w-px h-5 bg-[rgba(212,222,231,1)] shrink-0" />
                    <span className="hidden md:inline text-base font-medium leading-[1.4]">Exit and Save Progress</span>
                </button>

                <div className="flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={busy}
                            className="flex items-center justify-center transition-colors disabled:opacity-50 rounded-xl border border-[rgba(212,222,231,1)]"
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
                                className="flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-60"
                                style={{ background: "rgba(0,64,149,1)" }}
                            >
                                {launching ? "Launching…" : "Launch"}
                                {!launching && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                )}
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={busy}
                            className="flex items-center justify-center transition-colors disabled:opacity-60"
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
                            {saving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Saving…
                                </>
                            ) : (
                                "Next"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
