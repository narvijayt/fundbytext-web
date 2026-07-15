"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DONATE_EVENT } from "./DonateNavButton";
import type { ParticipantRow } from "../page";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

// Green-on-green diagonal stripes for the fill (same as the dashboard/public
// progress bars). The empty track is PLAIN light gray per the Figma leaderboard
// bars — unlike the main progress bar, it carries no stripes.
const GREEN_STRIPES = "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 7px,#23b257 7px,#23b257 14px)";
const TRACK_BG = "#f2f2f2";

// The active-participant highlight (the viewer's own / a clicked card + row) takes
// the campaign's SECOND colour (theme.secondary) chosen at creation, so it matches
// the selected palette rather than a fixed navy. Resting cards stay white. These
// build the gradients/solid from whatever `secondary` is (a dark colour by design,
// so the white card text stays legible).
const hlSurfaces = (secondary: string) => ({
    card:  `linear-gradient(180deg, ${secondary} 0%, color-mix(in oklch, ${secondary} 68%, white) 100%)`,
    row:   `linear-gradient(172.92deg, ${secondary} 0%, color-mix(in srgb, ${secondary} 88%, #000) 52%, ${secondary} 100%)`,
    rowA:  `linear-gradient(90deg, ${secondary} 0%, color-mix(in srgb, ${secondary} 80%, transparent) 100%)`,
    rank:  secondary,
});
// Full medal art WITH the sunburst rays (the Figma "shades"). Positioned so the
// coin + number sit on the card while the medal's top-right corner (which carries a
// stray blue export pixel) overflows off-card and is clipped by overflow-hidden.
const MEDALS = ["medal-gold", "medal-silver", "medal-bronze"];
// The medal PNG's baked glow reaches the square image edge, so unmasked it shows a
// rectangular "fog" box on the card. Both masks fade it to a soft radial edge (no box):
//  • RAY_MASK keeps the full sunburst but tapers it to transparent well inside the
//    square, so white cards get the Figma rays with no boundary.
//  • COIN_MASK crops down to just the coin for the highlighted card, so the selected
//    second colour fills the whole card instead of the rays washing out its right half.
const RAY_MASK  = "radial-gradient(circle at 64% 40%, #000 40%, transparent 70%)";
const COIN_MASK = "radial-gradient(circle 63px at 64% 38%, #000 82%, transparent 100%)";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ── Section banner — the same plaque + notched-ribbon construction as the
   campaign-creation StepBanner (create/_components/ui.tsx), themed to the
   campaign's accent/secondary so the two headers read identically. */
function BannerDot({ className, accent, secondary }: { className?: string; accent: string; secondary: string }) {
    return (
        <span className={`relative shrink-0 rounded-full ${className}`} style={{ background: accent }}>
            <span className="absolute inset-0 rounded-full" style={{ boxShadow: `inset 0px 3.5px 0px 0px ${secondary}` }} />
        </span>
    );
}

