"use client";

import { useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUR_MS  = 3_600_000;
const DAY_MS   = 86_400_000;
const MONTH_MS = 30 * DAY_MS;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Monotone cubic spline (Fritsch-Carlson) — smooth curves with zero overshoot.
 * Guarantees the interpolated curve stays monotone when the data is monotone,
 * so no backward loops on flat-to-spike transitions.
 */
function monotonePath(pts: [number, number][]): string {
    const n = pts.length;
    if (n === 0) return "";
    if (n === 1) return `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;

    // Step 1: segment slopes
    const dx: number[] = [];
    const dy: number[] = [];
    const d:  number[] = [];
    for (let i = 0; i < n - 1; i++) {
        dx[i] = pts[i + 1][0] - pts[i][0];
        dy[i] = pts[i + 1][1] - pts[i][1];
        d[i]  = dx[i] === 0 ? 0 : dy[i] / dx[i];
    }

    // Step 2: tangents at each point
    const m: number[] = new Array(n);
    m[0]     = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
        m[i] = (d[i - 1] + d[i]) / 2;
    }

    // Step 3: Fritsch-Carlson monotonicity fix
    for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        const α = m[i]     / d[i];
        const β = m[i + 1] / d[i];
        const h = Math.sqrt(α * α + β * β);
        if (h > 3) { m[i] = (3 / h) * α * d[i]; m[i + 1] = (3 / h) * β * d[i]; }
    }

    // Step 4: build cubic Bezier path
    let path = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
        const cp1x = pts[i][0]     + dx[i] / 3;
        const cp1y = pts[i][1]     + m[i]     * dx[i] / 3;
        const cp2x = pts[i + 1][0] - dx[i] / 3;
        const cp2y = pts[i + 1][1] - m[i + 1] * dx[i] / 3;
        path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${pts[i + 1][0].toFixed(2)} ${pts[i + 1][1].toFixed(2)}`;
    }
    return path;
}

function niceYTicks(max: number): number[] {
    const candidates = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const step = candidates.find((s) => max / s <= 6) ?? 100000;
    const top  = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    return ticks;
}

