"use client";

import { useStagedFill } from "@/components/useStagedFill";

// Green-on-green diagonal stripes for the "raised" fill, gold for the "raised
// beyond the initial goal" overflow, and a subtle striped gray track — matching
// the dashboard CampaignProgressBar so the public page and dashboard read alike.
const GREEN_STRIPES = "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 7px,#23b257 7px,#23b257 14px)";
const GOLD_STRIPES  = "repeating-linear-gradient(-45deg,#f5b93f,#f5b93f 7px,#e8a423 7px,#e8a423 14px)";
const TRACK_STRIPES = "repeating-linear-gradient(-45deg,#eff1f4,#eff1f4 7px,#e4e7eb 7px,#e4e7eb 14px)";

type Props = {
    raised:            number;
    goalAmount:        number | null;
    initialGoalAmount: number | null;
    /** Fallback percentage for no-goal campaigns (goalAmount == null). */
    pct:               number;
};

/**
 * Public campaign progress bar. Green fills up to the locked initial goal, gold
 * fills everything raised beyond it (open-ended scaling), and the track's full
 * width is the current (scaled) goal. Each colour is a full-width striped layer
 * revealed with clip-path so the diagonal stripes stay continuous across the
 * green→gold→track boundaries, and a single shine sweeps the whole fill.
 */
export default function MarketingProgressBar({ raised, goalAmount, initialGoalAmount, pct }: Props) {
    const livePct   = goalAmount && goalAmount > 0 ? Math.min(100, (raised / goalAmount) * 100) : pct;
    const splitGoal = initialGoalAmount ?? goalAmount;
    const scale     = goalAmount && goalAmount > 0 ? Math.max(raised, goalAmount) : (raised || 1);
    const greenPct  = splitGoal ? Math.min(raised, splitGoal) / scale * 100 : livePct;
    const goldPct   = splitGoal && raised > splitGoal ? (raised - splitGoal) / scale * 100 : 0;

    const { greenW, goldW, greenDone } = useStagedFill(greenPct, goldPct);
    const fillW = greenW + goldW;

    // A tiny donation still shows a visible nub aligned with the marker — but a
    // campaign with nothing raised yet shows no green at all (min only when raised).
    const minNub    = raised > 0 ? "44px" : "0px";
    const greenClip = `inset(0 calc(100% - max(${greenW}%, ${minNub})) 0 0)`;
    const goldClip  = `inset(0 ${100 - (greenPct + goldW)}% 0 ${greenPct}%)`;
    const fillClip  = `inset(0 calc(100% - max(${fillW}%, ${minNub})) 0 0)`;

    return (
        <div className="relative w-full">
            <div className="h-[32px] relative rounded-full w-full overflow-hidden" style={{ background: TRACK_STRIPES }}>
                <style>{`@keyframes mkt-pb-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}`}</style>
                {/* Green fill — raised up to the initial goal */}
                <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ background: GREEN_STRIPES, clipPath: greenClip, WebkitClipPath: greenClip }} />
                {/* Gold fill — everything raised beyond the initial goal (open-ended scaling) */}
                {goldPct > 0 && (
                    <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ background: GOLD_STRIPES, clipPath: goldClip, WebkitClipPath: goldClip }} />
                )}
                {/* One shine sweeping the whole fill (green → gold), sitting behind the marker */}
                <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: fillClip, WebkitClipPath: fillClip }}>
                    <span
                        className="absolute inset-y-0 left-0 w-[30%]"
                        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5) 50%,transparent)", animation: "mkt-pb-shimmer 2.2s ease-in-out infinite" }}
                    />
                </div>
                <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
            </div>
            {/* Tall green marker at the end of the green segment — the initial-goal point
                when the goal has scaled, or the progress head otherwise. Pinned at that
                point and faded in only once the green fill reaches it. */}
            {raised > 0 && greenPct < 100 && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 h-[44px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2bbd5f] shadow-[0px_2px_6px_-1px_rgba(0,48,96,0.28)] transition-opacity duration-300 ease-out"
                    style={{ left: `max(${greenPct}%, 44px)`, opacity: greenDone ? 1 : 0 }}
                />
            )}
        </div>
    );
}
