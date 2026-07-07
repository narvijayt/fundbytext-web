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

/* A single countdown unit — big tabular number over a muted uppercase label. */
function Unit({ value, label }: { value: string | number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[22px] sm:text-[26px] font-black leading-none text-[#0268c0] tabular-nums">{value}</span>
            <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#8aa9cc]">{label}</span>
        </div>
    );
}

/* Colon centred against the digit row (not the label). */
function Colon() {
    return <span className="flex h-[22px] sm:h-[26px] items-center text-[20px] sm:text-[24px] font-black leading-none text-[#c0d6ef]">:</span>;
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
            <div className="flex items-center gap-4 rounded-2xl border border-[#bfe8cd] bg-gradient-to-br from-[#f2fcf5] to-[#e6f8ec] px-5 py-4 sm:px-6 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#34d576] to-[#16a34a] shadow-[0px_6px_14px_-5px_rgba(22,163,74,0.6)] animate-pulse">
                    <svg className="size-[22px] text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 6 4.5Z" />
                    </svg>
                </div>
                <div>
                    <p className="text-[14px] font-black leading-tight text-[#065f2e]">Campaign is starting…</p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#3f9e63]">The dashboard will update automatically.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#d5e6f7] bg-gradient-to-br from-[#f5faff] to-[#e9f2fd] px-5 py-4 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] sm:flex-row sm:items-center sm:px-6">
            {/* Icon + label + date */}
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4a9bea] to-[#0268c0] shadow-[0px_6px_14px_-5px_rgba(2,104,192,0.6)]">
                    <svg className="size-[22px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <p className="text-[14px] font-black leading-tight text-[#003060]">Campaign starts in</p>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-[#5f83ad]">
                        {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                </div>
            </div>

            {/* Countdown */}
            <div className="flex shrink-0 items-start gap-2 pl-[60px] sm:gap-2.5 sm:pl-0">
                {cd.days > 0 && (
                    <>
                        <Unit value={cd.days} label="Days" />
                        <Colon />
                    </>
                )}
                <Unit value={pad(cd.hours)} label="Hrs" />
                <Colon />
                <Unit value={pad(cd.minutes)} label="Min" />
                <Colon />
                <Unit value={pad(cd.seconds)} label="Sec" />
            </div>
        </div>
    );
}