function fmtY(n: number): string {
    if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${+(n / 1_000).toFixed(1)}k`;
    return `${n}`;
}

function xTickStep(total: number): number {
    if (total <= 20)  return 1;
    if (total <= 50)  return 5;
    if (total <= 100) return 10;
    return 15;
}

// ── Series builders ───────────────────────────────────────────────────────────

type Point = { index: number; cum: number };

function buildHourSeries(startTs: number, endTs: number, donations: { ts: number; amount: number }[]) {
    const now        = Date.now();
    const totalHours = Math.max(1, Math.ceil((endTs - startTs) / HOUR_MS));
    let running = 0;
    const plotted: Point[] = [];
    for (let i = 0; i < totalHours; i++) {
        const hStart = startTs + i * HOUR_MS;
        const hEnd   = hStart + HOUR_MS;
        if (hStart > now) break;
        running += donations.filter((d) => d.ts >= hStart && d.ts < hEnd).reduce((s, d) => s + d.amount, 0);
        plotted.push({ index: i + 1, cum: running });
    }
    return { plotted, totalBuckets: totalHours };
}

function buildDaySeries(startTs: number, endTs: number, donations: { ts: number; amount: number }[]) {
    const now       = Date.now();
    const totalDays = Math.max(1, Math.floor((endTs - startTs) / DAY_MS) + 1);
    let running = 0;
    const plotted: Point[] = [];
    for (let i = 0; i < totalDays; i++) {
        const dayStart = startTs + i * DAY_MS;
        const dayEnd   = dayStart + DAY_MS;
        if (dayStart > now) break;
        running += donations.filter((d) => d.ts >= dayStart && d.ts < dayEnd).reduce((s, d) => s + d.amount, 0);
        plotted.push({ index: i + 1, cum: running });
    }
    return { plotted, totalBuckets: totalDays };
}

function buildMonthSeries(startTs: number, endTs: number, donations: { ts: number; amount: number }[]) {
    const now         = Date.now();
    const totalMonths = Math.max(1, Math.ceil((endTs - startTs) / MONTH_MS));
    let running = 0;
    const plotted: Point[] = [];
    for (let m = 0; m < totalMonths; m++) {
        const mStart = startTs + m * MONTH_MS;
        const mEnd   = mStart + MONTH_MS;
        if (mStart > now) break;
        running += donations.filter((d) => d.ts >= mStart && d.ts < mEnd).reduce((s, d) => s + d.amount, 0);
        plotted.push({ index: m + 1, cum: running });
    }
    return { plotted, totalBuckets: totalMonths };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Donation = { ts: number; amount: number };
type ViewMode = "hours" | "days" | "months";

type Props = {
    startTs:            number | null;
    endTs:              number | null;
    donations:          Donation[];
    goalAmount?:        number | null;
    initialGoalAmount?: number | null;
    title?:             string;
};

export default function DonationChart({
    startTs, endTs, donations, goalAmount, initialGoalAmount,
    title = "Progress towards your goal",
}: Props) {
    const now            = Date.now();
    const earliestDonTs  = donations.length > 0 ? Math.min(...donations.map((d) => d.ts)) : now;
    // Anchor the x-axis to whichever comes first: start_date or the earliest donation.
    // Only add a 1-hour buffer when donations exist *before* the start_date (pre-active / upcoming phase),
    // so the curve doesn't render flush against the left edge in that edge case.
    const hasPreStartDons = startTs != null && donations.length > 0 && earliestDonTs < startTs;
    const baseStart       = startTs != null ? Math.min(startTs, earliestDonTs) : earliestDonTs;
    const effectiveStart  = hasPreStartDons ? baseStart - HOUR_MS : (startTs ?? earliestDonTs);
    const effectiveEnd    = endTs ?? now;

    const durationMs     = effectiveEnd - effectiveStart;
    const durationDays   = durationMs / DAY_MS;
    const durationMonths = durationMs / MONTH_MS;

    const isSubDay  = durationDays < 1;
    const hasMonths = durationMonths >= 2;

    const defaultMode: ViewMode = isSubDay ? "hours" : "days";
    const [mode, setMode] = useState<ViewMode>(defaultMode);

    const effectiveMode: ViewMode =
        isSubDay ? "hours" : (mode === "months" && hasMonths ? "months" : "days");

    const { plotted, totalBuckets } =
        effectiveMode === "hours"  ? buildHourSeries(effectiveStart, effectiveEnd, donations)  :
        effectiveMode === "months" ? buildMonthSeries(effectiveStart, effectiveEnd, donations) :
                                     buildDaySeries(effectiveStart, effectiveEnd, donations);

    const totalRaised = plotted.length > 0 ? plotted[plotted.length - 1].cum : 0;
    const yTicks      = niceYTicks(Math.max(goalAmount ?? 0, initialGoalAmount ?? 0, totalRaised, 1));
    const yMax        = yTicks[yTicks.length - 1];

    const W  = 560, H = 220;
    const PL = 52, PR = 16, PT = 16, PB = 44;
    const pw = W - PL - PR;
    const ph = H - PT - PB;

    const plottedWithOrigin: Point[] = [{ index: 0, cum: 0 }, ...plotted];
    const xOf = (idx: number) => PL + (idx / Math.max(totalBuckets, 1)) * pw;
    const yOf = (v: number)   => PT + ph - (v / yMax) * ph;

    const pts: [number, number][] = plottedWithOrigin.map(({ index, cum }) => [xOf(index), yOf(cum)]);
    const linePath = monotonePath(pts);
    const baseY    = PT + ph;
    const areaPath = pts.length > 0
        ? `${linePath} L ${pts[pts.length - 1][0].toFixed(2)} ${baseY} L ${pts[0][0].toFixed(2)} ${baseY} Z`
        : "";
    const rocketPt = pts.length > 0 ? pts[pts.length - 1] : null;

    const step       = xTickStep(totalBuckets);
    const allIndices = Array.from({ length: totalBuckets + 1 }, (_, i) => i);
    const xAxisLabel = effectiveMode === "hours" ? "Hours" : effectiveMode === "months" ? "Months" : "Days";
    const showToggle = !isSubDay && hasMonths;

    // ── Tooltip state ─────────────────────────────────────────────────────────
    type TooltipInfo = {
        bucketIndex: number;  // 1-based bucket index
        cum:         number;
        added:       number;
        x:           number;  // SVG x coordinate
        y:           number;  // SVG y coordinate
        pct:         number;  // x as % of SVG width (for HTML overlay)
    };
    const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
    const svgRef       = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close tooltip when clicking outside the chart
    useEffect(() => {
        if (!tooltip) return;
        function handleOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setTooltip(null);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [tooltip]);

    function handleBucketClick(bucketIdx: number) {
        // bucketIdx is 1-based (matches Point.index)
        const point = plottedWithOrigin.find((p) => p.index === bucketIdx);
        const prevPt = plottedWithOrigin.find((p) => p.index === bucketIdx - 1);
        if (!point) return;

        const x   = xOf(bucketIdx);
        const y   = yOf(point.cum);
        const pct = ((x - PL) / pw) * 100;
        const added = point.cum - (prevPt?.cum ?? 0);

        setTooltip(tooltip?.bucketIndex === bucketIdx ? null : {
            bucketIndex: bucketIdx, cum: point.cum, added, x, y, pct,
        });
    }

    function bucketLabel(idx: number): string {
        if (effectiveMode === "hours")  return `Hour ${idx}`;
        if (effectiveMode === "months") return `Month ${idx}`;
        return `Day ${idx}`;
    }

    // ── Draw animation ────────────────────────────────────────────────────────
    const lineRef = useRef<SVGPathElement>(null);
    const areaRef = useRef<SVGPathElement>(null);
    const animKey = `${effectiveMode}-${donations.length}`;

    useEffect(() => {
        const line = lineRef.current;
        if (!line || !linePath) return;

        const len = line.getTotalLength();
        // Reset
        line.style.transition = "none";
        line.style.strokeDasharray  = `${len}`;
        line.style.strokeDashoffset = `${len}`;
        // Fade area in
        if (areaRef.current) {
            areaRef.current.style.transition = "none";
            areaRef.current.style.opacity    = "0";
        }
        // Kick off animation next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                line.style.transition       = "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)";
                line.style.strokeDashoffset = "0";
                if (areaRef.current) {
                    areaRef.current.style.transition = "opacity 1.6s ease";
                    areaRef.current.style.opacity    = "1";
                }
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animKey]);

    const fmtUSD = (n: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

    return (
        <div ref={containerRef} className="bg-white rounded-2xl border border-[#e7e9eb] shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] p-6">
            <div className="-mx-6 -mt-6 mb-5 flex items-center justify-between border-b border-[#e7e9eb] px-6 py-4">
                <h2 className="text-[18px] font-bold text-[#003060]">{title}</h2>
                {showToggle && (
                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setMode("days")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                effectiveMode === "days" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Days
                        </button>
                        <button
                            onClick={() => setMode("months")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                effectiveMode === "months" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Months
                        </button>
                    </div>
                )}
            </div>

            <div className="relative">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                style={{ display: "block", overflow: "visible", cursor: "pointer" }}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="dcBlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#73b2f4" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#cfe6fc" stopOpacity="0.03" />
                    </linearGradient>
                    <clipPath id="dcAreaClip">
                        <rect x={PL} y={PT} width={pw} height={ph} />
                    </clipPath>
                </defs>

                {/* Grid lines + Y labels */}
                {yTicks.map((v, i) => {
                    const y = yOf(v);
                    return (
                        <g key={i}>
                            <line
                                x1={PL} y1={y} x2={PL + pw} y2={y}
                                stroke="#e7e9eb"
                                strokeWidth={1}
                                strokeDasharray={v === 0 ? undefined : "0.5 6"}
                                strokeLinecap="round"
                            />
                            <text
                                x={PL - 8} y={y}
                                textAnchor="end" dominantBaseline="middle"
                                fontSize="12" fill="#7e8a96"
                                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                            >
                                {fmtY(v)}
                            </text>
                        </g>
                    );
                })}

                {/* Goal line(s) — two lines for open-ended scaled campaigns */}
                {goalAmount != null && goalAmount > 0 && initialGoalAmount && initialGoalAmount !== goalAmount ? (
                    <>
                        {initialGoalAmount <= yMax && (
                            <g>
                                <line x1={PL} y1={yOf(initialGoalAmount)} x2={PL + pw} y2={yOf(initialGoalAmount)}
                                    stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                                <text x={PL + pw + 4} y={yOf(initialGoalAmount)}
                                    dominantBaseline="middle" fontSize="9" fill="#22c55e"
                                    fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                    Initial
                                </text>
                            </g>
                        )}
                        {goalAmount <= yMax && (
                            <g>
                                <line x1={PL} y1={yOf(goalAmount)} x2={PL + pw} y2={yOf(goalAmount)}
                                    stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                                <text x={PL + pw + 4} y={yOf(goalAmount)}
                                    dominantBaseline="middle" fontSize="9" fill="#f59e0b"
                                    fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                    Scaled
                                </text>
                            </g>
                        )}
                    </>
                ) : goalAmount != null && goalAmount > 0 && goalAmount <= yMax ? (
                    <g>
                        <line x1={PL} y1={yOf(goalAmount)} x2={PL + pw} y2={yOf(goalAmount)}
                            stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
                        <text x={PL + pw + 4} y={yOf(goalAmount)}
                            dominantBaseline="middle" fontSize="9" fill="#22c55e"
                            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                            Goal
                        </text>
                    </g>
                ) : null}

                {/* Area fill — fades in */}
                {areaPath && (
                    <path
                        ref={areaRef}
                        d={areaPath}
                        fill="url(#dcBlueGrad)"
                        clipPath="url(#dcAreaClip)"
                        style={{ opacity: 0 }}
                    />
                )}

                {/* Step line — draws in */}
                {linePath && (
                    <path
                        ref={lineRef}
                        d={linePath}
                        fill="none"
                        stroke="#0278de"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        clipPath="url(#dcAreaClip)"
                    />
                )}

                {/* X-axis tick labels */}
                {allIndices.map((idx) => {
                    if (idx !== 0 && idx !== totalBuckets && idx % step !== 0) return null;
                    return (
                        <text
                            key={idx}
                            x={xOf(idx)} y={PT + ph + 16}
                            textAnchor="middle" fontSize="11" fill="#7e8a96"
                            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                        >
                            {idx === 0 ? "0" : effectiveMode === "months" ? `M${idx}` : idx}
                        </text>
                    );
                })}

                {/* X-axis label */}
                <text
                    x={PL + pw / 2} y={H - 4}
                    textAnchor="middle" fontSize="13" fontWeight="700" fill="#003060"
                    fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                >
                    {xAxisLabel}
                </text>

                {/* Rocket at tip */}
                {rocketPt && totalRaised > 0 && (
                    <image href="/assets/campaigns/rocket.svg" x={rocketPt[0] - 20} y={rocketPt[1] - 30} width={46} height={34} style={{ pointerEvents: "none" }} />
                )}

                {/* ── Click crosshair + dot ── */}
                {tooltip && (
                    <>
                        <line
                            x1={tooltip.x} y1={PT}
                            x2={tooltip.x} y2={PT + ph}
                            stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
                        />
                        <circle
                            cx={tooltip.x} cy={tooltip.y}
                            r="5" fill="#3b82f6" stroke="white" strokeWidth="2"
                        />
                    </>
                )}

                {/* ── Invisible hit areas per bucket ── */}
                {plotted.map((pt) => {
                    const x1 = xOf(pt.index - 1);
                    const x2 = xOf(pt.index);
                    return (
                        <rect
                            key={pt.index}
                            x={x1} y={PT}
                            width={x2 - x1} height={ph}
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => { e.stopPropagation(); handleBucketClick(pt.index); }}
                        />
                    );
                })}
            </svg>

            {/* ── HTML tooltip overlay ── */}
            {tooltip && (() => {
                // Position: pin left or right depending on which half
                const onRight = tooltip.pct < 55;
                const leftPct = onRight
                    ? `calc(${tooltip.pct}% + 10px)`
                    : undefined;
                const rightPct = !onRight
                    ? `calc(${100 - tooltip.pct}% + 10px)`
                    : undefined;

                return (
                    <div
                        className="absolute top-0 pointer-events-none z-10"
                        style={{
                            left:  leftPct,
                            right: rightPct,
                            top:   "12px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gray-900 text-white rounded-xl shadow-xl px-3.5 py-2.5 min-w-35 pointer-events-auto">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                {bucketLabel(tooltip.bucketIndex)}
                            </p>
                            <p className="text-base font-extrabold leading-tight">
                                {fmtUSD(tooltip.cum)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">cumulative raised</p>
                            {tooltip.added > 0 && (
                                <p className="text-xs text-green-400 font-semibold mt-1.5">
                                    +{fmtUSD(tooltip.added)} this {effectiveMode === "hours" ? "hour" : effectiveMode === "months" ? "month" : "day"}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })()}
            </div>
        </div>
    );
}
