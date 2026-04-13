"use client";

import { useEffect, useRef, useState } from "react";

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function fmtDate(d: Date | null) {
    if (!d) return null;
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function getCountdown(endDate: Date) {
    const diff = endDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds, ended: false };
}

type Props = {
    raisedAmt:      number;
    goalAmt:        number | null;
    initialGoalAmt: number | null;
    donationCount:  number;
    endDate:        Date | null;
    startDate:      Date | null;
    daysLeft:       number | null;
    status:         string;
};

export default function CampaignProgressBar({ raisedAmt, goalAmt, initialGoalAmt, donationCount, endDate, status }: Props) {
    const [countdown,    setCountdown]    = useState<ReturnType<typeof getCountdown> | null>(null);
    const [animGreenPct, setAnimGreenPct] = useState(0);
    const [animGoldPct,  setAnimGoldPct]  = useState(0);
    const [tip,          setTip]          = useState<{ text: string; pct: number } | null>(null);
    const rafRef = useRef<number>(0);

    const isUpcoming  = status === "upcoming";
    const isCompleted = status === "completed";

    // Live countdown
    useEffect(() => {
        if (!endDate || isUpcoming || isCompleted) return;
        setCountdown(getCountdown(endDate));
        const id = setInterval(() => setCountdown(getCountdown(endDate)), 1000);
        return () => clearInterval(id);
    }, [endDate, isUpcoming]);

    // Bar geometry
    // green = raised up to initial (or current) goal; gold = raised beyond initial goal
    const splitGoal      = initialGoalAmt ?? goalAmt;
    const scale          = goalAmt && goalAmt > 0 ? Math.max(raisedAmt, goalAmt) : raisedAmt || 1;
    const targetGreenPct = splitGoal ? Math.min(raisedAmt, splitGoal) / scale * 100 : 100;
    const targetGoldPct  = splitGoal && raisedAmt > splitGoal ? (raisedAmt - splitGoal) / scale * 100 : 0;

    // Animate bar — runs on mount and when raised/goal changes
    const prevGreenRef = useRef(0);
    const prevGoldRef  = useRef(0);
    useEffect(() => {
        const fromGreen = prevGreenRef.current;
        const fromGold  = prevGoldRef.current;
        prevGreenRef.current = targetGreenPct;
        prevGoldRef.current  = targetGoldPct;

        const start = performance.now();
        const dur   = 1200;

        function step(now: number) {
            const t = Math.min(1, (now - start) / dur);
            const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setAnimGreenPct(fromGreen + e * (targetGreenPct - fromGreen));
            setAnimGoldPct(fromGold  + e * (targetGoldPct  - fromGold));
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        }
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raisedAmt, goalAmt]);

    const urgent = countdown && !countdown.ended && countdown.days <= 2;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
            {/* Top row */}
            <div className="flex items-baseline justify-between mb-3">
                <p className="text-xl font-bold text-gray-900">
                    {fmtUSD(raisedAmt)}{" "}
                    <span className="font-normal text-gray-500">raised</span>
                </p>
                {goalAmt ? (
                    <p className="text-sm text-gray-400">{fmtUSD(goalAmt)} goal</p>
                ) : null}
            </div>

            {/* Animated progress bar */}
            <div className="relative" onMouseLeave={() => setTip(null)}>
                <div className="flex h-7 rounded-full overflow-hidden bg-gray-100 cursor-pointer">
                    {animGreenPct > 0 && (
                        <div
                            className="h-full"
                            style={{
                                width: `${animGreenPct}%`,
                                background: "repeating-linear-gradient(-45deg,#22c55e,#22c55e 8px,#16a34a 8px,#16a34a 16px)",
                                borderRadius: animGoldPct > 0 ? "9999px 0 0 9999px" : "9999px",
                                transition: "width 0ms",
                            }}
                            onMouseEnter={() => setTip({ text: `${fmtUSD(Math.min(raisedAmt, splitGoal ?? raisedAmt))} raised`, pct: animGreenPct / 2 })}
                        />
                    )}
                    {animGoldPct > 0 && (
                        <div
                            className="h-full"
                            style={{
                                width: `${animGoldPct}%`,
                                background: "repeating-linear-gradient(-45deg,#f59e0b,#f59e0b 8px,#d97706 8px,#d97706 16px)",
                                borderRadius: animGreenPct + animGoldPct >= 100 ? "0 9999px 9999px 0" : "0",
                                transition: "width 0ms",
                            }}
                            onMouseEnter={() => setTip({ text: `${fmtUSD(raisedAmt - (splitGoal ?? 0))} raised beyond goal`, pct: animGreenPct + animGoldPct / 2 })}
                        />
                    )}
                    {goalAmt && raisedAmt < goalAmt && (
                        <div
                            className="flex-1 h-full"
                            onMouseEnter={() => setTip({ text: `${fmtUSD(goalAmt - raisedAmt)} remaining to reach goal`, pct: animGreenPct + animGoldPct + (100 - animGreenPct - animGoldPct) / 2 })}
                        />
                    )}
                </div>

                {/* Open-ended goal markers — green dotted = initial goal, gold dotted = scaled goal */}
                {initialGoalAmt && goalAmt && initialGoalAmt !== goalAmt && (() => {
                    const greenMarkerPct = Math.min(97, Math.max(3, initialGoalAmt / scale * 100));
                    const goldMarkerPct  = goalAmt / scale * 100;
                    const showGold       = goldMarkerPct > 3 && goldMarkerPct < 97;
                    return (
                        <>
                            <div className="absolute top-0 h-7 pointer-events-none" style={{ left: `${greenMarkerPct}%`, borderLeft: "2px dashed #16a34a" }} />
                            {showGold && <div className="absolute top-0 h-7 pointer-events-none" style={{ left: `${goldMarkerPct}%`, borderLeft: "2px dashed #d97706" }} />}
                        </>
                    );
                })()}

                {tip && (
                    <div
                        className="absolute -top-9 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-10"
                        style={{ left: `${Math.min(90, Math.max(10, tip.pct))}%` }}
                    >
                        {tip.text}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                )}
            </div>

            {/* Marker labels — only for open-ended scaled campaigns */}
            {initialGoalAmt && goalAmt && initialGoalAmt !== goalAmt && (() => {
                const greenMarkerPct = Math.min(97, Math.max(3, initialGoalAmt / scale * 100));
                const goldMarkerPct  = goalAmt / scale * 100;
                const showGold       = goldMarkerPct > 3 && goldMarkerPct < 97;
                return (
                    <div className="relative h-4 mt-1 pointer-events-none select-none">
                        <span className="absolute text-[10px] font-semibold text-green-700 -translate-x-1/2 whitespace-nowrap" style={{ left: `${greenMarkerPct}%` }}>
                            {fmtUSD(initialGoalAmt)}
                        </span>
                        {showGold && (
                            <span className="absolute text-[10px] font-semibold text-amber-600 -translate-x-1/2 whitespace-nowrap" style={{ left: `${goldMarkerPct}%` }}>
                                {fmtUSD(goalAmt)}
                            </span>
                        )}
                    </div>
                );
            })()}

            {/* Bottom row — hidden for upcoming and completed */}
            {!isUpcoming && !isCompleted && (
                <div className="flex items-center justify-between mt-3 gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <svg
                            className={`w-4 h-4 shrink-0 ${urgent ? "text-orange-500" : "text-gray-400"}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 21V4m0 0l8 3 8-3v13l-8 3-8-3V4z" />
                        </svg>
                        {endDate && (
                            <span className="text-sm text-gray-500">{fmtDate(endDate)}</span>
                        )}
                        {!endDate && (
                            <span className="text-sm text-gray-400">No end date</span>
                        )}
                        {countdown && endDate && (
                            countdown.ended ? (
                                <span className="text-sm font-bold text-red-500">Ended</span>
                            ) : countdown.days > 0 ? (
                                <span className={`text-sm font-extrabold uppercase tracking-wide ${urgent ? "text-red-500" : "text-orange-500"}`}>
                                    {countdown.days} {countdown.days === 1 ? "day" : "days"} left!
                                </span>
                            ) : (
                                <span className={`text-sm font-bold font-mono tabular-nums ${urgent ? "text-red-500" : "text-orange-500"}`}>
                                    {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)} left!
                                </span>
                            )
                        )}
                    </div>
                    <p className="text-sm text-gray-400 shrink-0">
                        {donationCount} {donationCount === 1 ? "donation" : "donations"}
                    </p>
                </div>
            )}
        </div>
    );
}
