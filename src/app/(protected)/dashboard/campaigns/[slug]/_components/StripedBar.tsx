"use client";

import { useEffect, useState } from "react";

/* The slim striped progress bar shared by the participant cards — same visual
   family as the big campaign progress bar (diagonal stripes + shimmer + animated
   fill-in on mount). Green = money, orange = donor counts (matches the
   participants table's bar colors). */
const FILLS: Record<string, string> = {
    green:  "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 5px,#23b257 5px,#23b257 10px)",
    orange: "repeating-linear-gradient(-45deg,#ff9059,#ff9059 5px,#f47435 5px,#f47435 10px)",
};

export default function StripedBar({ pct, color = "green", className = "h-3.5" }: {
    pct:        number;
    color?:     "green" | "orange";
    className?: string;
}) {
    const [animPct, setAnimPct] = useState(0);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimPct(Math.min(100, Math.max(0, pct))));
        return () => cancelAnimationFrame(raf);
    }, [pct]);

    return (
        <div className={`relative overflow-hidden rounded-full ${className}`} style={{ background: "#e5e7eb" }}>
            <style>{`@keyframes sb-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}`}</style>
            <div
                className="absolute inset-y-0 left-0"
                style={{
                    width: `${animPct}%`,
                    background: FILLS[color],
                    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }}
            />
            {animPct > 0 && (
                <div className="pointer-events-none absolute inset-y-0 left-0" style={{ width: `${animPct}%`, overflow: "hidden" }}>
                    <div style={{
                        position: "absolute", top: 0, bottom: 0, left: 0, width: "35%",
                        background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55) 50%,transparent)",
                        animation: "sb-shimmer 2.2s ease-in-out infinite",
                    }} />
                </div>
            )}
        </div>
    );
}
