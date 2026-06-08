"use client";

import Image from "next/image";
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
 * Flex proportions per box:
 *   START (0) and FINISH (5) → flex 1.5  (wider end boxes)
 *   Steps 1-4               → flex 1
 *   Total                   → 7
 *
 * Circle center % = cumulative flex / total × 100
 *   START=10.71  DETAILS=28.57  GOAL=42.86  VISUALS=57.14  DONORS=71.43  FINISH=89.29
 */
const FLEX_RATIO = [1.5, 1, 1, 1, 1, 1.5];
const TOTAL_FLEX = 7;

/* % position where a step's block starts (left edge) */
function blockStartPct(num: number): number {
    let left = 0;
    for (let i = 0; i < num; i++) left += FLEX_RATIO[i];
    return (left / TOTAL_FLEX) * 100;
}

/* % width of a step's block */
function blockWidthPct(num: number): number {
    return (FLEX_RATIO[num] / TOTAL_FLEX) * 100;
}

function circlePct(num: number): number {
    return blockStartPct(num) + blockWidthPct(num) / 2;
}

/* Center of the *colored bar segment* owned by a step — i.e. the midpoint
   between this step's circle and the next one's (or the bar's right edge,
   for the last step). This is where the active-step illustration sits —
   distinct from circlePct, which is where the flag/circle/label anchor. */
function blockCenterPct(num: number, isLast: boolean): number {
    const start = circlePct(num);
    const end   = isLast ? 100 : circlePct(num + 1);
    return (start + end) / 2;
}

/* Fill lands 90% of the way through the current step's "block" — the same
   circle-to-circle segment used by blockCenterPct (current circle to the
   next one's, or the bar's right edge for the last step). Reads as "in
   progress on this step, almost to the next" rather than stopping short. */
