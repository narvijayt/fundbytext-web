"use client";

import { useEffect, useRef, useState } from "react";
import type { RecentDonation } from "../page";

type Props = {
    totalRaised:              number;
    goalAmount:               number | null;
    initialGoalAmount:        number | null;
    pct:                      number;
    donorCount:               number;
    recentDonations:          RecentDonation[];
    accent:                   string;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    endDate:                  Date | null;
    startDate:                Date | null;
    status:                   string;
    onDonate:                 () => void;
};

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function getCountdown(target: Date) {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds };
}

export default function ProgressPanel({
    totalRaised, goalAmount, initialGoalAmount, pct, donorCount, recentDonations,
    accent, donationsEnabled, donationsDisabledMessage,
    endDate, startDate, status, onDonate,
}: Props) {
    // ── Animated progress bar ──────────────────────────────────────────────
    const [barPct,     setBarPct]     = useState(0);
    const [displayAmt, setDisplayAmt] = useState(0);
    const [countdown,  setCountdown]  = useState<ReturnType<typeof getCountdown>>(null);
    const [mounted,    setMounted]    = useState(false);
    const rafRef = useRef<number>(0);

    // Animate bar + counter — runs on mount and whenever totalRaised/pct changes
    const prevRaisedRef = useRef(0);
    const prevPctRef    = useRef(0);
    useEffect(() => {
        const fromAmt = prevRaisedRef.current;
        const fromPct = prevPctRef.current;
        prevRaisedRef.current = totalRaised;
        prevPctRef.current    = pct;

        const start = performance.now();
        const dur   = 1200;

        function step(now: number) {
            const t = Math.min(1, (now - start) / dur);
            const e = 1 - Math.pow(1 - t, 3);
            setBarPct(fromPct + e * (pct - fromPct));
            setDisplayAmt(Math.round(fromAmt + e * (totalRaised - fromAmt)));
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        }
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalRaised, pct]);

    // Live countdown — ticks every second
    useEffect(() => {
        setMounted(true);
        const target = status === "upcoming" ? startDate : endDate;
        if (!target) return;
        setCountdown(getCountdown(target));
        const id = setInterval(() => {
            setCountdown(getCountdown(target));
        }, 1000);
        return () => clearInterval(id);
    }, [endDate, startDate, status]);

    const isUpcoming  = status === "upcoming";
    const isCompleted = status === "completed";
    const urgent      = !isUpcoming && !isCompleted && countdown && countdown.days <= 2;

    return (
        <div className="space-y-4 lg:sticky lg:top-20">

            {/* ── Main card ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-5">

                {/* Raised amount */}
                <p className="text-3xl font-extrabold text-gray-900 tabular-nums">
                    {fmtUSD(displayAmt)}
                </p>
                {goalAmount && (
                    <div className="mt-0.5">
                        <p className="text-sm text-gray-500">
                            raised of{" "}
                            <span className="font-semibold text-gray-700">{fmtUSD(initialGoalAmount ?? goalAmount)}</span>
                            {" "}{initialGoalAmount && initialGoalAmount !== goalAmount ? "initial goal" : "goal"}
                        </p>
                        {initialGoalAmount && initialGoalAmount !== goalAmount && (
                            <p className="text-xs text-amber-500 font-semibold mt-0.5">
                                {fmtUSD(goalAmount)} current goal
                            </p>
                        )}
                    </div>
                )}

                {/* Progress bar — green up to initial goal, gold beyond */}
                {(() => {
                    const splitGoal = initialGoalAmount ?? goalAmount;
                    const scale     = goalAmount && goalAmount > 0 ? Math.max(totalRaised, goalAmount) : totalRaised || 1;
                    const greenPct  = splitGoal ? Math.min(displayAmt, splitGoal) / scale * 100 : barPct;
                    const goldPct   = splitGoal && displayAmt > splitGoal
                        ? (displayAmt - splitGoal) / scale * 100
                        : 0;
                    return (
                        <div className="mt-3 h-4 rounded-full bg-gray-100 overflow-hidden flex">
                            {greenPct > 0 && (
                                <div
                                    className="h-full"
                                    style={{
                                        width:        `${greenPct}%`,
                                        background:   "repeating-linear-gradient(-45deg,#22c55e,#22c55e 6px,#16a34a 6px,#16a34a 12px)",
                                        borderRadius: goldPct > 0 ? "9999px 0 0 9999px" : "9999px",
                                        transition:   "width 0ms",
                                    }}
                                />
                            )}
                            {goldPct > 0 && (
                                <div
                                    className="h-full rounded-r-full"
                                    style={{
                                        width:      `${goldPct}%`,
                                        background: "repeating-linear-gradient(-45deg,#f59e0b,#f59e0b 6px,#d97706 6px,#d97706 12px)",
                                        transition: "width 0ms",
                                    }}
                                />
                            )}
                        </div>
                    );
                })()}

                {/* Stats row */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                        <span className="font-bold text-gray-800">{donorCount}</span>{" "}
                        donor{donorCount !== 1 ? "s" : ""}
                    </span>
                    {pct >= 100 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">
                            Goal reached!
                        </span>
                    )}
                </div>

                {/* ── Countdown / status block — only render client-side to avoid flicker ── */}
                {mounted && (isCompleted ? (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Campaign ended
                    </div>
                ) : isUpcoming && !countdown ? (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                        Campaign is starting…
                    </div>
                ) : isUpcoming && countdown ? (
                    <div className="mt-3 px-3 py-2.5 bg-blue-50 rounded-xl">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Campaign starts in</p>
                        <div className="flex items-end gap-2">
                            {countdown.days > 0 && (
                                <div className="text-center">
                                    <p className="text-2xl font-extrabold text-blue-700 tabular-nums leading-none">{countdown.days}</p>
                                    <p className="text-[9px] text-blue-400 uppercase tracking-wider mt-0.5">day{countdown.days !== 1 ? "s" : ""}</p>
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-2xl font-extrabold text-blue-700 tabular-nums leading-none">{pad(countdown.hours)}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-wider mt-0.5">hrs</p>
                            </div>
                            <div className="text-blue-400 font-bold text-xl leading-none mb-0.5">:</div>
                            <div className="text-center">
                                <p className="text-2xl font-extrabold text-blue-700 tabular-nums leading-none">{pad(countdown.minutes)}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-wider mt-0.5">min</p>
                            </div>
                            <div className="text-blue-400 font-bold text-xl leading-none mb-0.5">:</div>
                            <div className="text-center">
                                <p className="text-2xl font-extrabold text-blue-700 tabular-nums leading-none">{pad(countdown.seconds)}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-wider mt-0.5">sec</p>
                            </div>
                        </div>
                    </div>
                ) : endDate && countdown ? (
                    <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${urgent ? "bg-orange-50" : "bg-gray-50"}`}>
                        <svg className={`w-3.5 h-3.5 shrink-0 ${urgent ? "text-orange-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-xs font-semibold ${urgent ? "text-orange-600" : "text-gray-500"}`}>
                            {countdown.days > 0 && <span>{countdown.days}d </span>}
                            <span className="font-mono tabular-nums">
                                {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
                            </span>
                            {" "}left
                        </span>
                    </div>
                ) : endDate ? (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Campaign ended
                    </div>
                ) : null)}

                {/* Donations paused banner */}
                {!donationsEnabled && (
                    <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-amber-800 leading-snug">
                            {donationsDisabledMessage?.trim()
                                ? donationsDisabledMessage
                                : "This campaign is temporarily not accepting donations. Please check back soon."}
                        </p>
                    </div>
                )}

                {/* Share + Donate */}
                <div className="mt-4 space-y-2">
                    <a
                        href="javascript:void(0)"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ background: "#1877F2" }}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                        </svg>
                        Share on Facebook
                    </a>

                    {isCompleted ? (
                        <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
                            Campaign Ended
                        </button>
                    ) : donationsEnabled && !isUpcoming ? (
                        <button
                            onClick={onDonate}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold shadow-md transition-transform hover:scale-[1.02] active:scale-100"
                            style={{ background: accent }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Donate Now
                        </button>
                    ) : isUpcoming ? (
                        <button disabled className="w-full py-3 rounded-xl bg-blue-50 text-blue-400 text-sm font-bold cursor-not-allowed">
                            Donations open when campaign starts
                        </button>
                    ) : (
                        <button disabled className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
                            Donations Paused
                        </button>
                    )}
                </div>
            </div>

            {/* ── Recent donors ────────────────────────────────────── */}
            {recentDonations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800">Recent Donors</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {donorCount} total
                        </span>
                    </div>
                    <ul>
                        {recentDonations.map((d, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                                style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${i * 50}ms` }}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                                    style={{ background: d.is_anonymous ? "#9ca3af" : accent }}
                                >
                                    {d.is_anonymous ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        d.display_name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Name + label */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{d.display_name}</p>
                                    {d.is_anonymous && (
                                        <p className="text-[10px] text-gray-400 leading-tight">Anonymous</p>
                                    )}
                                </div>

                                {/* Amount */}
                                <p className="text-sm font-bold shrink-0" style={{ color: accent }}>{fmtUSD(d.amount)}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