function LeaderboardBanner({ title, subtitle, accent, secondary }: { title: string; subtitle: string; accent: string; secondary: string }) {
    const plaqueRef = useRef<HTMLDivElement>(null);
    const subRef = useRef<HTMLParagraphElement>(null);
    // Ribbon width = max(plaque + flared tips, subtitle + dots/notch padding),
    // measured like the StepBanner so the tips always flare past the plaque.
    const [ribbonW, setRibbonW] = useState<number | null>(null);
    useEffect(() => {
        function update() {
            const pl = plaqueRef.current, sub = subRef.current;
            if (!pl || !sub) return;
            const isSm = window.matchMedia("(min-width: 640px)").matches;
            const flare = isSm ? 88 : 52;
            const subPad = isSm ? 150 : 96;
            setRibbonW(Math.round(Math.max(pl.offsetWidth + flare, sub.offsetWidth + subPad)));
        }
        update();
        const ro = new ResizeObserver(update);
        if (plaqueRef.current) ro.observe(plaqueRef.current);
        if (subRef.current) ro.observe(subRef.current);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [title, subtitle]);

    // StepBanner's fixed blues, derived from the theme. Both plaque stops sit a
    // touch above the accent so the plaque reads against the accent band (whose
    // halo brightens it); the ribbon darkens toward secondary like the original.
    const plaqueTop   = `color-mix(in oklch, ${accent} 91%, white)`;
    const lightAccent = `color-mix(in oklch, ${accent} 72%, white)`;
    const ribbonBg    = `color-mix(in srgb, ${accent} 60%, ${secondary})`;
    const textHalo    = `color-mix(in srgb, ${accent} 75%, ${secondary})`;

    return (
        <div className="flex flex-col items-center select-none">
            {/* Plaque (outer frame + inner panel) */}
            <div
                ref={plaqueRef}
                className="relative flex justify-center overflow-hidden rounded-t-[22px] sm:rounded-t-[32px] px-[13px] pt-[13px] sm:px-[18px] sm:pt-[18px]"
                style={{ background: `linear-gradient(180deg, ${plaqueTop} 0%, ${lightAccent} 66.111%)`, boxShadow: "0px 22px 24px -10px rgba(0,48,96,0.3)" }}
            >
                <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0px 5px 4px -3px rgba(255,255,255,0.55)" }} />
                <div
                    className="relative flex items-center justify-center rounded-t-[14px] sm:rounded-t-[19px] px-[26px] pt-[22px] pb-[12px] sm:px-[44px] sm:pt-[30px] sm:pb-[16px]"
                    style={{ background: `linear-gradient(180deg, ${plaqueTop} 17.803%, ${lightAccent} 71.97%)`, boxShadow: "0px 0px 30px 0px rgba(0,48,96,0.4)" }}
                >
                    <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0px -4px 8px 0px rgba(0,48,96,0.1), inset 0px 4px 8px -3px rgba(255,255,255,0.55)" }} />
                    <h2
                        className="relative font-black text-white text-center whitespace-nowrap leading-none text-[20px] sm:text-[27px] xl:text-[32px]"
                        style={{ textShadow: `0px 0px 16px ${textHalo}, 0px 0px 4px ${textHalo}`, letterSpacing: "-1.2px" }}
                    >
                        {title}
                    </h2>
                </div>
            </div>

            {/* Ribbon (notched banner via clip-path) */}
            <div className="relative -mt-px flex items-center justify-center h-[30px] w-[270px] sm:h-[50px] sm:w-[470px]" style={{ width: ribbonW ?? undefined }}>
                <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(0 0, 100% 0, 94.35% 50%, 100% 100%, 0 100%, 5.65% 50%)", background: ribbonBg }}>
                    <span className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(115deg, transparent 0 7px, rgba(0,0,0,0.07) 7px 8px)" }} />
                </div>
                <div className="relative flex items-center justify-center gap-[8px] sm:gap-[12px] px-[32px]">
                    <BannerDot className="size-[6px] sm:size-[9px]" accent={accent} secondary={secondary} />
                    <p ref={subRef} className="font-bold text-white text-center whitespace-nowrap text-[11px] sm:text-[14px] xl:text-[15px]" style={{ lineHeight: 1.25 }}>
                        {subtitle}
                    </p>
                    <BannerDot className="size-[6px] sm:size-[9px]" accent={accent} secondary={secondary} />
                </div>
            </div>
        </div>
    );
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

/* Green "$X Raised" pill (Layout A in-progress + highlighted rows). Organizers
   additionally see the percentage of the per-participant goal ("· N%"). */
function RaisedPill({ amount, pct, showPercent }: { amount: number; pct?: number; showPercent?: boolean }) {
    return (
        <span className="relative shrink-0 overflow-hidden rounded-full px-[12px] py-[5px]" style={{ background: GREEN_STRIPES }}>
            <span className="relative text-[11px] md:text-[12px] text-white whitespace-nowrap">
                <span className="font-black">{fmt(amount)}</span>
                <span className="font-medium"> Raised</span>
                {showPercent && pct != null && <span className="font-semibold text-white/85"> · {Math.round(pct)}%</span>}
            </span>
        </span>
    );
}

/* Green "raised" bar on a gray track (Layout B podium + table). Members see
   dollar amounts + the per-participant goal; the public sees "N% Raised" with no
   dollar figures (per the Figma "Organization view" leaderboard variant). */
function Bar({ raised, pct, glow, showAmounts = true, showPercent = false, hasPct = true }: { raised: number; pct: number; glow?: boolean; showAmounts?: boolean; showPercent?: boolean; hasPct?: boolean }) {
    // Members always get a "$X Raised" label; the public gets "N% Raised" only when a
    // real goal exists to be a percentage of (hasPct). With no goal, the public bar is a
    // bare relative ranking — no untruthful percentage. A $0 participant still gets a
    // label ("$0 Raised" / "0% Raised") so the bar is never blank; with no green fill
    // behind it the text drops to a readable muted grey on the track.
    const filled = raised > 0;
    const showLabel = showAmounts || hasPct;
    return (
        <div className="flex-1 h-[32px] min-w-0 relative rounded-full overflow-hidden" style={{ background: TRACK_BG }}>
            <style>{`@keyframes lb-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}`}</style>
            <div
                className="absolute left-0 top-0 h-full overflow-hidden rounded-full"
                style={{ width: `${Math.max(pct, raised > 0 ? 12 : 0)}%`, background: GREEN_STRIPES, boxShadow: glow ? "0px 0px 12px 0px rgba(40,196,93,0.5)" : undefined }}
            >
                {/* Shine sweeping the fill — same treatment as the hero progress bar. */}
                <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[35%]"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5) 50%,transparent)", animation: "lb-shimmer 2.2s ease-in-out infinite" }}
                />
            </div>
            {showLabel && (
                <p className={`absolute left-[12px] top-1/2 -translate-y-1/2 text-[12px] md:text-[14px] whitespace-nowrap ${filled ? "text-white drop-shadow" : "text-[#6b7684]"}`}>
                    <span className="font-black" style={{ lineHeight: 1.25 }}>{showAmounts ? fmt(raised) : `${Math.round(pct)}%`}</span>
                    <span className="font-medium leading-none"> Raised</span>
                    {/* Organizers see the dollar amount AND the percentage of goal. */}
                    {showAmounts && showPercent && hasPct && filled && <span className="font-semibold text-white/85"> · {Math.round(pct)}%</span>}
                </p>
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
        </div>
    );
}

// ── Layout A panel (Goal Achievers / Goal in Progress) ──────────────────────────
function AchieverPanel({
    title, medal, rows, mode, showAmounts, showPercent, pctOf, highlightMemberId, onDonate, hlRow,
}: {
    title: string;
    medal: string;
    rows: ParticipantRow[];
    mode: "achievers" | "progress";
    showAmounts: boolean;
    showPercent: boolean;
    pctOf: (raised: number) => number;
    highlightMemberId: string | null;
    onDonate: ((id: string) => void) | null;
    hlRow: string;
}) {
    return (
        <div className="relative w-full xl:flex-1 overflow-hidden rounded-[20px] bg-white p-[24px] md:p-[32px]" style={{ boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
            <Image src={`${A}/leaderboard/${medal}.png`} alt="" width={180} height={180} className="absolute right-[-44px] top-[-44px] size-[150px] max-w-none pointer-events-none" />
            <h3 className="relative mb-[20px] font-black text-[20px] md:text-[24px] text-[#003060]" style={{ lineHeight: 1.15 }}>{title}</h3>
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
                            // On phones the pill wraps to its own line under the name
                            // (per the mobile Figma); from md up everything sits inline.
                            const inner = hl ? (
                                <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px] rounded-[24px] md:rounded-full py-[8px] pl-[8px] pr-[14px]" style={{ background: hlRow }}>
                                    <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[40px]" ring />
                                    <span className="flex-1 min-w-0 truncate font-black text-[14px] md:text-[16px] text-white" style={{ lineHeight: 1.2 }}>{p.first_name} {p.last_name}</span>
                                    <span className="flex basis-full md:basis-auto items-center gap-[10px] min-w-0">
                                        {clickable && (
                                            <svg className="size-[18px] shrink-0 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                                        )}
                                        {showAmounts && <RaisedPill amount={p.total_raised} pct={pctOf(p.total_raised)} showPercent={showPercent} />}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px] px-[8px] py-[6px]">
                                    <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[40px]" />
                                    <span className="flex-1 min-w-0 truncate font-bold text-[14px] md:text-[16px] text-[#003060]" style={{ lineHeight: 1.2 }}>{p.first_name} {p.last_name}</span>
                                    {mode === "progress" && showAmounts && <span className="flex basis-full md:basis-auto min-w-0"><RaisedPill amount={p.total_raised} pct={pctOf(p.total_raised)} showPercent={showPercent} /></span>}
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
    participants, goalAmount, perParticipantGoal, theme, canDonate,
    isParticipantGoal, showAmounts, isOrganizer = false,
}: {
    participants: ParticipantRow[];
    goalAmount: number | null;
    perParticipantGoal: number | null;
    theme: MarketingTheme;
    highlightMemberId: string | null;
    canDonate: boolean;
    isParticipantGoal: boolean;
    showAmounts: boolean;
    isOrganizer?: boolean;
}) {
    // No participant is highlighted by default — nothing is auto-selected, so no card
    // shows the second-colour background on load. A card only takes the active
    // treatment once the viewer clicks it, which also opens the donate modal targeted
    // at that participant. Organizers additionally see the % of goal on each bar.
    const [selectedId, setSelectedId] = useState<string | null>(null);
    if (participants.length === 0) return null;
    const { accent, secondary } = theme;
    const HL = hlSurfaces(secondary);
    const activeId = selectedId;
    const onSelect = canDonate ? (id: string) => { setSelectedId(id); dispatchDonate(id); } : null;
    // Progress denominator depends on the goal type:
    //  • participant goal (Layout A) → each participant has their OWN target, so the
    //    bar/percentage measures raised ÷ per-participant goal.
    //  • organization goal (Layout B) → there is NO per-participant target; everyone
    //    contributes to the SAME shared campaign goal, so a participant's bar/percentage
    //    is their share of that one goal (raised ÷ campaign goal). Bars stay proportional
    //    to the amount raised, so the leader still has the longest bar.
    const goalDenom = isParticipantGoal ? perParticipantGoal : goalAmount;
    const hasGoalPct = !!goalDenom && goalDenom > 0;
    // Fallback for a goal-less org campaign (no shared target to be a % of): rank the
    // bars relative to the current leader — same as the dashboard/admin tables — and
    // suppress the (meaningless) percentage. Never all-or-nothing 100% bars.
    const maxRaised = Math.max(1, ...participants.map((p) => p.total_raised));
    const barPct = (raised: number) => hasGoalPct
        ? Math.min(100, (raised / goalDenom!) * 100)
        : Math.min(100, (raised / maxRaised) * 100);
    const clickProps = (id: string) => onSelect ? { onClick: () => onSelect(id), className: "cursor-pointer" } : {};

    // Layout A (participant goal): split into achievers / in-progress by per-participant goal.
    const achievers  = perParticipantGoal != null ? participants.filter((p) => p.total_raised >= perParticipantGoal!) : [];
    const inProgress = perParticipantGoal != null ? participants.filter((p) => p.total_raised <  perParticipantGoal!) : participants;

    // Layout B (org goal): rank by amount → podium + table.
    const top3   = participants.slice(0, 3);
    const others = participants.slice(3);

    return (
        <div className="relative overflow-hidden pt-[32px] md:pt-[52px] xl:pt-[72px] pb-[32px] md:pb-[52px] xl:pb-[72px]" style={{ background: accent }}>
            {/* Halo — the Figma "Ellipse 370": an accent-filled circle (r 576, blur 225)
                blended with color-dodge, centred behind the plaque/podium so the band
                glows brightest at its top-centre. The radial stops approximate the
                Gaussian falloff of the blurred disc; it sits UNDER the pattern. */}
            <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[-280px] size-[1200px] md:top-[-503px] md:size-[2052px] -translate-x-1/2"
                style={{
                    background: `radial-gradient(circle closest-side, ${accent} 0%, ${accent} 34%, ${accent}80 56%, ${accent}29 78%, transparent 96%)`,
                    mixBlendMode: "color-dodge",
                }}
            />
            {theme.themeImage && (
                /* Tile at native motif size (matches the theme picker / hero) instead of
                   stretching one copy down a tall band, which ballooned the motif. */
                <div
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-[1047px] pointer-events-none ${theme.themeCover ? "opacity-[0.18]" : "opacity-[0.1]"}`}
                    style={{
                        backgroundImage: `url('${theme.themeImage}')`,
                        backgroundRepeat: theme.themeCover ? "no-repeat" : "repeat",
                        backgroundSize: theme.themeSize,
                        backgroundPosition: "center",
                    }}
                />
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(180deg, ${theme.secondary}33 0%, transparent 40%)` }} />

            <div className="relative flex flex-col items-center px-[16px] md:px-[24px] xl:px-0">
                {/* Plaque + ribbon — same construction as the creation-step headers */}
                <div className="pb-[40px] md:pb-[56px]">
                    <LeaderboardBanner title="Leaderboard" subtitle="See who’s leading the way!" accent={accent} secondary={theme.secondary} />
                </div>

                {isParticipantGoal ? (
                    /* ── Layout A — Goal Achievers / Goal in Progress ── */
                    <div className="flex w-full max-w-[1152px] flex-col gap-[24px] xl:flex-row xl:items-start">
                        <AchieverPanel title="Goal Achievers" medal="medal-gold" rows={achievers} mode="achievers" showAmounts={showAmounts} showPercent={isOrganizer} pctOf={barPct} highlightMemberId={activeId} onDonate={onSelect} hlRow={HL.rowA} />
                        <AchieverPanel title="Goal in Progress" medal="medal-silver" rows={inProgress} mode="progress" showAmounts={showAmounts} showPercent={isOrganizer} pctOf={barPct} highlightMemberId={activeId} onDonate={onSelect} hlRow={HL.rowA} />
                    </div>
                ) : (
                    /* ── Layout B — podium + Other Participants table ── */
                    <>
                        <div className="flex flex-col xl:flex-row gap-[24px] items-stretch w-full max-w-[1152px]">
                            {top3.map((p, i) => {
                                /* Podium cards are plain white; only the ACTIVE card (the
                                   viewer's own, or one they click) takes the navy highlight
                                   (Figma "Participant View" variant) — the medal + its glow
                                   supply the corner colour, so the card body stays white and
                                   never picks up the campaign's selected colours. */
                                const hl = p.id === activeId;
                                return (
                                    <div key={p.id} {...clickProps(p.id)} className={`flex w-full xl:flex-1 flex-col gap-[24px] items-start min-w-0 overflow-hidden p-[32px] relative rounded-[20px] bg-white ${canDonate ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`} style={{ backgroundImage: hl ? HL.card : undefined, boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
                                        {/* Medal + sunburst rays (the Figma "shades") peeking from the corner.
                                            The number stays on-card; the corner blue pixel clips off-card. On the
                                            highlighted card the rays are masked to the coin so the selected colour
                                            fills the whole card instead of washing out its right half. */}
                                        <Image src={`${A}/leaderboard/${MEDALS[i]}.png`} alt="" width={155} height={155} className="absolute right-[-28px] top-[-12px] z-0 size-[155px] max-w-none" style={{ WebkitMaskImage: hl ? COIN_MASK : RAY_MASK, maskImage: hl ? COIN_MASK : RAY_MASK }} />
                                        {/* Content sits ABOVE the medal (positioned art otherwise paints over
                                            in-flow text) so the name reads over the rays; the number still shows
                                            in the empty top-right corner where no content overlaps it. */}
                                        <div className="relative z-10 flex gap-[16px] items-center px-[8px] w-full">
                                            <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[64px]" ring={hl} />
                                            <p className={`text-[16px] md:text-[18px] xl:text-[20px] min-w-0 ${hl ? "text-white" : "text-[#003060]"}`}>
                                                <span className="block font-black truncate" style={{ lineHeight: 1.25 }}>{p.first_name}</span>
                                                <span className="block font-medium truncate" style={{ lineHeight: 1.15 }}>{p.last_name}</span>
                                            </p>
                                        </div>
                                        <div className="relative z-10 flex w-full"><Bar raised={p.total_raised} pct={barPct(p.total_raised)} glow={i === 0} showAmounts={showAmounts} showPercent={isOrganizer} hasPct={hasGoalPct} /></div>
                                    </div>
                                );
                            })}
                        </div>

                        {others.length === 0 && goalAmount != null && (
                            /* With ≤3 participants everyone sits on the podium and the
                               "Other Participants" table (which carries the campaign goal
                               in the Figma) never renders — show the goal in a slim card
                               of the same family so it's never lost. */
                            <div className="bg-white border border-[#eff4f9] flex items-center justify-center px-[24px] py-[18px] md:py-[24px] rounded-[20px] w-full max-w-[1152px] mt-[32px]" style={{ boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}>
                                <p className="text-[20px] md:text-[24px] text-[#003060] tracking-[-0.5px] text-center whitespace-nowrap" style={{ lineHeight: 1.15 }}>
                                    <span className="font-light">Campaign Goal: </span><span className="font-black">{fmt(goalAmount)}</span>
                                </p>
                            </div>
                        )}

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
                                    <div className="border border-[#d4dee7] flex flex-col items-start overflow-hidden rounded-[16px] w-full md:min-w-[680px]">
                                        {/* Column header — dropped on phones, where rows stack (per the mobile Figma). */}
                                        <div className="hidden md:flex border-b border-[#d4dee7] gap-[24px] items-center px-[24px] md:px-[32px] xl:px-[48px] py-[16px] w-full font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none">
                                            <span className="w-[48px] xl:w-[80px] shrink-0">Rank</span>
                                            <span className="flex-1 min-w-0">Participant Name</span>
                                            <span className="flex-1 min-w-0">Amount Raised</span>
                                        </div>
                                        <div className="bg-white flex flex-col items-start w-full">
                                            {others.map((p, i) => {
                                                const rank = i + 4;
                                                const hl = p.id === activeId;
                                                return (
                                                    /* Phones: rank+avatar+name on one line, the bar wrapping to its
                                                       own full-width line below (mobile Figma); md+ single line. */
                                                    <div key={p.id} {...clickProps(p.id)} className={`flex flex-wrap md:flex-nowrap gap-x-[12px] gap-y-[10px] md:gap-[24px] items-center px-[16px] md:px-[32px] xl:px-[48px] py-[16px] w-full border-b border-[#d4dee7] ${canDonate ? "hover:bg-[#f8fafc]" : ""} ${hl ? "rounded-[20px] md:rounded-[44px]" : ""}`} style={hl ? { backgroundImage: HL.row } : undefined}>
                                                        <span className="h-[24px] w-[24px] md:w-[48px] xl:w-[80px] relative shrink-0">
                                                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full size-[24px] ${hl ? "bg-white" : "bg-[#aeb5bd]"}`}>
                                                                <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[14px] leading-none ${hl ? "" : "text-white"}`} style={hl ? { color: HL.rank } : undefined}>{rank}</span>
                                                            </span>
                                                        </span>
                                                        <div className="flex flex-1 gap-[12px] md:gap-[16px] xl:gap-[24px] items-center min-w-0">
                                                            <Avatar name={p.first_name} url={p.profile_photo_url} className="size-[40px] md:size-[48px]" />
                                                            <p className={`text-[15px] md:text-[16px] xl:text-[18px] truncate flex-1 min-w-0 md:flex-none md:w-[200px] xl:w-[292px] ${hl ? "text-white font-black" : "text-[#003060] font-bold"}`} style={{ lineHeight: 1.15 }}>{p.first_name} {p.last_name}</p>
                                                        </div>
                                                        <div className="flex basis-full md:basis-auto md:flex-1 min-w-0">
                                                            {/* Org goal: no per-participant target — the shared campaign
                                                                goal already sits in the header, so the bar shows none. */}
                                                            <Bar raised={p.total_raised} pct={barPct(p.total_raised)} showAmounts={showAmounts} showPercent={isOrganizer} hasPct={hasGoalPct} />
                                                        </div>
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
