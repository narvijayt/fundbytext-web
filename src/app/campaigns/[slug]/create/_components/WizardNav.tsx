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
 * Layout: 6 equal inner blocks of 15% each, with 5% edge padding at both ends.
 * Steps 0 and 5 therefore occupy 20% of the bar (5% pad + 15% inner).
 * Steps 1–4 occupy 15% each.
 *
 * Circle centers (all 15% apart):
 *   START=12.5  DETAILS=27.5  GOAL=42.5  VISUALS=57.5  DONORS=72.5  FINISH=87.5
 *
 * Block right edges (fill targets):
 *   step 0→20%  1→35%  2→50%  3→65%  4→80%  5→100%
 */

/* Circle center for step num (equally spaced, 15% apart, starting at 12.5%) */
function circlePct(num: number): number {
    return 12.5 + num * 15;
}

/* Midpoint between the previous step's circle and the current step's circle —
   this sits inside the green fill zone, which is where the illustration belongs. */
function illustrationPct(step: number): number {
    return (circlePct(Math.max(0, step - 1)) + circlePct(step)) / 2;
}

/* Fill to the right edge of the active step's block (100% of current block). */
function fillPct(step: number): number {
    if (step === 5) return 100;
    return 20 + step * 15;
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

        const showBigFinishFlag = isFinish;
        const flagSrc = showBigFinishFlag
            ? "/assets/campaigns/finish-flag-inactive.svg"
            : isPast
                ? "/assets/campaigns/flag-active.svg"
                : "/assets/campaigns/flag-inactive.svg";

        return {
            num,
            label,
            isDone,
            isCurrent,
            isPast,
            isFinish,
            flagSrc,
            flagW: showBigFinishFlag ? 65 : 23,
            flagH: showBigFinishFlag ? 68 : 22,
            clickable: num > 0 && num <= maxStep && !isCurrent,
            centerPct: circlePct(num),
        };
    });

    const FLAG_ZONE = 46;
    const BAR_H = 32;

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
                {stepMeta.map(({ num, isPast, isFinish, flagSrc, flagW, flagH, centerPct }) => (
                    <div
                        key={num}
                        className="absolute bottom-0"
                        style={
                            isFinish
                                ? { right: `${100 - centerPct}%`, transform: "translateX(50%)" }
                                : { left: `${centerPct}%`, transform: "translateX(-50%)" }
                        }
                    >
                        <Image
                            src={flagSrc}
                            width={flagW}
                            height={flagH}
                            alt=""
                            style={{ opacity: isPast ? 1 : 0.35, ...(isFinish ? { marginRight: '39px' } : { marginLeft: '18px' }) }}
                        />
                    </div>
                ))}

                {/* Active-step illustration — centered in the middle of that step's colored
                    bar segment (between its circle and the next), so it doesn't sit on top
                    of the flag, which is anchored at the circle itself. */}
                {STEP_ILLUSTRATIONS[step] && (
                    <div
                        className="absolute bottom-3"
                        style={{ left: `${illustrationPct(step)}%`, transform: "translateX(-50%)" }}
                    >
                        <Image
                            src={STEP_ILLUSTRATIONS[step]}
                            width={32}
                            height={32}
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
                {stepMeta.map(({ num, label, isDone, isCurrent, isPast, isFinish, clickable, centerPct }) => {
                    const circle = (
                        <div
                            className="flex items-center justify-center rounded-full bg-white shrink-0 font-bold transition-all duration-300"
                            style={{
                                width: 17, height: 17, fontSize: 10,
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
                            className="uppercase font-black tracking-[1px] leading-none text-[10px] md:text-[12px] whitespace-nowrap"
                            style={{ color: isPast ? "white" : "#9ca3af" }}
                        >
                            {label}
                        </span>
                    );

                    /* Anchor the GROUP's left edge ~half the circle's width left of centerPct,
                       so the circle's own center — not the group's — lands on centerPct.
                       For the Finish step, mirror this from the right edge instead, with the
                       label trailing before (to the left of) the circle — this makes the
                       Finish step's buffer space (circle-edge → bar end) exactly equal to the
                       Start step's buffer space (bar start → circle-edge). */
                    const groupStyle = isFinish
                        ? { right: `${100 - centerPct}%`, transform: "translateX(8.5px)" } as const
                        : { left: `${centerPct}%`, transform: "translateX(-8.5px)" } as const;

                    const content = isFinish ? <>{labelEl}{circle}</> : <>{circle}{labelEl}</>;

                    return clickable ? (
                        <button
                            key={num}
                            type="button"
                            onClick={() => onStepClick?.(num)}
                            className="absolute top-0 h-full flex items-center gap-1.25 focus:outline-none"
                            style={groupStyle}
                            title={`Go to ${label}`}
                        >
                            {content}
                        </button>
                    ) : (
                        <div key={num} className="absolute top-0 h-full flex items-center gap-1.25" style={groupStyle}>
                            {content}
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

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <button
                    type="button"
                    onClick={onExit}
                    disabled={busy}
                    className="flex items-center gap-3 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: "rgba(0,64,149,1)" }}
                >
                    <span className="text-base leading-none">✕</span>
                    <span className="w-px h-4 bg-current opacity-30 shrink-0" />
                    <span>Exit and Save Progress</span>
                </button>

                <div className="flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={busy}
                            className="flex items-center justify-center transition-colors disabled:opacity-50"
                            style={{
                                width: 114,
                                height: 42,
                                background: "transparent",
                                fontFamily: "var(--font-satoshi, 'Satoshi Variable', sans-serif)",
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
                                paddingTop: 12,
                                paddingRight: 16,
                                paddingBottom: 14,
                                paddingLeft: 16,
                                gap: 8,
                                background: "rgba(2, 104, 192, 1)",
                                fontFamily: "var(--font-satoshi, 'Satoshi Variable', sans-serif)",
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
