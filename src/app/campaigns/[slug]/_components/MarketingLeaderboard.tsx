"use client";

import Image from "next/image";
import { DONATE_EVENT } from "./DonateNavButton";
import type { ParticipantRow } from "../page";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

// Green-on-green diagonal stripes + a subtle striped gray track — matches the
// dashboard CampaignProgressBar and the public-page progress bar exactly.
const GREEN_STRIPES = "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 7px,#23b257 7px,#23b257 14px)";
const TRACK_STRIPES = "repeating-linear-gradient(-45deg,#eff1f4,#eff1f4 7px,#e4e7eb 7px,#e4e7eb 14px)";
const MEDALS = ["medal-gold", "medal-silver", "medal-bronze"];
const TINTS = [
    "linear-gradient(225deg, #ffe5b2 16.667%, #ffffff 43.333%)",
    "linear-gradient(225deg, #d4dee7 16.667%, #ffffff 43.333%)",
    "linear-gradient(225deg, #ebd4b1 16.667%, #ffffff 43.333%)",
];

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function dispatchDonate(memberId: string) {
    window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId } }));
}

function Avatar({ name, url, className, ring }: { name: string; url: string | null; className: string; ring?: boolean }) {
    return (
        <div className={`bg-[#f4f8f9] overflow-hidden relative rounded-full shrink-0 ${ring ? "ring-2 ring-white/70" : ""} ${className}`}>
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <span className="absolute inset-0 flex items-center justify-center font-black text-[#0268c0]">{name.charAt(0).toUpperCase()}</span>
            )}
        </div>
    );
}

/* Green "$X Raised" pill (Layout A in-progress + highlighted rows). */
function RaisedPill({ amount }: { amount: number }) {
    return (
        <span className="relative shrink-0 overflow-hidden rounded-full px-[12px] py-[5px]" style={{ background: GREEN_STRIPES }}>
            <span className="relative text-[12px] text-white whitespace-nowrap">
                <span className="font-black">{fmt(amount)}</span>
                <span className="font-medium"> Raised</span>
            </span>
        </span>
    );
}

