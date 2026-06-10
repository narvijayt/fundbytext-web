"use client";

import { DONATE_EVENT } from "./DonateNavButton";
import type { ParticipantRow } from "../page";

type Props = {
    participants:      ParticipantRow[];
    goalAmount:        number | null;
    accent:            string;
    campaignSlug:      string;
    donationsEnabled:  boolean;
    status:            string;
};

function dispatchDonate(memberId: string) {
    window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId } }));
}

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Avatar({ name, photoUrl, size = "md", onDark = true }: { name: string; photoUrl: string | null; size?: "sm" | "md" | "lg"; onDark?: boolean }) {
    const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
    const colorCls  = onDark ? "bg-white/20 border-white/40 text-white" : "bg-blue-100 border-blue-200 text-blue-700";
    return (
        <div className={`${sizeClass} rounded-full border-2 ${colorCls} flex items-center justify-center font-bold shrink-0 overflow-hidden`}>
            {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
                name.charAt(0).toUpperCase()
            )}
        </div>
    );
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_LABELS = ["1st", "2nd", "3rd"];

function TrophyIcon({ variant }: { variant: "gold" | "silver" }) {
    const color = variant === "gold" ? "#FFD700" : "#C0C0C0";
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill={color}>
            <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.8-1.6 5.2-4 6.3V16h1a2 2 0 012 2v2H4v-2a2 2 0 012-2h1v-1.7C4.6 13.2 3 10.8 3 8V5a1 1 0 011-1h3zM5 6v2c0 1.9 1.1 3.6 2.8 4.4L9 13v3h6v-3l1.2-.6C17.9 11.6 19 9.9 19 8V6H5z"/>
            <path d="M8 18h8v2H8z"/>
        </svg>
    );
}

