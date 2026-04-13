"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function getCountdown(target: Date) {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
    };
}

export default function UpcomingBanner({ startDate }: { startDate: Date }) {
    const [cd, setCd] = useState<ReturnType<typeof getCountdown> | undefined>(undefined);

    useEffect(() => {
        setCd(getCountdown(startDate));
        const id = setInterval(() => setCd(getCountdown(startDate)), 1000);
        return () => clearInterval(id);
    }, [startDate]);

    // Not mounted yet — render nothing to avoid flash
    if (cd === undefined) return null;

    // Countdown reached zero — campaign is starting
    if (cd === null) {
        return (
            <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 animate-pulse">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-bold text-green-800">Campaign is starting…</p>
                    <p className="text-xs text-green-500 mt-0.5">The dashboard will update automatically.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-800">Campaign starts in</p>
                <p className="text-xs text-blue-500 mt-0.5">
                    {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {cd.days > 0 && (
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums leading-none">{cd.days}</p>
                        <p className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">days</p>
                    </div>
                )}
                {cd.days > 0 && <span className="text-blue-300 font-bold text-lg pb-3">:</span>}
                <div className="text-center">
                    <p className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums leading-none">{pad(cd.hours)}</p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">hrs</p>
                </div>
                <span className="text-blue-300 font-bold text-lg pb-3">:</span>
                <div className="text-center">
                    <p className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums leading-none">{pad(cd.minutes)}</p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">min</p>
                </div>
                <span className="text-blue-300 font-bold text-lg pb-3">:</span>
                <div className="text-center">
                    <p className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums leading-none">{pad(cd.seconds)}</p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">sec</p>
                </div>
            </div>
        </div>
    );
}
