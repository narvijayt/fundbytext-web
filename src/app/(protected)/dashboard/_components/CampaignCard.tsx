import Image from "next/image";
import { CampaignStatus, MemberRole } from "@/generated/prisma/enums";
import CampaignNavLink from "./CampaignNavLink";
import DeleteCampaignButton from "./DeleteCampaignButton";
import CountdownBadge from "@/components/CountdownBadge";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: string | number | null) {
    if (n === null || n === undefined) return "—";
    const num = typeof n === "string" ? parseFloat(n) : n;
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function fmtMonthYear(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtDate(iso: string | null, tz: string) {
    if (!iso) return null;
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}



const WIZARD_STEPS = [
    { num: 1, label: "Campaign Details"  },
    { num: 2, label: "Funding Goal"      },
    { num: 3, label: "Campaign Visual"   },
    { num: 4, label: "Participants"      },
    { num: 5, label: "Thank You"         },
];

function currentDraftStep(c: { current_step: number; campaign_type: string }) {
    const step = Math.min(Math.max(c.current_step, 1), 5);
    if (step === 4 && c.campaign_type === "organization") return { num: 4, label: "Participants" };
    return WIZARD_STEPS[step - 1];
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CampaignCardData = {
    id: string;
    slug: string;
    name: string | null;
    status: string;
    campaign_type: string;
    current_step: number;
    goal_type: string | null;
    goal_amount: { toString(): string } | null;
    initial_goal_amount: { toString(): string } | null;
    total_raised: { toString(): string };
    start_date: Date | null;
    end_date: Date | null;
    created_at: Date;
    timezone: string | null;
    myRoles:      string[];
    myDonorCount: number;
    media: { media_type: string; url: string }[];
    payout: { city: string; state: string } | null;
    _count: { members: number; donors: number; donations: number };
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
    const status      = campaign.status as CampaignStatus;
    const isOrganizer = campaign.myRoles.includes(MemberRole.organizer);
    const heroUrl     = campaign.media.find((m) => m.media_type === "hero")?.url ?? null;
    const location    = campaign.payout ? `${campaign.payout.city}, ${campaign.payout.state}` : null;
    const goalAmt        = campaign.goal_amount         ? parseFloat(campaign.goal_amount.toString())         : 0;
    const initialGoalAmt = campaign.initial_goal_amount ? parseFloat(campaign.initial_goal_amount.toString()) : null;
    const raisedAmt      = parseFloat(campaign.total_raised.toString());
    const splitGoal      = initialGoalAmt ?? (goalAmt || null);
    const scale          = goalAmt > 0 ? Math.max(raisedAmt, goalAmt) : raisedAmt || 1;
    const greenPct       = splitGoal ? Math.min(100, Math.min(raisedAmt, splitGoal) / scale * 100) : (goalAmt > 0 ? Math.min(100, raisedAmt / scale * 100) : 100);
    const goldPct        = splitGoal && raisedAmt > splitGoal ? Math.min(100 - greenPct, (raisedAmt - splitGoal) / scale * 100) : 0;
    const isScaled       = initialGoalAmt != null && goalAmt > 0 && initialGoalAmt !== goalAmt;
    const canDelete   = isOrganizer && (
        status === CampaignStatus.draft ||
        (status === CampaignStatus.upcoming && campaign._count.donations === 0)
    );
    const cardHref    = status === CampaignStatus.draft
        ? `/campaigns/${campaign.slug}/create`
        : `/dashboard/campaigns/${campaign.slug}`;
    const draftStep   = status === CampaignStatus.draft ? currentDraftStep(campaign) : null;

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col border border-gray-100">

            {/* Hero image */}
            <div className="relative h-44 bg-gray-100 shrink-0">
                {heroUrl ? (
                    <Image
                        src={heroUrl}
                        alt={campaign.name ?? "Campaign"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {location && (
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/60 to-transparent" />
                )}
                {location && (
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-white text-xs font-medium">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                        </svg>
                        {location}
                    </div>
                )}
            </div>

            {/* Card body */}
            <CampaignNavLink href={cardHref} overlayText="Loading…" className="flex flex-col flex-1 p-4 gap-3">

                {/* Status badge */}
                <div className="flex items-center justify-between gap-2">
                    {status === CampaignStatus.active && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-500 text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Active Campaign
                        </span>
                    )}
                    {status === CampaignStatus.upcoming && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500 text-white">Upcoming</span>
                    )}
                    {status === CampaignStatus.draft && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Draft</span>
                    )}
                    {status === CampaignStatus.completed && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">Completed</span>
                    )}
                    {status === CampaignStatus.draft && isOrganizer && (
                        <span className="text-xs font-semibold text-orange-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </span>
                    )}
                </div>

                {/* Name + date */}
                <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                        {campaign.name ?? <span className="italic text-gray-400">Untitled campaign</span>}
                    </h3>
                    {status === CampaignStatus.draft ? (
                        <p className="text-xs text-gray-400 mt-0.5">Created {fmtMonthYear(campaign.created_at.toString())}</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(campaign.start_date?.toString() ?? null, campaign.timezone ?? "America/New_York")}</p>
                    )}
                </div>

                {/* Active: days left + progress */}
                {status === CampaignStatus.active && (
                    <div className="space-y-2">
                        <CountdownBadge
                            date={campaign.end_date}
                            mode="left"
                            className="text-xs font-bold text-red-500 uppercase tracking-wide"
                        />
                        <div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                {greenPct > 0 && (
                                    <div className="h-full" style={{
                                        width: `${greenPct}%`,
                                        background: "repeating-linear-gradient(-45deg,#22c55e,#22c55e 6px,#16a34a 6px,#16a34a 12px)",
                                        borderRadius: goldPct > 0 ? "9999px 0 0 9999px" : "9999px",
                                    }} />
                                )}
                                {goldPct > 0 && (
                                    <div className="h-full rounded-r-full" style={{
                                        width: `${goldPct}%`,
                                        background: "repeating-linear-gradient(-45deg,#f59e0b,#f59e0b 6px,#d97706 6px,#d97706 12px)",
                                    }} />
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                                <span className="font-semibold text-gray-700">{fmt(raisedAmt)} raised</span>
                                {isScaled ? (
                                    <span>{fmt(initialGoalAmt)} <span className="text-gray-400">initial</span> · <span className="text-amber-500 font-semibold">{fmt(goalAmt)} scaled</span></span>
                                ) : (
                                    <span>{campaign._count.donations} donation{campaign._count.donations !== 1 ? "s" : ""}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcoming: days to start + stats */}
                {status === CampaignStatus.upcoming && (
                    <div className="space-y-2">
                        <CountdownBadge
                            date={campaign.start_date}
                            mode="toStart"
                            className="text-xs font-bold text-orange-500 uppercase tracking-wide"
                        />
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            {goalAmt > 0 && (
                                <span>
                                    {campaign.goal_type === "participant_goal" ? "Per Participant Goal" : "Campaign Goal"}:{" "}
                                    <span className="font-semibold text-gray-700">
                                        {fmt(campaign.goal_type === "open_ended" && initialGoalAmt ? initialGoalAmt : goalAmt)}
                                    </span>
                                </span>
                            )}
                            {campaign.campaign_type === "organization" && (
                                <span>
                                    Donors added:{" "}
                                    <span className="font-semibold text-gray-700">
                                        {isOrganizer ? campaign._count.donors : campaign.myDonorCount}
                                    </span>
                                </span>
                            )}
                            {campaign.campaign_type === "organization" && isOrganizer && (
                                <span>Participants: <span className="font-semibold text-gray-700">{campaign._count.members}</span></span>
                            )}
                        </div>
                    </div>
                )}

                {/* Completed */}
                {status === CampaignStatus.completed && goalAmt > 0 && (
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            {greenPct > 0 && (
                                <div className="h-full" style={{
                                    width: `${greenPct}%`,
                                    background: "repeating-linear-gradient(-45deg,#a78bfa,#a78bfa 6px,#7c3aed 6px,#7c3aed 12px)",
                                    borderRadius: goldPct > 0 ? "9999px 0 0 9999px" : "9999px",
                                }} />
                            )}
                            {goldPct > 0 && (
                                <div className="h-full rounded-r-full" style={{
                                    width: `${goldPct}%`,
                                    background: "repeating-linear-gradient(-45deg,#f59e0b,#f59e0b 6px,#d97706 6px,#d97706 12px)",
                                }} />
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">{fmt(raisedAmt)}</span> raised
                            {isScaled
                                ? <> · {fmt(initialGoalAmt)} <span className="text-gray-400">initial</span> · <span className="text-amber-500 font-semibold">{fmt(goalAmt)} scaled</span></>
                                : <> of {fmt(goalAmt)}</>
                            }
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-1">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-orange-500 transition-colors">
                        {status === CampaignStatus.draft ? "Continue Setup" : "View Campaign"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </CampaignNavLink>

            {/* Draft step progress */}
            {status === CampaignStatus.draft && draftStep && (
                <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
                    <span className="font-semibold text-gray-600 uppercase tracking-wide text-[11px]">
                        Step {draftStep.num} / 5
                    </span>
                    <span className="font-semibold text-orange-500 uppercase tracking-wide text-[11px]">
                        {draftStep.label}
                    </span>
                </div>
            )}

            {/* Delete */}
            {canDelete && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                    <DeleteCampaignButton
                        slug={campaign.slug}
                        campaignName={campaign.name ?? null}
                        compact
                    />
                </div>
            )}
        </div>
    );
}
