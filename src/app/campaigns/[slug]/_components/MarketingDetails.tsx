"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DONATE_EVENT } from "./DonateNavButton";
import CountdownBadge from "@/components/CountdownBadge";
import InlineDonateForm from "./InlineDonateForm";
import type { RecentDonation } from "../page";
import type { MarketingTheme } from "./marketingTheme";
import type { DonorPrefill } from "./CampaignDonateShell";
import type { ModalParticipant } from "./DonateModal";

const A = "/assets/marketing";

// Green-on-green diagonal stripes for the "raised" fill + a subtle striped gray
// track — matches the dashboard CampaignProgressBar exactly (so the public page
// and the dashboard campaign view read as the same bar).
const GREEN_STRIPES = "repeating-linear-gradient(-45deg,#33cc6b,#33cc6b 7px,#23b257 7px,#23b257 14px)";
// Gold stripes for the "raised beyond the initial goal" segment on open-ended
// campaigns — matches the dashboard CampaignProgressBar's overflow colour.
const GOLD_STRIPES  = "repeating-linear-gradient(-45deg,#f5b93f,#f5b93f 7px,#e8a423 7px,#e8a423 14px)";
const TRACK_STRIPES = "repeating-linear-gradient(-45deg,#eff1f4,#eff1f4 7px,#e4e7eb 7px,#e4e7eb 14px)";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
// Decorative gem avatars used in the live donation feed (cycled by index).
const GEMS = ["donor-green", "donor-orange", "donor-gray"];
function abbrevName(name: string): string {
    if (!name || name === "Anonymous") return name || "Anonymous";
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0];
}
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

type Props = {
    theme:             MarketingTheme;
    totalRaised:       number;
    goalAmount:        number | null;
    initialGoalAmount: number | null;
    donorCount:        number;
    pct:               number;
    daysLeft:          number | null;
    recentDonations:   RecentDonation[];
    story:             string | null;
    organizerName:     string | null;
    organizerPhotoUrl: string | null;
    orgBadge:          string | null;
    endDateLabel:      string | null;
    startDateLabel:    string | null;
    startDate:         string | null; // ISO — for the live "starts in…" countdown
    status:            string;
    donationsEnabled:  boolean;
    donationsDisabledMessage: string | null;
    isFixedGoal:       boolean;
    // ?ref= participant link → show the inline donate form instead of the live feed
    inlineRef: null | {
        target:        ModalParticipant | null;
        donorPrefill:  DonorPrefill | null;
        campaignSlug:  string;
        campaignName:  string;
        heroUrl:       string | null;
    };
};

