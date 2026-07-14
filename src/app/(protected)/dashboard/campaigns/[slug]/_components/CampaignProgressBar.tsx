"use client";

import { useEffect, useState } from "react";
import ScalingProgressBar from "@/components/ScalingProgressBar";

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function fmtDate(d: Date | null, tz: string) {
    if (!d) return null;
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", day: "numeric", year: "numeric" }).format(d);
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
    goalType?:      string | null;
    timezone?:      string | null;
};

export default function CampaignProgressBar({ raisedAmt, goalAmt, initialGoalAmt, donationCount, endDate, status, goalType, timezone }: Props) {
    const tz = timezone ?? "America/New_York";
    const [countdown,    setCountdown]    = useState<ReturnType<typeof getCountdown> | null>(null);

    const isUpcoming  = status === "upcoming";
    const isCompleted = status === "completed";

    // Live countdown
    useEffect(() => {
        if (!endDate || isUpcoming || isCompleted) return;
        setCountdown(getCountdown(endDate));
        const id = setInterval(() => setCountdown(getCountdown(endDate)), 1000);
        return () => clearInterval(id);
    }, [endDate, isUpcoming]);

    const urgent = countdown && !countdown.ended && countdown.days <= 2;

    return (
        <div className="pl-6">
            {/* Top row */}
            <div className="flex items-baseline justify-between gap-4 mb-3">
                <p className="text-[26px] font-black leading-none text-[#003060]">
                    {fmtUSD(raisedAmt)}{" "}
                    <span className="text-[18px] font-medium text-[#7e8a96]">raised</span>
                </p>
                {goalAmt ? (
                    <p className="text-[15px] text-[#9aa7b8]">
                        {fmtUSD(initialGoalAmt ?? goalAmt)} {initialGoalAmt && initialGoalAmt !== goalAmt ? "initial goal" : "goal"}
                    </p>
                ) : null}
            </div>

            {/* Progress bar — identical to the public campaign page (striped track,
                green/gold clip-path stripes, single shine, tall reveal-on-touch marker),
                with the per-segment hover tooltips kept for the dashboard/admin. */}
            <ScalingProgressBar raised={raisedAmt} goalAmount={goalAmt} initialGoalAmount={initialGoalAmt} showTooltips />

            {/* Open-ended initial goal milestone banner */}
            {goalType === "open_ended" && initialGoalAmt && initialGoalAmt > 0 && !isUpcoming && (() => {
                const initialReached = raisedAmt >= initialGoalAmt;
                const pct            = Math.min(100, Math.round((raisedAmt / initialGoalAmt) * 100));
                const remaining      = initialGoalAmt - raisedAmt;

                if (initialReached) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-green-700">Initial goal reached!</p>
                            <p className="text-xs text-green-600">{fmtUSD(initialGoalAmt)} goal · keep going!</p>
                        </div>
                        {goalAmt && goalAmt > initialGoalAmt && (
                            <p className="text-xs text-green-600 ml-auto">
                                New goal: {fmtUSD(goalAmt)}
                            </p>
                        )}
                    </div>
                );

                if (!isCompleted) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">{pct}%</span> of initial {fmtUSD(initialGoalAmt)} goal
                        </p>
                        <p className="text-xs text-gray-400 ml-auto">{fmtUSD(remaining)} remaining</p>
                    </div>
                );

                return null;
            })()}

            {/* Goal status banners — skip for open-ended (scaling markers + initial-goal banner handle it), participant_goal (individual banners handle it), and no-goal campaigns */}
            {(() => {
                const isScalingGoal = goalType === "open_ended"
                    || (initialGoalAmt !== null && goalAmt !== null && initialGoalAmt !== goalAmt);
                if (!goalAmt || goalAmt <= 0 || isScalingGoal || goalType === "participant_goal") return null;
                const goalReached = raisedAmt >= goalAmt;
                const pct         = Math.min(100, Math.round((raisedAmt / goalAmt) * 100));
                const remaining   = goalAmt - raisedAmt;

                // Active + goal reached
                if (!isCompleted && goalReached) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-700">Goal Reached!</p>
                        <p className="text-xs text-green-600 ml-auto">{fmtUSD(raisedAmt)} of {fmtUSD(goalAmt)}</p>
                    </div>
                );

                // Active + goal not yet reached
                if (!isCompleted && !isUpcoming && !goalReached) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">{pct}%</span> of goal
                        </p>
                        <p className="text-xs text-gray-400 ml-auto">{fmtUSD(remaining)} remaining</p>
                    </div>
                );

                // Completed + goal fully funded
                if (isCompleted && goalReached) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-700">Goal Fully Funded!</p>
                        <p className="text-xs text-green-600 ml-auto">{fmtUSD(raisedAmt)} raised</p>
                    </div>
                );

                // Completed + goal not met
                if (isCompleted && !goalReached) return (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm text-amber-700">
                            Campaign ended · <span className="font-semibold">{pct}%</span> of goal raised
                        </p>
                        <p className="text-xs text-amber-600 ml-auto">{fmtUSD(raisedAmt)} of {fmtUSD(goalAmt)}</p>
                    </div>
                );

                return null;
            })()}

            {/* Bottom row — hidden for upcoming and completed */}
            {!isUpcoming && !isCompleted && (
                <div className="mt-3 flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/campaigns/flag-active.svg" alt="" className="h-10 w-auto -rotate-6 shrink-0" />
                    {/* Date + donations on the top line; time-left stacked underneath (per Figma) */}
                    <div className="flex flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-4">
                            {endDate ? (
                                <span className="text-[15px] font-medium leading-tight text-[#7e8a96]">{fmtDate(endDate, tz)}</span>
                            ) : (
                                <span className="text-[15px] leading-tight text-[#9aa7b8]">No end date</span>
                            )}
                            <p className="text-[14px] font-medium leading-tight text-[#9aa7b8] shrink-0">
                                {donationCount} {donationCount === 1 ? "donation" : "donations"}
                            </p>
                        </div>
                        {/* Reserve the line's height so the card doesn't shift when the
                            client-only countdown appears after mount (avoids layout jump). */}
                        {endDate && (
                            <div className="flex min-h-[14px] items-center">
                                {countdown && (
                                    countdown.ended ? (
                                        <span className="text-[12px] font-black uppercase leading-none tracking-[0.5px] text-red-500">Ended</span>
                                    ) : countdown.days > 0 ? (
                                        <span className={`text-[12px] font-black uppercase leading-none tracking-[0.5px] ${urgent ? "text-red-500" : "text-[#f47435]"}`}>
                                            {countdown.days} {countdown.days === 1 ? "day" : "days"} left!
                                        </span>
                                    ) : (
                                        <span className={`text-[12px] font-black font-mono leading-none tabular-nums ${urgent ? "text-red-500" : "text-[#f47435]"}`}>
                                            {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)} left!
                                        </span>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
