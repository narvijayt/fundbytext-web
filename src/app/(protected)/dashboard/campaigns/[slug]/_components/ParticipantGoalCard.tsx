"use client";

import StripedBar from "./StripedBar";

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type Props = {
    raised: number;
    goal:   number;
    /** Ranking position to badge (null = hide, e.g. fewer than 2 participants). */
    rank:   number | null;
};

// Podium ranks get the Figma medal + a matching tinted pill; 4+ keeps a plain pill.
const PODIUM: Record<number, string> = {
    1: "border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/70 text-amber-700",
    2: "border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-600",
    3: "border-orange-200 bg-gradient-to-b from-orange-50 to-orange-100/70 text-orange-700",
};

export function RankBadge({ rank, className = "" }: { rank: number; className?: string }) {
    const podium = PODIUM[rank];
    if (podium) {
        return (
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 text-xs font-bold ${podium} ${className}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/dashboard/rank-${rank}.svg`} alt="" aria-hidden="true" className="h-5 w-5 shrink-0" />
                #{rank} in Rankings
            </span>
        );
    }
    return (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500 ${className}`}>
            #{rank} in Rankings
        </span>
    );
}

/* The participant's personal "Your Fundraising Goal" card. Intentionally quieter
   than the main campaign progress card below it (smaller type, slimmer bar) so
   the campaign section keeps the spotlight — but the bar uses the same striped
   green treatment so they read as one family. */
export default function ParticipantGoalCard({ raised, goal, rank }: Props) {
    const pct       = Math.min(100, Math.round((raised / goal) * 100));
    const remaining = goal - raised;

    return (
        <div className="space-y-3 rounded-2xl border border-[#e7e9eb] bg-white px-5 py-4 shadow-[0px_2px_12px_0px_rgba(0,91,172,0.05)]">
            {/* Title + rank */}
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-bold text-[#003060]">Your Fundraising Goal</h2>
                {rank !== null && <RankBadge rank={rank} />}
            </div>

            {/* Raised vs goal */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[18px] font-black leading-none text-[#003060]">
                    {fmtUSD(raised)}{" "}
                    <span className="text-[13px] font-medium text-[#7e8a96]">raised</span>
                </p>
                <p className="text-[13px] text-[#9aa7b8]">{fmtUSD(goal)} goal</p>
            </div>

            {/* Striped bar — same treatment as the campaign progress bar, slimmer */}
            <StripedBar pct={pct} />

            {/* Status line — quiet, no boxed strip (the campaign card keeps that emphasis) */}
            <p className="text-xs text-[#9aa7b8]">
                <span className="font-semibold text-[#003060]">{pct}%</span> of your goal
                <span className="float-right">{fmtUSD(remaining)} remaining</span>
            </p>
        </div>
    );
}
