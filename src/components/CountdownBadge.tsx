"use client";

import { useEffect, useState } from "react";

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatDiff(diff: number, mode: "left" | "toStart"): string {
    if (diff <= 0) return mode === "left" ? "Ended" : "Starting now!";
    const days  = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins  = Math.floor((diff % 3_600_000) / 60_000);
    const secs  = Math.floor((diff % 60_000) / 1_000);

    const parts: string[] = [];
    if (days  > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${pad(hours)}h`);
    parts.push(`${pad(mins)}m`);
    parts.push(`${pad(secs)}s`);

    const time = parts.join(" ");
    return mode === "left" ? `${time} left!` : `Starts in ${time}`;
}

type Props = {
    date:       Date | string | null;
    mode:       "left" | "toStart";
    className?: string;
};

export default function CountdownBadge({ date, mode, className }: Props) {
    const [text, setText] = useState<string | null>(null);

    useEffect(() => {
        if (!date) return;
        const target = new Date(date).getTime();
        const tick = () => {
            const diff = target - Date.now();
            if (mode === "left" && diff <= 0) { setText(null); return; }
            setText(formatDiff(diff, mode));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [date, mode]);

    if (!text) return null;

    return (
        <p className={className}>
            {text}
        </p>
    );
}