export default function MarketingDetails({
    theme, totalRaised, goalAmount, initialGoalAmount, donorCount, pct, daysLeft, recentDonations,
    story, organizerName, organizerPhotoUrl, orgBadge, endDateLabel, startDateLabel, startDate,
    status, donationsEnabled, donationsDisabledMessage, isFixedGoal, inlineRef,
}: Props) {
    const { accent } = theme;
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    // Live donations-paused toggle (Ably event re-dispatched by CampaignUpdater).
    // Derived from the prop with an optional override — no prop→state sync effect.
    const [override, setOverride] = useState<{ enabled: boolean; msg: string | null } | null>(null);
    const enabled     = override ? override.enabled : donationsEnabled;
    const disabledMsg = override ? override.msg : donationsDisabledMessage;
    useEffect(() => {
        const onToggle = (e: Event) => {
            const d = (e as CustomEvent<{ donationsEnabled: boolean; donationsDisabledMessage: string | null }>).detail;
            setOverride({ enabled: d.donationsEnabled, msg: d.donationsDisabledMessage });
        };
        window.addEventListener("campaign:donations_toggle", onToggle);
        return () => window.removeEventListener("campaign:donations_toggle", onToggle);
    }, []);

    const raised      = totalRaised;
    const donors      = donorCount;
    const livePct     = goalAmount && goalAmount > 0 ? Math.min(100, (raised / goalAmount) * 100) : pct;
    const maxCents    = isFixedGoal && goalAmount !== null ? Math.max(0, Math.round((goalAmount - raised) * 100)) : null;
    const fullyFunded = maxCents === 0;
    const isCompleted  = status === "completed";
    const isUpcoming   = status === "upcoming";

    // Open-ended goals lock their first target in initialGoalAmount and auto-scale
    // goalAmount +20% each time it's met. The bar shows green up to the initial
    // goal, gold for everything raised beyond it, and the track's full width is the
    // current (scaled) goal. For every other goal type initialGoalAmount is null or
    // equal to goalAmount, so this collapses to a single green fill.
    const isScaledGoal = initialGoalAmount != null && goalAmount != null && initialGoalAmount !== goalAmount;
    const splitGoal    = initialGoalAmount ?? goalAmount;
    const scale        = goalAmount && goalAmount > 0 ? Math.max(raised, goalAmount) : (raised || 1);
    const greenPct     = splitGoal ? Math.min(raised, splitGoal) / scale * 100 : livePct;
    const goldPct      = splitGoal && raised > splitGoal ? (raised - splitGoal) / scale * 100 : 0;

    // Animate both segments in on mount (CSS width/left transitions do the tween).
    const [greenW, setGreenW] = useState(0);
    const [goldW,  setGoldW]  = useState(0);
    useEffect(() => {
        const id = requestAnimationFrame(() => { setGreenW(greenPct); setGoldW(goldPct); });
        return () => cancelAnimationFrame(id);
    }, [greenPct, goldPct]);

    const textLength = (story ?? "").replace(/<[^>]*>/g, "").length;
    const isLong     = textLength > 320;

    const isDraft = status === "draft";

    function donate() {
        if (!isDraft && !isCompleted && !isUpcoming && enabled && !fullyFunded) {
            window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId: null } }));
        }
    }

    // Donate button: same state matrix as the old ProgressPanel.
    let donateBtn: React.ReactNode;
    if (isDraft) {
        donateBtn = <DisabledBtn tone="blue">Donations go live once published</DisabledBtn>;
    } else if (isCompleted) {
        donateBtn = <DisabledBtn>Campaign Ended</DisabledBtn>;
    } else if (fullyFunded) {
        donateBtn = <DisabledBtn tone="green">Goal Fully Funded</DisabledBtn>;
    } else if (isUpcoming) {
        donateBtn = <DisabledBtn tone="blue">Donations open when the campaign starts</DisabledBtn>;
    } else if (!enabled) {
        donateBtn = <DisabledBtn>Donations Paused</DisabledBtn>;
    } else {
        donateBtn = (
            <button
                type="button"
                onClick={donate}
                className="bg-[#f47435] flex h-[56px] gap-[10px] items-center justify-center overflow-hidden px-[18px] py-[16px] rounded-[16px] w-full transition-transform hover:scale-[1.01] active:scale-100"
                style={{ boxShadow: "0px 20px 20px -14px rgba(234,103,37,0.2), 0px 20px 40px -16px rgba(244,116,53,0.2)" }}
            >
                <Image src={`${A}/icons/heart.svg`} alt="" width={24} height={24} className="size-[24px] -mt-[3px] -ml-[3px]" />
                <span className="font-black text-[14px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">donate now</span>
            </button>
        );
    }

    const dateLabel = isUpcoming ? startDateLabel : endDateLabel;
    // Upcoming campaigns get a live "Starts in …" countdown (rendered below);
    // this label covers completed / active.
    const subLabel  = isCompleted
        ? "Campaign ended"
        : daysLeft != null
            ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left!`
            : null;
    const subCls = "font-black text-[12px] text-[#f47435] tracking-[1px] uppercase w-full leading-none";

    return (
        <div className="max-w-[1152px] mx-auto px-[16px] md:px-[24px] xl:px-0 mt-[48px] flex flex-col md:gap-[40px] xl:flex-row xl:gap-[122px] items-start">
            {/* Left column */}
            <div className="flex w-full xl:flex-1 flex-col items-start min-w-0">
                {/* Progress + donate */}
                <div className="flex flex-col gap-[24px] items-start pb-[48px] pt-[12px] px-[8px] w-full">
                    <div className="flex flex-col gap-[12px] items-start w-full">
                        <div className="flex items-end px-[4px] w-full gap-2">
                            <p className="flex-1 min-w-0 text-[24px] text-[#003060]" style={{ lineHeight: 1.15 }}>
                                <span className="font-black tracking-[-0.5px]">{fmtUSD(raised)} </span>
                                <span className="font-normal">raised</span>
                            </p>
                            {goalAmount != null && (
                                <p className="font-medium text-[18px] text-[#aeb5bd] whitespace-nowrap" style={{ lineHeight: 1.4 }}>
                                    {fmtUSD(initialGoalAmount ?? goalAmount)} {isScaledGoal ? "initial goal" : "goal"}
                                </p>
                            )}
                        </div>
                        {/* Progress bar — green-on-green striped "raised" fill on a striped gray
                            track (both the same height), with a taller rounded green marker
                            at the current progress point. The marker lives outside the clipped
                            track so it can stand proud of the bar. */}
                        <div className="relative w-full">
                            <div className="h-[32px] relative rounded-full w-full overflow-hidden" style={{ background: TRACK_STRIPES }}>
                                <style>{`@keyframes mkt-pb-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}`}</style>
                                {/* Green fill — raised up to the initial goal */}
                                <div
                                    className="absolute left-0 top-0 h-full rounded-l-full transition-[width] duration-1000 ease-out"
                                    style={{ width: `${greenW}%`, minWidth: raised > 0 ? 44 : 0, background: GREEN_STRIPES }}
                                />
                                {/* Gold fill — everything raised beyond the initial goal (open-ended scaling) */}
                                {goldW > 0 && (
                                    <div
                                        className="absolute top-0 h-full transition-[left,width] duration-1000 ease-out"
                                        style={{ left: `max(${greenW}%, 44px)`, width: `${goldW}%`, background: GOLD_STRIPES }}
                                    />
                                )}
                                {/* Shimmer sweeping the full fill (green + gold) */}
                                <div
                                    aria-hidden
                                    className="absolute left-0 top-0 h-full overflow-hidden pointer-events-none transition-[width] duration-1000 ease-out"
                                    style={{ width: `${greenW + goldW}%`, minWidth: raised > 0 ? 44 : 0 }}
                                >
                                    <span
                                        className="absolute inset-y-0 left-0 w-[35%]"
                                        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5) 50%,transparent)", animation: "mkt-pb-shimmer 2.2s ease-in-out infinite" }}
                                    />
                                </div>
                                <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
                            </div>
                            {/* Tall green marker at the end of the green segment — the initial-goal
                                point when the goal has scaled, or the progress head otherwise. */}
                            {raised > 0 && greenPct < 100 && (
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute top-1/2 h-[44px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2bbd5f] shadow-[0px_2px_6px_-1px_rgba(0,48,96,0.28)] transition-[left] duration-1000 ease-out"
                                    style={{ left: `max(${greenW}%, 44px)` }}
                                />
                            )}
                        </div>
                        {/* Date + days + donations */}
                        <div className="flex gap-[6px] items-center justify-center px-[4px] w-full">
                            <span className="h-[40px] w-[25px] relative shrink-0 overflow-hidden">
                                <Image src={`${A}/icons/flag.svg`} alt="" width={19} height={36} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[19px] h-[36px] -rotate-10" />
                            </span>
                            <span className="flex flex-1 flex-col gap-[4px] items-start justify-center min-w-0">
                                {/* Top line: date on the left, donation count on the right. */}
                                <span className="flex w-full items-baseline justify-between gap-[8px]">
                                    {dateLabel && <span className="font-medium text-[16px] text-[#7e8a96] min-w-0 truncate" style={{ lineHeight: 1.4 }}>{dateLabel}</span>}
                                    <span className="font-medium text-[16px] text-[#aeb5bd] text-right whitespace-nowrap shrink-0" style={{ lineHeight: 1.4 }}>
                                        {donors} donation{donors !== 1 ? "s" : ""}
                                    </span>
                                </span>
                                {isUpcoming
                                    ? <CountdownBadge date={startDate} mode="toStart" className={subCls} />
                                    : subLabel && <span className={subCls}>{subLabel}</span>}
                            </span>
                        </div>
                    </div>

                    {/* Donations paused banner */}
                    {!enabled && !isCompleted && !isUpcoming && (
                        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl w-full">
                            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            <p className="text-xs text-amber-800 leading-snug">{disabledMsg?.trim() || "This campaign is temporarily not accepting donations. Please check back soon."}</p>
                        </div>
                    )}

                    {donateBtn}
                </div>

                {/* Description */}
                <div className="border-y border-[#e7e9eb] flex flex-col gap-[24px] items-start px-[8px] py-[48px] w-full">
                    <p className="font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none">description</p>
                    {story?.trim() ? (
                        <>
                            <div className={`story-content relative font-normal text-[18px] text-[#2f3a45] w-full ${!expanded && isLong ? "line-clamp-6 overflow-hidden" : ""}`} style={{ lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: story }} />
                            {isLong && (
                                <button type="button" onClick={() => setExpanded((v) => !v)} className="border-b border-[#0268c0] flex gap-[8px] items-center justify-center py-[2px]" style={{ borderColor: accent }}>
                                    <span className="font-bold text-[16px] tracking-[0.15px] leading-none whitespace-nowrap" style={{ color: accent }}>{expanded ? "Show less" : "Read more"}</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-[16px] text-[#aeb5bd] italic">No description provided.</p>
                    )}
                </div>

                {/* Organizer */}
                {organizerName && (
                    <div className="flex gap-[12px] items-center px-[8px] py-[24px] w-full">
                        <div className="bg-[#e8eaee] overflow-hidden relative rounded-full shrink-0 size-[56px]">
                            {organizerPhotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={organizerPhotoUrl} alt={organizerName} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-[20px]" style={{ color: accent }}>{organizerName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col gap-[8px] items-start justify-center min-w-0">
                            <p>
                                <span className="font-bold text-[18px] text-[#003060]" style={{ lineHeight: 1.15 }}>{organizerName}</span>
                                <span className="font-medium text-[18px] text-[#aeb5bd]" style={{ lineHeight: 1.4 }}> is organizing this campaign.</span>
                            </p>
                            {orgBadge && (
                                <span className="flex items-center justify-center overflow-hidden px-[10px] py-[8px] rounded-[8px]" style={{ background: `${accent}1a` }}>
                                    <span className="font-black text-[12px] tracking-[1px] uppercase leading-none whitespace-nowrap" style={{ color: accent }}>{orgBadge}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right column — inline donate form for ?ref= links, otherwise the live feed */}
            <div className="w-full xl:w-[368px] shrink-0">
                {inlineRef ? (
                    <InlineDonateForm
                        totalRaised={raised} goalAmount={goalAmount} pct={livePct} daysLeft={daysLeft} donorCount={donors}
                        campaignSlug={inlineRef.campaignSlug} campaignName={inlineRef.campaignName} campaignStory={story}
                        heroUrl={inlineRef.heroUrl} accent={accent} targetMember={inlineRef.target}
                        donorPrefill={inlineRef.donorPrefill} donationsEnabled={enabled} donationsDisabledMessage={disabledMsg}
                        maxDonationCents={maxCents}
                        onDonationSuccess={() => router.refresh()}
                    />
                ) : (
                    <div
                        className="bg-white flex flex-col gap-[24px] h-[516px] items-center overflow-hidden px-[32px] py-[28px] relative rounded-[24px] w-full"
                        style={{ boxShadow: "0px 12px 16px -8px rgba(0,48,96,0.08), 0px 28px 32px -8px rgba(2,104,192,0.16)" }}
                    >
                        {recentDonations.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center gap-2">
                                <Image src={`${A}/icons/heart.svg`} alt="" width={32} height={32} className="size-8 opacity-40" />
                                <p className="font-bold text-[16px] text-[#003060]">Be the first to donate!</p>
                                <p className="text-[14px] text-[#7e8a96]">Your support kicks things off.</p>
                            </div>
                        ) : (
                            recentDonations.map((d, i) => (
                                <div key={i} className="flex gap-[12px] items-center pr-[8px] w-full">
                                    <Image src={`${A}/avatars/${GEMS[i % GEMS.length]}.png`} alt="" width={42} height={42} className="size-[42px] shrink-0 rounded-full" />
                                    <div className="flex flex-1 flex-col items-start justify-center min-w-0">
                                        <p className="font-bold text-[16px] text-[#003060] w-full truncate" style={{ lineHeight: 1.25 }}>{abbrevName(d.display_name)}</p>
                                        <p className="font-medium text-[14px] text-[#7e8a96] w-full leading-none">{timeAgo(d.created_at)}</p>
                                    </div>
                                    <p className="font-medium text-[16px] text-[#003060] whitespace-nowrap" style={{ lineHeight: 1.4 }}>{fmtUSD(d.amount)}</p>
                                </div>
                            ))
                        )}
                        <div aria-hidden className="absolute inset-x-0 top-0 h-[80px] pointer-events-none" style={{ background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)" }} />
                        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[80px] pointer-events-none" style={{ background: "linear-gradient(0deg, #fff 0%, rgba(255,255,255,0) 100%)" }} />
                    </div>
                )}
            </div>
        </div>
    );
}

function DisabledBtn({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "blue" }) {
    const cls = tone === "green" ? "bg-green-50 text-green-600" : tone === "blue" ? "bg-blue-50 text-blue-400" : "bg-[#f2f2f2] text-[#aeb5bd]";
    return <div className={`flex min-h-[56px] items-center justify-center rounded-[16px] w-full px-5 py-3 text-center font-black text-[14px] tracking-[1px] uppercase leading-[1.35] ${cls}`}>{children}</div>;
}
