import Image from "next/image";
import Link from "next/link";
import { CampaignStatus, MemberRole } from "@/generated/prisma/enums";
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
    { num: 1, label: "Campaign Details" },
    { num: 2, label: "Funding Goal" },
    { num: 3, label: "Campaign Visual" },
    { num: 4, label: "Participants" },
    { num: 5, label: "Thank You" },
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
    myRoles: string[];
    myDonorCount: number;
    media: { media_type: string; url: string }[];
    payout: { city: string; state: string } | null;
    _count: { members: number; donors: number; donations: number };
};

// ── Small bits ────────────────────────────────────────────────────────────────

function Flag({ className = "h-9 w-auto" }: { className?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/assets/campaigns/flag-active.svg" alt="" className={`-rotate-6 ${className}`} />;
}

// Draft-card step flag — the exact Figma "Progress Icon" (Vuesax two-pennant flag,
// node 5555:20335), an orange outline, not the filled flag-active.svg.
function ProgressFlag({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg className={`text-[#f47435] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.8502 13.3329L4.24023 16.0029V4.99291L10.9502 2.63291C11.8302 2.32291 12.7502 2.97291 12.7502 3.90291V12.0629C12.7502 12.6329 12.3902 13.1429 11.8502 13.3329Z" />
            <path d="M12.7498 4.46291L17.9698 2.63291C18.8498 2.32291 19.7698 2.97291 19.7698 3.90291V13.1929C19.7698 13.7629 19.4098 14.2729 18.8698 14.4629L11.2598 17.1229" />
            <path d="M4.24023 2.00391V22.0039" />
        </svg>
    );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
    const map: Record<string, { label: string; cls: string }> = {
        active:    { label: "Active Campaign", cls: "bg-[#f47435] text-white" },
        upcoming:  { label: "Upcoming",        cls: "bg-[#0268c0] text-white" },
        draft:     { label: "Draft",           cls: "bg-[#eef2f6] text-[#7e8a96]" },
        completed: { label: "Completed",       cls: "bg-[#28c45d] text-white" },
    };
    const s = map[status] ?? map.draft;
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1.5 text-[14px] font-black leading-none ${s.cls}`}>
            {s.label}
        </span>
    );
}

function ViewButton({ href }: { href: string }) {
    return (
        <Link
            href={href}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#dde0e3] px-3.5 pt-2.5 pb-3 text-[14px] font-medium text-[#003060] transition-colors hover:border-[#0268c0] hover:bg-[#0268c0]/5"
        >
            View Campaign
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1 1 0 010-.64C3.42 7.5 7.36 4.5 12 4.5s8.58 3 9.96 7.18a1 1 0 010 .64C20.58 16.5 16.64 19.5 12 19.5s-8.58-3-9.96-7.18z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        </Link>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
    const status = campaign.status as CampaignStatus;
    const isOrganizer = campaign.myRoles.includes(MemberRole.organizer);
    const heroUrl = campaign.media.find((m) => m.media_type === "hero")?.url ?? null;
    const location = campaign.payout
        ? [campaign.payout.city, campaign.payout.state].map((s) => (s ?? "").trim()).filter(Boolean).join(", ")
        : "";

    const goalAmt = campaign.goal_amount ? parseFloat(campaign.goal_amount.toString()) : 0;
    const initialGoalAmt = campaign.initial_goal_amount ? parseFloat(campaign.initial_goal_amount.toString()) : null;
    const raisedAmt = parseFloat(campaign.total_raised.toString());
    const greenPct = goalAmt > 0 ? Math.min(100, (raisedAmt / goalAmt) * 100) : (raisedAmt > 0 ? 100 : 0);

    const detailHref = `/dashboard/campaigns/${campaign.slug}`;
    const wizardHref = `/campaigns/${campaign.slug}/create`;
    const viewHref = status === CampaignStatus.draft ? wizardHref : detailHref;
    const draftStep = status === CampaignStatus.draft ? currentDraftStep(campaign) : null;

    const participants = campaign._count.members;
    const donorsCount = isOrganizer ? campaign._count.donors : campaign.myDonorCount;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_12px_12px_-8px_rgba(0,48,96,0.04),0px_32px_40px_-16px_rgba(2,104,192,0.16)]">
            {/* Hero image */}
            <Link href={viewHref} className="relative block h-[200px] shrink-0 bg-gray-100">
                {heroUrl ? (
                    <Image src={heroUrl} alt={campaign.name ?? "Campaign"} fill className="object-cover" sizes="(max-width:640px) 100vw,(max-width:1280px) 50vw,33vw" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                        <svg className="h-12 w-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
                {location && (
                    <span className="absolute bottom-4 left-4 flex items-center gap-1 text-[14px] font-medium text-white">
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" /></svg>
                        {location}
                    </span>
                )}
            </Link>

            {/* Details */}
            <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-5">
                <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={status} />
                    {status === CampaignStatus.draft && isOrganizer && (
                        <Link href={wizardHref} className="flex items-center gap-1.5 text-[14px] font-medium text-[#003060] hover:text-[#0268c0]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                        </Link>
                    )}
                </div>

                {/* Title + date */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-[16px] font-bold leading-[1.25] text-[#003060] line-clamp-2">
                        {campaign.name ?? <span className="italic text-gray-400">Untitled campaign</span>}
                    </h3>
                    {(status === CampaignStatus.active || status === CampaignStatus.upcoming) ? (
                        <div className="flex items-center gap-1.5">
                            <Flag className="h-10 w-auto" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[16px] font-medium leading-[1.4] text-[#7e8a96]">
                                    {fmtDate((status === CampaignStatus.active ? campaign.start_date : campaign.start_date)?.toString() ?? null, campaign.timezone ?? "America/New_York") ?? "—"}
                                </span>
                                <CountdownBadge
                                    date={status === CampaignStatus.active ? campaign.end_date : campaign.start_date}
                                    mode={status === CampaignStatus.active ? "left" : "toStart"}
                                    className="text-[12px] font-black uppercase leading-none tracking-[1px] text-[#f47435]"
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-[14px] text-[#aeb5bd]">
                            {status === CampaignStatus.draft
                                ? `Created ${fmtMonthYear(campaign.created_at.toString())}`
                                : `Completed ${fmtMonthYear(campaign.end_date?.toString() ?? campaign.created_at.toString())}`}
                        </p>
                    )}
                </div>

                <div className="pt-1">
                    <ViewButton href={viewHref} />
                </div>
            </div>

            {/* Footer strip — status-specific */}
            {status === CampaignStatus.active && (
                <div className="border-t border-[#e7e9eb] bg-[#f9f9fc] px-4 py-4">
                    <div className="h-5 w-full overflow-hidden rounded-full bg-[#f2f2f2]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#28c45d] to-[#34d56a]" style={{ width: `${Math.max(greenPct, raisedAmt > 0 ? 6 : 0)}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-0.5">
                        <span className="text-[14px] font-bold text-[#003060]">{fmt(raisedAmt)} <span className="font-normal">raised</span></span>
                        <span className="text-[14px] font-medium text-[#aeb5bd]">{campaign._count.donations} donation{campaign._count.donations !== 1 ? "s" : ""}</span>
                    </div>
                </div>
            )}

            {status === CampaignStatus.upcoming && (
                <div className="border-t border-[#e7e9eb] bg-[#f9f9fc] px-4 py-5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-[#7e8a96]">
                        {goalAmt > 0 && (
                            <span>{campaign.goal_type === "participant_goal" ? "Per Participant Goal" : "Campaign Goal"} : <span className="font-bold text-[#003060]">{fmt(campaign.goal_type === "open_ended" && initialGoalAmt ? initialGoalAmt : goalAmt)}</span></span>
                        )}
                        {campaign.campaign_type === "organization" && (
                            <span>Donors added: <span className="font-bold text-[#003060]">{donorsCount}</span></span>
                        )}
                        {campaign.campaign_type === "organization" && isOrganizer && (
                            <span>Participants added: <span className="font-bold text-[#003060]">{participants}</span></span>
                        )}
                    </div>
                </div>
            )}

            {status === CampaignStatus.draft && draftStep && (
                <div className="flex items-center justify-between gap-3 border-t border-[#e7e9eb] bg-[#f9f9fc] px-4 py-4">
                    <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[14px] font-black uppercase text-[#4b5563]">
                        <ProgressFlag className="h-6 w-6 shrink-0" />
                        <span>Step <span className="text-[#28c45d]">{draftStep.num}</span> / 5</span>
                    </span>
                    <span className="truncate text-right text-[12px] font-black uppercase tracking-[1px] text-[#4b5563]">{draftStep.label}</span>
                </div>
            )}

            {status === CampaignStatus.completed && (
                <div className="bg-gradient-to-r from-[#28c45d] to-[#34d56a] px-4 py-4 text-center text-[13px] font-bold leading-snug text-white">
                    You raised {fmt(raisedAmt)} through {campaign.campaign_type === "organization" && participants > 0 ? `${participants} participant${participants !== 1 ? "s" : ""} and ` : ""}{donorsCount} donor{donorsCount !== 1 ? "s" : ""}!
                </div>
            )}

        </div>
    );
}