export default function Leaderboard({ participants, goalAmount, accent, donationsEnabled, status }: Props) {
    if (participants.length === 0) return null;

    const canDonate   = donationsEnabled && status === "active";

    const achievers   = goalAmount ? participants.filter((p) => p.total_raised >= goalAmount) : [];
    const inProgress  = goalAmount ? participants.filter((p) => p.total_raised < goalAmount)  : participants;
    const podiumThree = participants.slice(0, 3);
    const others      = participants.slice(3);

    return (
        <section style={{ background: "linear-gradient(160deg,#1a6fbf 0%,#1565C0 50%,#0d4fa8 100%)" }} className="py-16 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* ── Section title ──────────────────────────────────── */}
                <div className="text-center">
                    <div className="inline-flex flex-col items-center">
                        <span className="px-8 py-2 rounded-full text-white font-extrabold text-xl tracking-wide shadow-lg"
                            style={{ background: "linear-gradient(90deg, #1e40af, #1d4ed8)" }}>
                            Leaderboard
                        </span>
                        <p className="mt-2 text-white/70 text-sm">See who&apos;s leading the way!</p>
                    </div>
                </div>

                {/* ── Goal Achievers / Goal in Progress panels ────────── */}
                {goalAmount && (
                    <div className="grid sm:grid-cols-2 gap-6">
                        {/* Goal Achievers */}
                        <div className="bg-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-10">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="#FFD700">
                                    <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.8-1.6 5.2-4 6.3V16h1a2 2 0 012 2v2H4v-2a2 2 0 012-2h1v-1.7C4.6 13.2 3 10.8 3 8V5a1 1 0 011-1h3z"/>
                                </svg>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrophyIcon variant="gold" />
                                <h3 className="font-bold text-base text-gray-800">Goal Achievers</h3>
                            </div>
                            {achievers.length > 0 ? (
                                <ul className="space-y-3">
                                    {achievers.map((p, i) => (
                                        <li key={p.id}>
                                            <button
                                                onClick={() => canDonate && dispatchDonate(p.id)}
                                                disabled={!canDonate}
                                                className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                                            >
                                                <span className="text-gray-400 text-xs w-4 text-right">{i + 1}</span>
                                                <Avatar name={p.first_name} photoUrl={p.profile_photo_url} size="sm" onDark={false} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-800 text-xs font-semibold truncate">
                                                        {p.first_name} {p.last_name}
                                                    </p>
                                                </div>
                                                <span className="text-green-600 text-xs font-bold">{fmt(p.total_raised)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">No one yet — be the first!</p>
                            )}
                        </div>

                        {/* Goal in Progress */}
                        <div className="bg-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-10">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="#C0C0C0">
                                    <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.8-1.6 5.2-4 6.3V16h1a2 2 0 012 2v2H4v-2a2 2 0 012-2h1v-1.7C4.6 13.2 3 10.8 3 8V5a1 1 0 011-1h3z"/>
                                </svg>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrophyIcon variant="silver" />
                                <h3 className="font-bold text-base text-gray-800">Goal in Progress</h3>
                            </div>
                            {inProgress.length > 0 ? (
                                <ul className="space-y-3">
                                    {inProgress.slice(0, 5).map((p, i) => {
                                        const pct = Math.min(100, goalAmount > 0 ? (p.total_raised / goalAmount) * 100 : 0);
                                        return (
                                            <li key={p.id} className="space-y-1">
                                                <button
                                                    onClick={() => canDonate && dispatchDonate(p.id)}
                                                    disabled={!canDonate}
                                                    className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                                                >
                                                    <span className="text-gray-400 text-xs w-4 text-right">{i + 1}</span>
                                                    <Avatar name={p.first_name} photoUrl={p.profile_photo_url} size="sm" onDark={false} />
                                                    <p className="flex-1 text-gray-800 text-xs font-semibold truncate">
                                                        {p.first_name} {p.last_name}
                                                    </p>
                                                    <span className="text-gray-500 text-xs">{fmt(p.total_raised)}</span>
                                                </button>
                                                <div className="ml-10 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${pct}%`, background: "#f97316" }}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">All participants achieved their goal!</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Podium — Top 3 ─────────────────────────────────── */}
                {podiumThree.length > 0 && (
                    <div className="flex items-end justify-center gap-4">
                        {([1, 0, 2] as const)
                            .filter((i) => podiumThree[i])
                            .map((rankIndex) => {
                                const p          = podiumThree[rankIndex];
                                const isFirst    = rankIndex === 0;
                                const medalColor = MEDAL_COLORS[rankIndex];
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => canDonate && dispatchDonate(p.id)}
                                disabled={!canDonate}
                                        className={`flex flex-col items-center gap-2 flex-1 max-w-40 group hover:opacity-90 transition-opacity ${isFirst ? "pb-6" : "pb-0"}`}
                                    >
                                        {isFirst && <div className="text-2xl">👑</div>}
                                        <Avatar name={p.first_name} photoUrl={p.profile_photo_url} size="lg" />
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-lg"
                                            style={{ background: medalColor }}
                                        >
                                            {rankIndex + 1}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-sm leading-tight">
                                                {p.first_name} {p.last_name}
                                            </p>
                                            <p className="text-white/80 text-xs font-semibold">{fmt(p.total_raised)}</p>
                                        </div>
                                        <div
                                            className="w-full rounded-t-xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                                            style={{
                                                background: isFirst ? medalColor : `${medalColor}CC`,
                                                height: isFirst ? 64 : rankIndex === 1 ? 44 : 32,
                                            }}
                                        >
                                            {MEDAL_LABELS[rankIndex]}
                                        </div>
                                    </button>
                                );
                            })}
                    </div>
                )}

                {/* ── Other Participants table ────────────────────────── */}
                {others.length > 0 && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-sm">Other Participants</h3>
                            {goalAmount && (
                                <span className="text-xs text-gray-400">
                                    Campaign Goal: <span className="font-semibold text-gray-600">{fmt(goalAmount)}</span>
                                </span>
                            )}
                        </div>
                        <ul className="divide-y divide-gray-50">
                            {others.map((p, i) => {
                                const rank = i + 4;
                                const pct  = goalAmount && goalAmount > 0
                                    ? Math.min(100, (p.total_raised / goalAmount) * 100)
                                    : 0;
                                return (
                                    <li key={p.id}>
                                        <button
                                            onClick={() => canDonate && dispatchDonate(p.id)}
                                disabled={!canDonate}
                                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <span className="text-gray-400 text-xs font-bold w-5 text-right">{rank}</span>
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                                                style={{ background: accent }}
                                            >
                                                {p.profile_photo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.profile_photo_url} alt={p.first_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    p.first_name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {p.first_name} {p.last_name}
                                                </p>
                                                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${pct}%`, background: "#22c55e" }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-gray-800">{fmt(p.total_raised)}</p>
                                                {goalAmount && (
                                                    <p className="text-[10px] text-gray-400">{fmt(goalAmount)} goal</p>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
