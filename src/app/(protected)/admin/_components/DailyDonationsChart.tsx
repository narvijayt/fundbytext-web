"use client";

import { useState } from "react";

export type DailyPoint = { date: string; amount: number };

const W = 600, H = 160;
const PL = 52, PR = 12, PT = 12, PB = 32;
const IW = W - PL - PR;
const IH = H - PT - PB;

function niceMax(v: number): number {
    if (v <= 0) return 100;
    const candidates = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000];
    return candidates.find((c) => c >= v) ?? Math.ceil(v / 100000) * 100000;
}

function fmtY(n: number): string {
    if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${+(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
}

function fmtTooltip(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string): string {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DailyDonationsChart({ data }: { data: DailyPoint[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

    const maxRaw = Math.max(...data.map((d) => d.amount), 0);
    const yMax   = niceMax(maxRaw);

    const n = data.length;
    const barSlot = IW / n;
    const barW    = Math.max(2, barSlot - 3);

    const xOf = (i: number) => PL + i * barSlot + (barSlot - barW) / 2;
    const yOf = (amt: number) => PT + IH - (amt / yMax) * IH;
    const hOf = (amt: number) => (amt / yMax) * IH;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax));

    const total = data.reduce((s, d) => s + d.amount, 0);
    const avg   = total / n;

    return (
        <div className="relative select-none">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{ display: "block", overflow: "visible" }}
                aria-hidden
                onMouseLeave={() => setHovered(null)}
            >
                <defs>
                    <linearGradient id="ovBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0268c0" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#0268c0" stopOpacity="0.55" />
                    </linearGradient>
                    <linearGradient id="ovBarHov" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0357a0" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0357a0" stopOpacity="0.8" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid + labels */}
                {yTicks.map((v) => {
                    const y = yOf(v);
                    return (
                        <g key={v}>
                            <line x1={PL} y1={y} x2={W - PR} y2={y}
                                stroke={v === 0 ? "#d1d5db" : "#f3f4f6"}
                                strokeWidth={v === 0 ? 1 : 0.75} />
                            <text x={PL - 6} y={y} textAnchor="end" dominantBaseline="middle"
                                fontSize={9} fill="#9ca3af"
                                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                {fmtY(v)}
                            </text>
                        </g>
                    );
                })}

                {/* Average line */}
                {avg > 0 && (
                    <line x1={PL} y1={yOf(avg)} x2={W - PR} y2={yOf(avg)}
                        stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
                )}

                {/* Bars */}
                {data.map((d, i) => {
                    const h = Math.max(d.amount > 0 ? 2 : 0, hOf(d.amount));
                    const x = xOf(i);
                    const y = yOf(d.amount);
                    const isHov = hovered === i;
                    return (
                        <g key={d.date}>
                            <rect
                                x={x} y={y} width={barW} height={h}
                                fill={isHov ? "url(#ovBarHov)" : "url(#ovBarGrad)"}
                                rx={2}
                                style={{ transition: "fill 0.1s" }}
                            />
                            {/* Invisible wider hit area */}
                            <rect
                                x={PL + i * barSlot} y={PT} width={barSlot} height={IH}
                                fill="transparent"
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHovered(i)}
                            />
                        </g>
                    );
                })}

                {/* X-axis labels every 7 days */}
                {data.map((d, i) => {
                    const isLast = i === n - 1;
                    // Skip if not a 7-day tick and not the last point
                    if (i % 7 !== 0 && !isLast) return null;
                    // Skip the last point if it's within 4 slots of the previous tick (avoids overlap)
                    if (isLast && i % 7 !== 0 && i % 7 < 4) return null;
                    return (
                        <text key={d.date}
                            x={xOf(i) + barW / 2} y={H - 6}
                            textAnchor="middle" fontSize={9} fill="#9ca3af"
                            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                            {fmtDate(d.date)}
                        </text>
                    );
                })}

                {/* Tooltip crosshair */}
                {hovered !== null && (
                    <line
                        x1={xOf(hovered) + barW / 2} y1={PT}
                        x2={xOf(hovered) + barW / 2} y2={PT + IH}
                        stroke="#0268c0" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"
                    />
                )}
            </svg>

            {/* HTML tooltip */}
            {hovered !== null && (() => {
                const d   = data[hovered];
                const pct = (xOf(hovered) + barW / 2 - PL) / IW;
                const onRight = pct < 0.6;
                return (
                    <div
                        className="absolute top-0 pointer-events-none z-10"
                        style={{
                            left:  onRight ? `calc(${pct * 100}% + 10px)` : undefined,
                            right: !onRight ? `calc(${(1 - pct) * 100}% + 10px)` : undefined,
                            top:   "8px",
                        }}
                    >
                        <div className="bg-gray-900 text-white rounded-xl shadow-xl px-3 py-2 min-w-28">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                                {fmtDate(d.date)}
                            </p>
                            <p className="text-sm font-extrabold">{fmtTooltip(d.amount)}</p>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
