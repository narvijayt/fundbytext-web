"use client";

import { useEffect, useState } from "react";

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type Props = {
    raised: number;
    goal:   number;
    /** Ranking position to badge (null = hide, e.g. fewer than 2 participants). */
    rank:   number | null;
};

/* The participant's personal "Your Fundraising Goal" card. Mirrors the campaign
   progress card below it: same striped green animated bar (with shimmer) and the
   same "% of goal · remaining" status strip — personal numbers instead. */
export default function ParticipantGoalCard({ raised, goal, rank }: Props) {
    const pct       = Math.min(100, Math.round((raised / goal) * 100));
    const remaining = goal - raised;
    const [animPct, setAnimPct] = useState(0);

    // Animate the fill in on mount (matches the campaign bar's entrance).
    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimPct(pct));
        return () => cancelAnimationFrame(raf);
    }, [pct]);

    const rankColors =
        rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
        rank === 2 ? "bg-gray-100 text-gray-600 border-gray-200" :
        rank === 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                     "bg-gray-50 text-gray-500 border-gray-100";

    return (
        <div className="space-y-4 rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] sm:p-6">
            {/* Title + rank */}
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold text-[#003060]">Your Fundraising Goal</h2>
                {rank !== null && (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${rankColors}`}>
                        #{rank} in Rankings
                    </span>
                )}
            </div>

            {/* Raised vs goal */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[24px] font-black leading-none text-[#003060]">
                    {fmtUSD(raised)}{" "}
                    <span className="text-[16px] font-medium text-[#7e8a96]">raised</span>
                </p>
                <p className="text-[14px] text-[#9aa7b8]">{fmtUSD(goal)} goal</p>
            </div>

            {/* Striped animated bar — same construction as the campaign progress bar */}
            <div className="relative">
                <style>{`@keyframes pgc-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}`}</style>
                <div className="relative h-7 overflow-hidden rounded-full" style={{ background: "#e5e7eb" }}>
                    <div
                        className="absolute inset-y-0 left-0"
                        style={{
                            width: `${animPct}%`,
                            background: "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 7px,#23b257 7px,#23b257 14px)",
                            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                        }}
                    />
                    {animPct > 0 && (
                        <div className="pointer-events-none absolute inset-y-0 left-0" style={{ width: `${animPct}%`, overflow: "hidden" }}>
                            <div style={{
                                position: "absolute", top: 0, bottom: 0, left: 0, width: "35%",
                                background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55) 50%,transparent)",
                                animation: "pgc-shimmer 2.2s ease-in-out infinite",
                            }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Status strip — same style as the campaign bar's "% of goal" banner */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{pct}%</span> of your goal
                </p>
                <p className="ml-auto text-xs text-gray-400">{fmtUSD(remaining)} remaining</p>
            </div>
        </div>
    );
}