function fillPct(step: number): number {
    const start = circlePct(step);
    const end   = step === 5 ? 100 : circlePct(step + 1);
    return start + (end - start) * 0.9;
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

    /* Per-step display data, computed once and shared by the flag layer and the circle row */
    const stepMeta = allSteps.map(({ num, label }) => {
        const isDone = num < step;
        const isCurrent = num === step;
        const isPast = isDone || isCurrent;
        const isFinish = num === LAST;

        const flagSrc = isPast
            ? "/assets/campaigns/flag-active.svg"
            : isFinish
                ? "/assets/campaigns/finish-flag-inactive.svg"
                : "/assets/campaigns/flag-inactive.svg";

        return {
            num,
            label,
            isDone,
            isCurrent,
            isPast,
            isFinish,
            flagSrc,
            flagW: (isFinish && !isPast) ? 28 : 20,
            flagH: (isFinish && !isPast) ? 40 : 34,
            clickable: num > 0 && num <= maxStep && !isCurrent,
            centerPct: circlePct(num),
        };
    });

    const FLAG_ZONE = 54;
    const BAR_H = 40;

    return (
        /*
         * Fully layered layout (position relative/absolute): every flag,
         * the active-step illustration, and every circle is anchored at
         * the exact same X — circlePct(num) — so they all line up.
         *
         * Flex columns can't guarantee this: a circle grouped inline with
         * its (variable-width) label isn't centered in its column — the
         * group is, which shifts the circle left by ~half the label's
         * width. Anchoring the circle directly (label trailing after it,
         * free to overflow) keeps the circle's center fixed regardless of
         * label length.
         */
        <div className="w-full select-none relative" style={{ height: FLAG_ZONE + BAR_H }}>

            {/* Flags — each centered directly above its own circle (anchored at circlePct) */}
            <div className="absolute left-0 right-0" style={{ bottom: BAR_H, height: FLAG_ZONE, zIndex: 1 }}>
                {stepMeta.map(({ num, isPast, flagSrc, flagW, flagH, centerPct }) => (
                    <div
                        key={num}
                        className="absolute bottom-0"
                        style={{ left: `${centerPct}%`, transform: "translateX(-50%)" }}
                    >
                        <Image
                            src={flagSrc}
                            width={flagW}
                            height={flagH}
                            alt=""
                            style={{ opacity: isPast ? 1 : 0.35 }}
                            className="ml-4"
                        />
                    </div>
                ))}

                {/* Active-step illustration — centered in the middle of that step's colored
                    bar segment (between its circle and the next), so it doesn't sit on top
                    of the flag, which is anchored at the circle itself. */}
                {STEP_ILLUSTRATIONS[step] && (
                    <div
                        className="absolute bottom-0"
                        style={{ left: `${blockCenterPct(step, step === LAST)}%`, transform: "translateX(-50%)" }}
                    >
                        <Image
                            src={STEP_ILLUSTRATIONS[step]}
                            width={40}
                            height={40}
                            alt=""
                            style={{ objectFit: "contain" }}
                        />
                    </div>
                )}
            </div>

            {/* Green bar underlay */}
            <div
                className="absolute left-0 right-0 overflow-hidden"
                style={{ bottom: 0, height: BAR_H, zIndex: 0 }}
            >
                <div className="absolute inset-0 bg-gray-200" />
                <div
                    className="absolute top-0 left-0 h-full transition-all duration-700 ease-in-out"
                    style={{
                        width: `${barFillPct}%`,
                        background: "linear-gradient(90deg, rgba(38,186,88,1) 0%, rgba(52,213,106,1) 100%)",
                        borderRadius: "0 50px 50px 0",
                        minWidth: step > 0 ? 40 : 0,
                    }}
                />
            </div>

            {/* Circles + labels — circle's own center anchored at circlePct(num); label trails after, free to overflow */}
            <div className="absolute left-0 right-0" style={{ bottom: 0, height: BAR_H, zIndex: 1 }}>
                {stepMeta.map(({ num, label, isDone, isCurrent, isPast, clickable, centerPct }) => {
                    const circle = (
                        <div
                            className="flex items-center justify-center rounded-full bg-white shrink-0 font-bold transition-all duration-300"
                            style={{
                                width: 20, height: 20, fontSize: 11,
                                color: isPast ? "rgba(38,186,88,1)" : "#9ca3af",
                                boxShadow: isCurrent
                                    ? "0 0 0 3px rgba(38,186,88,1), 0 0 12px 3px rgba(38,186,88,0.5)"
                                    : "none",
                            }}
                        >
                            {isDone ? (
                                <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5l3 3 7-7" stroke="rgba(38,186,88,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : num === 0 ? (
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPast ? "rgba(38,186,88,1)" : "#d1d5db" }} />
                            ) : num}
                        </div>
                    );

                    const labelEl = (
                        <span
                            className="uppercase font-bold tracking-wide text-[9px] sm:text-[10px] whitespace-nowrap"
                            style={{ color: isPast ? "white" : "#9ca3af" }}
                        >
                            {label}
                        </span>
                    );

                    /* Anchor the GROUP's left edge 10px (half the circle's width) left of centerPct,
                       so the circle's own center — not the group's — lands on centerPct. */
                    const groupStyle = { left: `${centerPct}%`, transform: "translateX(-10px)" } as const;

                    return clickable ? (
                        <button
                            key={num}
                            type="button"
                            onClick={() => onStepClick?.(num)}
                            className="absolute top-0 h-full flex items-center gap-1.25 focus:outline-none"
                            style={groupStyle}
                            title={`Go to ${label}`}
                        >
                            {circle}{labelEl}
                        </button>
                    ) : (
                        <div key={num} className="absolute top-0 h-full flex items-center gap-1.25" style={groupStyle}>
                            {circle}{labelEl}
                        </div>
                    );
                })}
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

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shadow-lg">
                <button
                    type="button"
                    onClick={onExit}
                    disabled={busy}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                    <span className="w-5 h-5 flex items-center justify-center rounded border border-gray-300 text-gray-400 text-[10px] font-bold shrink-0">✕</span>
                    <span>Exit and Save Progress</span>
                </button>

                <div className="flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={busy}
                            className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
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
                                className="flex items-center gap-2 px-7 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
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
                            className="flex items-center gap-2 px-7 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
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
                                <>
                                    Next
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