/* Green "raised" bar on a gray track (Layout B podium + table). */
function Bar({ raised, pct, goal, glow, showAmount = true }: { raised: number; pct: number; goal?: number | null; glow?: boolean; showAmount?: boolean }) {
    return (
        <div className="flex-1 h-[32px] min-w-0 relative rounded-full overflow-hidden" style={{ background: TRACK_STRIPES }}>
            <div
                className="absolute left-0 top-0 h-full overflow-hidden rounded-full"
                style={{ width: `${Math.max(pct, raised > 0 ? 12 : 0)}%`, background: GREEN_STRIPES, boxShadow: glow ? "0px 0px 12px 0px rgba(40,196,93,0.5)" : undefined }}
            />
            {showAmount && (
                <p className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-white whitespace-nowrap drop-shadow">
                    <span className="font-black" style={{ lineHeight: 1.25 }}>{fmt(raised)}</span>
                    <span className="font-medium leading-none"> Raised</span>
                </p>
            )}
            {showAmount && goal != null && (
                <p className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[14px] text-[#aeb5bd] text-right whitespace-nowrap">
                    <span className="font-black">{fmt(goal)} </span><span className="font-normal">Goal</span>
                </p>
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
        </div>
    );
}

// ── Layout A panel (Goal Achievers / Goal in Progress) ──────────────────────────
function AchieverPanel({
    title, medal, rows, mode, showAmounts, accent, highlightMemberId, onDonate,
}: {
    title: string;
    medal: string;
    rows: ParticipantRow[];
    mode: "achievers" | "progress";
    showAmounts: boolean;
    accent: string;
    highlightMemberId: string | null;
    onDonate: ((id: string) => void) | null;
}) {
    return (
        <div className="relative w-full xl:flex-1 overflow-hidden rounded-[20px] bg-white p-[24px] md:p-[32px]" style={{ boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
            <Image src={`${A}/leaderboard/${medal}.png`} alt="" width={180} height={180} className="absolute right-[-44px] top-[-44px] size-[150px] max-w-none pointer-events-none" />
            <h3 className="relative mb-[20px] font-black text-[24px] text-[#003060]" style={{ lineHeight: 1.15 }}>{title}</h3>
            <div className="relative">
                {rows.length === 0 ? (
                    <p className="py-[40px] text-center text-[15px] text-[#aeb5bd]">
                        {mode === "achievers" ? "No one has hit their goal yet — be the first!" : "Everyone reached their goal! 🎉"}
                    </p>
                ) : (
                    <div className="flex max-h-[392px] flex-col gap-[8px] overflow-y-auto pr-1">
                        {rows.map((p) => {
                            const hl = mode === "progress" && p.id === highlightMemberId;
                            const clickable = !!onDonate;
                            const inner = hl ? (
                                <div className="flex items-center gap-[12px] rounded-full py-[8px] pl-[8px] pr-[14px]" style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 100%)` }}>
                                    <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[40px]" ring />
                                    <span className="flex-1 min-w-0 truncate font-black text-[16px] text-white" style={{ lineHeight: 1.2 }}>{p.first_name} {p.last_name}</span>
                                    {clickable && (
                                        <svg className="size-[18px] shrink-0 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                                    )}
                                    {showAmounts && <RaisedPill amount={p.total_raised} />}
                                </div>
                            ) : (
                                <div className="flex items-center gap-[12px] px-[8px] py-[6px]">
                                    <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[40px]" />
                                    <span className="flex-1 min-w-0 truncate font-bold text-[16px] text-[#003060]" style={{ lineHeight: 1.2 }}>{p.first_name} {p.last_name}</span>
                                    {mode === "progress" && showAmounts && <RaisedPill amount={p.total_raised} />}
                                </div>
                            );
                            return clickable ? (
                                <button key={p.id} type="button" onClick={() => onDonate!(p.id)} className="block w-full text-left transition-opacity hover:opacity-90">{inner}</button>
                            ) : (
                                <div key={p.id}>{inner}</div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MarketingLeaderboard({
    participants, goalAmount, perParticipantGoal, theme, highlightMemberId, canDonate,
    isParticipantGoal, showAmounts,
}: {
    participants: ParticipantRow[];
    goalAmount: number | null;
    perParticipantGoal: number | null;
    theme: MarketingTheme;
    highlightMemberId: string | null;
    canDonate: boolean;
    isParticipantGoal: boolean;
    showAmounts: boolean;
}) {
    if (participants.length === 0) return null;
    const { accent } = theme;
    const onDonate = canDonate ? dispatchDonate : null;
    const barPct = (raised: number) => perParticipantGoal && perParticipantGoal > 0 ? Math.min(100, (raised / perParticipantGoal) * 100) : (raised > 0 ? 100 : 0);
    const clickProps = (id: string) => canDonate ? { onClick: () => dispatchDonate(id), className: "cursor-pointer" } : {};

    // Layout A (participant goal): split into achievers / in-progress by per-participant goal.
    const achievers  = perParticipantGoal != null ? participants.filter((p) => p.total_raised >= perParticipantGoal!) : [];
    const inProgress = perParticipantGoal != null ? participants.filter((p) => p.total_raised <  perParticipantGoal!) : participants;

    // Layout B (org goal): rank by amount → podium + table.
    const top3   = participants.slice(0, 3);
    const others = participants.slice(3);

    return (
        <div className="relative overflow-hidden pt-[40px] md:pt-[80px] xl:pt-[112px] pb-[40px] md:pb-[80px] xl:pb-[112px]" style={{ background: accent }}>
            {theme.themeImage && (
                /* Tile at native motif size (matches the theme picker / hero) instead of
                   stretching one copy down a tall band, which ballooned the motif. */
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[1047px] opacity-[0.1] pointer-events-none"
                    style={{
                        backgroundImage: `url('${theme.themeImage}')`,
                        backgroundRepeat: "repeat",
                        backgroundSize: theme.themeSize,
                    }}
                />
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(180deg, ${theme.secondary}33 0%, transparent 40%)` }} />

            <div className="relative flex flex-col items-center px-[16px] md:px-[24px] xl:px-0">
                {/* Plaque + ribbon */}
                <div className="relative pb-[52px] md:pb-[72px]">
                    <div className="relative flex flex-col items-center overflow-hidden p-[17px] md:p-[24px] rounded-[28px] md:rounded-[40px] w-[313px] h-[130px] md:w-[532px] md:h-[180px]" style={{ background: `linear-gradient(180deg, ${accent} 0%, ${theme.secondary} 120%)`, boxShadow: "0px 30px 30px -10px rgba(0,48,96,0.3)" }}>
                        <div className="relative w-full h-[96px] md:h-[132px] rounded-[17px] md:rounded-[24px]" style={{ background: `linear-gradient(180deg, ${accent} 18%, ${theme.secondary} 130%)`, boxShadow: "0px 0px 40px 0px rgba(0,48,96,0.4)" }}>
                            <span aria-hidden className="absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0px -4px 8px 0px rgba(0,48,96,0.1), inset 0px 4px 8px -3px rgba(255,255,255,0.5)" }} />
                        </div>
                        <p className="absolute left-1/2 top-[65px] md:top-[90px] -translate-x-1/2 -translate-y-1/2 font-black text-[33px] md:text-[46px] text-white text-center tracking-[-1.5px] leading-none whitespace-nowrap" style={{ textShadow: "0px 0px 16px rgba(0,48,96,0.6), 0px 0px 4px rgba(0,48,96,0.6)" }}>Leaderboard</p>
                        <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 5px 4px -3px rgba(255,255,255,0.5)" }} />
                    </div>
                    <div className="absolute left-1/2 top-[100px] md:top-[128px] -translate-x-1/2 z-10 w-[290px] md:w-[460px]">
                        <div className="relative flex items-center justify-center gap-[10px] md:gap-[16px] px-[40px] py-[8px] md:py-[12px]" style={{ background: theme.secondary, clipPath: "polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%, 5% 50%)" }}>
                            <span aria-hidden className="rounded-full shrink-0 size-[7px] md:size-[11px] bg-white/70" />
                            <p className="font-bold text-[12px] md:text-[20px] text-white text-center whitespace-nowrap" style={{ lineHeight: 1.25 }}>See who&rsquo;s leading the way!</p>
                            <span aria-hidden className="rounded-full shrink-0 size-[7px] md:size-[11px] bg-white/70" />
                        </div>
                    </div>
                </div>

                {isParticipantGoal ? (
                    /* ── Layout A — Goal Achievers / Goal in Progress ── */
                    <div className="flex w-full max-w-[1152px] flex-col gap-[24px] xl:flex-row xl:items-start">
                        <AchieverPanel title="Goal Achievers" medal="medal-gold" rows={achievers} mode="achievers" showAmounts={showAmounts} accent={accent} highlightMemberId={highlightMemberId} onDonate={onDonate} />
                        <AchieverPanel title="Goal in Progress" medal="medal-silver" rows={inProgress} mode="progress" showAmounts={showAmounts} accent={accent} highlightMemberId={highlightMemberId} onDonate={onDonate} />
                    </div>
                ) : (
                    /* ── Layout B — podium + Other Participants table ── */
                    <>
                        <div className="flex flex-col xl:flex-row gap-[24px] items-stretch w-full max-w-[1152px]">
                            {top3.map((p, i) => (
                                <div key={p.id} {...clickProps(p.id)} className={`flex w-full xl:flex-1 flex-col gap-[24px] items-start min-w-0 overflow-hidden p-[32px] relative rounded-[20px] ${canDonate ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`} style={{ backgroundImage: TINTS[i], boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
                                    <Image src={`${A}/leaderboard/${MEDALS[i]}.png`} alt="" width={200} height={200} className="absolute right-[-54px] top-[-54px] size-[200px] max-w-none" />
                                    <div className="flex gap-[16px] items-center px-[8px] w-full">
                                        <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[64px]" />
                                        <p className="text-[20px] text-[#003060] min-w-0">
                                            <span className="block font-black truncate" style={{ lineHeight: 1.25 }}>{p.first_name}</span>
                                            <span className="block font-medium truncate" style={{ lineHeight: 1.15 }}>{p.last_name}</span>
                                        </p>
                                    </div>
                                    <div className="flex w-full"><Bar raised={p.total_raised} pct={barPct(p.total_raised)} glow={i === 0} showAmount={showAmounts} /></div>
                                </div>
                            ))}
                        </div>

                        {others.length > 0 && (
                            <div className="bg-white border border-[#eff4f9] flex flex-col gap-[24px] items-start overflow-hidden pb-[24px] pt-[24px] px-[16px] md:pb-[40px] md:pt-[32px] md:px-[40px] rounded-[20px] w-full max-w-[1152px] mt-[32px]" style={{ boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
                                <div className="flex flex-col gap-[8px] items-start md:flex-row md:items-center md:justify-between w-full">
                                    <h3 className="font-black text-[20px] md:text-[24px] text-[#003060]" style={{ lineHeight: 1.15 }}>Other Participants</h3>
                                    {goalAmount != null && (
                                        <p className="text-[20px] md:text-[24px] text-[#003060] tracking-[-0.5px] whitespace-nowrap" style={{ lineHeight: 1.15 }}>
                                            <span className="font-light">Campaign Goal: </span><span className="font-black">{fmt(goalAmount)}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <div className="border border-[#d4dee7] flex flex-col items-start overflow-hidden rounded-[16px] w-full min-w-[680px]">
                                        <div className="border-b border-[#d4dee7] flex gap-[24px] items-center px-[24px] md:px-[32px] xl:px-[48px] py-[16px] w-full font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none">
                                            <span className="w-[48px] xl:w-[80px] shrink-0">Rank</span>
                                            <span className="flex-1 min-w-0">Participant Name</span>
                                            <span className="flex-1 min-w-0">Amount Raised</span>
                                        </div>
                                        <div className="bg-white flex flex-col items-start w-full">
                                            {others.map((p, i) => {
                                                const rank = i + 4;
                                                const hl = p.id === highlightMemberId;
                                                return (
                                                    <div key={p.id} {...clickProps(p.id)} className={`flex gap-[24px] items-center px-[24px] md:px-[32px] xl:px-[48px] py-[16px] w-full border-b border-[#d4dee7] ${canDonate ? "hover:bg-[#f8fafc]" : ""} ${hl ? "rounded-[44px]" : ""}`} style={hl ? { backgroundImage: `linear-gradient(172.92deg, ${accent} 0%, ${accent}dd 52%, ${accent} 100%)` } : undefined}>
                                                        <span className="h-[24px] w-[48px] xl:w-[80px] relative shrink-0">
                                                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full size-[24px] ${hl ? "bg-white" : "bg-[#aeb5bd]"}`}>
                                                                <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[14px] leading-none ${hl ? "" : "text-white"}`} style={hl ? { color: accent } : undefined}>{rank}</span>
                                                            </span>
                                                        </span>
                                                        <div className="flex flex-1 gap-[16px] xl:gap-[24px] items-center min-w-0">
                                                            <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[48px]" />
                                                            <p className={`text-[16px] md:text-[18px] truncate w-[140px] md:w-[200px] xl:w-[292px] ${hl ? "text-white font-black" : "text-[#003060] font-bold"}`} style={{ lineHeight: 1.15 }}>{p.first_name} {p.last_name}</p>
                                                        </div>
                                                        <Bar raised={p.total_raised} pct={barPct(p.total_raised)} goal={perParticipantGoal} showAmount={showAmounts} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
