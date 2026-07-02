"use client";

import { useState } from "react";

export type DailyPoint = { date: string; amount: number };

const W = 640, H = 176;
const PL = 46, PR = 14, PT = 14, PB = 44;
const IW = W - PL - PR;
const IH = H - PT - PB;

/* Tight axis: pick a "nice" step (1/2/2.5/5 × 10^k) for ~4 ticks so the tallest
   bar fills most of the plot instead of leaving half the chart empty. */
function niceScale(max: number, tickCount = 4): { yMax: number; step: number } {
    if (max <= 0) return { yMax: 100, step: 25 };
    const rawStep = max / tickCount;
    const mag  = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    const step = niceNorm * mag;
    return { yMax: Math.ceil(max / step) * step, step };
}

function fmtY(n: number): string {
    if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
    if (n >= 1_000)     return `$${+(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}k`;
    return `$${n}`;
}

function fmtTooltip(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtAvg(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 100 ? 0 : 0 }).format(n);
}

function parseDate(iso: string) { return new Date(iso + "T12:00:00"); }
function fmtDate(iso: string): string {
    return parseDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DailyDonationsChart({ data }: { data: DailyPoint[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

    const maxRaw = Math.max(...data.map((d) => d.amount), 0);
    const { yMax, step } = niceScale(maxRaw);

    const n = data.length;
    const barSlot = IW / n;
    const barW    = Math.max(2, Math.min(18, barSlot - 4));

    const xMid = (i: number) => PL + i * barSlot + barSlot / 2;
    const yOf  = (amt: number) => PT + IH - (amt / yMax) * IH;
    const hOf  = (amt: number) => (amt / yMax) * IH;

    const yTicks: number[] = [];
    for (let v = 0; v <= yMax + 1e-6; v += step) yTicks.push(Math.round(v));

    const total = data.reduce((s, d) => s + d.amount, 0);
    const avg   = total / Math.max(1, n);
    const avgY  = yOf(avg);

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
                        <stop offset="0%"   stopColor="#2f8ae0" />
                        <stop offset="100%" stopColor="#0268c0" />
                    </linearGradient>
                    <linearGradient id="ovBarHov" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0357a0" />
                        <stop offset="100%" stopColor="#013e78" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid + labels */}
                {yTicks.map((v) => {
                    const y = yOf(v);
                    return (
                        <g key={v}>
                            <line x1={PL} y1={y} x2={W - PR} y2={y}
                                stroke={v === 0 ? "#dbe0e6" : "#eef1f4"}
                                strokeWidth={v === 0 ? 1 : 1} />
                            <text x={PL - 8} y={y} textAnchor="end" dominantBaseline="middle"
                                fontSize={9} fill="#9aa7b8"
                                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                {fmtY(v)}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const h = d.amount > 0 ? Math.max(2, hOf(d.amount)) : 0;
                    const x = xMid(i) - barW / 2;
                    const y = PT + IH - h;
                    const isHov = hovered === i;
                    return (
                        <g key={d.date}>
                            {isHov && (
                                <rect x={PL + i * barSlot} y={PT} width={barSlot} height={IH}
                                    fill="#0268c0" opacity="0.06" />
                            )}
                            {h > 0 && (
                                <rect x={x} y={y} width={barW} height={h}
                                    fill={isHov ? "url(#ovBarHov)" : "url(#ovBarGrad)"}
                                    rx={Math.min(3, barW / 2)}
                                    style={{ transition: "fill 0.1s" }} />
                            )}
                            {/* Invisible wider hit area */}
                            <rect x={PL + i * barSlot} y={PT} width={barSlot} height={IH}
                                fill="transparent" style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHovered(i)} />
                        </g>
                    );
                })}

                {/* Average line + label (self-explains the orange dashed line) */}
                {avg > 0 && (
                    <g>
                        <line x1={PL} y1={avgY} x2={W - PR} y2={avgY}
                            stroke="#f59e0b" strokeWidth="1.25" strokeDasharray="4 3" />
                        <text x={PL + 3} y={avgY - 5} textAnchor="start"
                            fontSize={9} fontWeight={700} fill="#e08a00"
                            stroke="#ffffff" strokeWidth={2.5} paintOrder="stroke"
                            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                            avg {fmtAvg(avg)}/day
                        </text>
                    </g>
                )}

                {/* X-axis: a day number under every bar, month name at month starts */}
                {data.map((d, i) => {
                    const dt  = parseDate(d.date);
                    const day = dt.getDate();
                    const showMonth = i === 0 || day === 1;
                    const isHov = hovered === i;
                    return (
                        <g key={d.date}>
                            <text x={xMid(i)} y={PT + IH + 15} textAnchor="middle"
                                fontSize={8.5} fontWeight={isHov ? 700 : (showMonth ? 600 : 400)}
                                fill={isHov ? "#0268c0" : (showMonth ? "#5b6b7c" : "#9aa7b8")}
                                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                {day}
                            </text>
                            {showMonth && (
                                <text x={xMid(i)} y={PT + IH + 30} textAnchor="middle"
                                    fontSize={8.5} fontWeight={700} fill="#5b6b7c"
                                    fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                    {dt.toLocaleDateString("en-US", { month: "short" })}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* HTML tooltip */}
            {hovered !== null && (() => {
                const d   = data[hovered];
                const pct = (xMid(hovered) - PL) / IW;
                const onRight = pct < 0.6;
                return (
                    <div className="pointer-events-none absolute z-10"
                        style={{
                            left:  onRight ? `calc(${pct * 100}% + 10px)` : undefined,
                            right: !onRight ? `calc(${(1 - pct) * 100}% + 10px)` : undefined,
                            top:   "6px",
                        }}
                    >
                        <div className="min-w-28 rounded-xl bg-[#003060] px-3 py-2 shadow-[0px_10px_24px_-6px_rgba(0,48,96,0.5)]">
                            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                                {fmtDate(d.date)}
                            </p>
                            <p className="text-sm font-extrabold text-white">{fmtTooltip(d.amount)}</p>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
