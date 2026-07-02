import CampaignNavLink from "@/app/(protected)/dashboard/_components/CampaignNavLink";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MemberRole, CampaignStatus, NotificationType, PaymentStatus } from "@/generated/prisma/enums";
import DeleteCampaignButton from "../../_components/DeleteCampaignButton";
import CampaignProgressBar from "./_components/CampaignProgressBar";
import DonationChart from "./_components/DonationChart";
import ParticipantsTable from "./_components/ParticipantsTable";
import NotificationsTable from "./_components/NotificationsTable";
import LiveDonationFeed from "./_components/LiveDonationFeed";
import ParticipantNotifications from "./_components/ParticipantNotifications";
import CampaignStatsBars from "./_components/CampaignStatsBars";
import FundBuddyOnboarding from "./_components/FundBuddyOnboarding";
import ParticipantGoalCard, { RankBadge } from "./_components/ParticipantGoalCard";
import StripedBar from "./_components/StripedBar";
import DonorsTable, { type DonorRow } from "./_components/DonorsTable";
import RemoveParticipantRoleButton from "./_components/RemoveParticipantRoleButton";
import CampaignControls from "./_components/CampaignControls";
import CopyUrlButton from "./_components/CopyUrlButton";
import UpcomingBanner from "./_components/UpcomingBanner";
import AblyDashboardUpdater from "./_components/AblyDashboardUpdater";

const STATUS_BADGE: Record<CampaignStatus, { label: string; cls: string }> = {
    active:    { label: "Active",    cls: "bg-green-100 text-green-700"  },
    upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700"    },
    draft:     { label: "Draft",     cls: "bg-gray-100 text-gray-600"    },
    completed: { label: "Completed", cls: "bg-purple-100 text-purple-700" },
};

function fmtDate(d: Date | null, tz: string) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric" }).format(d);
}

function fmtDateTime(d: Date | null, tz: string) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export default async function CampaignDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ view?: string }>;
}) {
    const { slug } = await params;
    const { view } = await searchParams;
    const user = await getAuthUser();
    if (!user) redirect("/login");

    const campaign = await prisma.campaign.findUnique({
        where: { slug },
        include: {
            members: {
                include: {
                    roles: { select: { role: true } },
                    donations: {
                        where: { payment_status: PaymentStatus.completed },
                        select: { amount: true },
                    },
                    _count: {
                        select: { donors: true },
                    },
                    user: {
                        select: { profile_photo_url: true, username: true },
                    },
                },
                orderBy: { created_at: "asc" },
            },
            // Chart donations — ordered asc for the time-series chart
            donations: {
                where:   { payment_status: PaymentStatus.completed },
                orderBy: { created_at: "asc" },
                take:    200,
                select: {
                    amount:      true,
                    is_anonymous: true,
                    created_at:  true,
                },
            },
        },
    });

    if (!campaign) notFound();

    const myMembership = campaign.members.find((m) => m.user_id === user.id);
    if (!myMembership) notFound();

    const isOrganizer       = myMembership.roles.some((r) => r.role === MemberRole.organizer);
    const isParticipant     = myMembership.roles.some((r) => r.role === MemberRole.participant);
    const isBothRoles       = isOrganizer && isParticipant;

    // If an organizer-only user manually adds ?view=participant, strip it.
    if (view === "participant" && isOrganizer && !isParticipant) {
        redirect(`/dashboard/campaigns/${slug}`);
    }

    // Participant-only users always see the participant view.
    // Users with both roles see it only when they've toggled to "participant".
    const isParticipantView = (!isOrganizer && isParticipant) || (isBothRoles && view === "participant");

    // ── Fetch donors + feed donations + notifications (all in parallel) ─────

    const participantNotifWhere = {
        campaign_id:       campaign.id,
        notification_type: NotificationType.participant,
        OR: [
            { recipient_member_id: myMembership.id },
            { recipient_member_id: null as string | null },
        ],
    };

    const [
        donorsRaw,
        feedDonationsRaw,
        donationTotal,
        campaignNotifRows,
        campaignNotifTotal,
        participantNotifRows,
        participantNotifTotal,
    ] = await Promise.all([
        prisma.campaignDonor.findMany({
            where: isParticipantView
                ? { campaign_id: campaign.id, assigned_member_id: myMembership.id }
                : { campaign_id: campaign.id },
            orderBy: { created_at: "desc" },
            select: {
                id:              true,
                first_name:      true,
                last_name:       true,
                email:           true,
                phone:           true,
                status:          true,
                source:          true,
                email_valid:     true,
                invite_token:    true,
                short_code:      true,
                created_at:      true,
                assigned_member: { select: { id: true, first_name: true, last_name: true, invite_token: true } },
                added_by_member: { select: { id: true, first_name: true, last_name: true, roles: { select: { role: true } } } },
                donations: {
                    where:  { payment_status: "completed" },
                    select: { amount: true, created_at: true, is_anonymous: true },
                },
            },
        }),
        // Feed preview — 5 most recent donations with donor details
        prisma.donation.findMany({
            where:   { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
            orderBy: { created_at: "desc" },
            take:    5,
            select: {
                id:                 true,
                amount:             true,
                donor_display_name: true,
                donor_first_name:   true,
                donor_last_name:    true,
                is_anonymous:       true,
                created_at:         true,
            },
        }),
        prisma.donation.count({
            where: { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
        }),
        // Campaign notifications preview (5)
        prisma.campaignNotification.findMany({
            where:   { campaign_id: campaign.id, notification_type: NotificationType.campaign },
            orderBy: { created_at: "desc" },
            take:    5,
            select: {
                id:                  true,
                notification_type:   true,
                trigger_event:       true,
                message:             true,
                helper_text:         true,
                scheduled_at:        true,
                sent_at:             true,
                status:              true,
                recipient_member_id: true,
            },
        }),
        prisma.campaignNotification.count({
            where: { campaign_id: campaign.id, notification_type: NotificationType.campaign },
        }),
        // Participant notifications preview (5) — for this member
        prisma.campaignNotification.findMany({
            where:   participantNotifWhere,
            orderBy: { created_at: "desc" },
            take:    5,
            select: {
                id:            true,
                trigger_event: true,
                message:       true,
                helper_text:   true,
                scheduled_at:  true,
                sent_at:       true,
                status:        true,
            },
        }),
        prisma.campaignNotification.count({ where: participantNotifWhere }),
    ]);

    const donors: DonorRow[] = donorsRaw.map((d) => ({
        ...d,
        created_at: d.created_at.getTime(),
        donations:  d.donations.map((don) => ({
            amount:       parseFloat(don.amount.toString()),
            donated_at:   don.created_at.getTime(),
            is_anonymous: don.is_anonymous,
        })),
    }));

    const topDonorId = donors.reduce<{ id: string; total: number } | null>((top, d) => {
        const total = d.donations.reduce((s, don) => s + don.amount, 0);
        return total > 0 && (!top || total > top.total) ? { id: d.id, total } : top;
    }, null)?.id ?? null;

    // ── Derived stats ────────────────────────────────────────────────────────

    const raisedAmt       = parseFloat(campaign.total_raised.toString());
    const goalAmt         = campaign.goal_amount         ? parseFloat(campaign.goal_amount.toString())         : null;
    const initialGoalAmt  = campaign.initial_goal_amount ? parseFloat(campaign.initial_goal_amount.toString()) : null;
    const daysLeft  = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - Date.now()) / 86_400_000))
        : null;

    // ── Participants ranked by amount raised ─────────────────────────────────

    const participants = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id:              m.id,
            name:            `${m.first_name} ${m.last_name}`,
            email:           m.email,
            donorsAdded:     m._count.donors,
            targetDonors:    m.target_donors,
            raised:          m.donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0),
            isOrganizer:     m.roles.some((r) => r.role === MemberRole.organizer),
            profilePhotoUrl: m.user?.profile_photo_url ?? null,
            username:        m.user?.username ?? null,
        }))
        .sort((a, b) => b.raised - a.raised);

    const effectiveGoalAmt = goalAmt && campaign.goal_type === "participant_goal"
        ? goalAmt * participants.length
        : goalAmt;

    // ── Notifications ────────────────────────────────────────────────────────

    const campaignNotifs = campaignNotifRows.map((n) => ({
        id:                  n.id,
        notification_type:   n.notification_type,
        trigger_event:       n.trigger_event,
        message:             n.message,
        helper_text:         n.helper_text,
        scheduled_at:        n.scheduled_at?.getTime() ?? null,
        sent_at:             n.sent_at?.getTime() ?? null,
        status:              n.status,
        recipient_member_id: n.recipient_member_id,
    }));

    const myParticipantNotifs = participantNotifRows.map((n) => ({
        id:            n.id,
        trigger_event: n.trigger_event,
        message:       n.message,
        helper_text:   n.helper_text,
        scheduled_at:  n.scheduled_at?.getTime() ?? null,
        sent_at:       n.sent_at?.getTime() ?? null,
        status:        n.status,
    }));

    // ── Progress chart + feed data ───────────────────────────────────────────

    const chartDonations = campaign.donations.map((d) => ({
        ts:     d.created_at.getTime(),
        amount: parseFloat(d.amount.toString()),
    }));

    const feedDonations = feedDonationsRaw.map((d) => ({
        id:                 d.id,
        amount:             d.amount.toString(),
        donor_display_name: d.donor_display_name,
        donor_first_name:   d.donor_first_name,
        donor_last_name:    d.donor_last_name,
        is_anonymous:       d.is_anonymous,
        created_at:         d.created_at.getTime(),
    }));

    // ── Shared stats helpers ─────────────────────────────────────────────────

    const daysElapsed = campaign.start_date
        ? Math.max(1, Math.ceil((Date.now() - campaign.start_date.getTime()) / 86_400_000))
        : 1;
    // Anonymous raised — campaign-wide (from the fetched donations sample)
    const anonRaised = campaign.donations
        .filter((d) => d.is_anonymous)
        .reduce((s, d) => s + parseFloat(d.amount.toString()), 0);

    const badge = STATUS_BADGE[campaign.status as CampaignStatus];

    // Cover image + campaign owner (primary organizer) for the header
    const ownerMember = campaign.members.find((m) => m.roles.some((r) => r.role === MemberRole.organizer)) ?? campaign.members[0];
    const ownerName   = ownerMember ? `${ownerMember.first_name} ${ownerMember.last_name}`.trim() : null;
    const ownerLabel  = ownerMember?.user_id === user.id ? "You" : ownerName;

    return (
        <div className="space-y-6">
            <AblyDashboardUpdater campaignSlug={slug} />

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-[22px] sm:text-[28px] font-black leading-tight text-[#003060]">
                            {isParticipantView ? (
                                <>
                                    {campaign.name ?? <span className="text-gray-400 italic">Untitled Campaign</span>}
                                    <span className="mx-2 font-light text-[#9aa7b8]">|</span>
                                    <span className="text-[#0268c0]">{myMembership.first_name} {myMembership.last_name}</span>
                                </>
                            ) : (
                                campaign.name ?? <span className="text-gray-400 italic">Untitled Campaign</span>
                            )}
                        </h1>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            {badge.label}
                        </span>
                        {isParticipantView && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                                Participant
                            </span>
                        )}
                        {/* Visibility + donations badges — colour reflects the label */}
                        {campaign.status !== CampaignStatus.draft && (() => {
                            const vis = {
                                private:  { label: "Private",  cls: "bg-gray-100 text-gray-600"  },
                                unlisted: { label: "Unlisted", cls: "bg-blue-100 text-blue-700"   },
                                public:   { label: "Public",   cls: "bg-green-100 text-green-700" },
                            }[campaign.visibility] ?? { label: campaign.visibility, cls: "bg-gray-100 text-gray-500" };
                            return (
                                <>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${vis.cls}`}>
                                        {vis.label}
                                    </span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${campaign.donations_enabled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                        {campaign.donations_enabled ? "Accepting Donations" : "Donations Paused"}
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-[#7e8a96]">
                        {ownerLabel && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Organized by <span className="font-semibold text-[#003060]">{ownerLabel}</span></span>
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                {campaign.campaign_type === "organization"
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                            </svg>
                            {campaign.campaign_type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                        </span>
                        {campaign.goal_type && (() => {
                            const labels: Record<string, string> = {
                                open_ended:       "Open-Ended Goal",
                                fixed:            "Fixed Goal",
                                org_goal:         "Shared Goal",
                                participant_goal: "Per-Participant Goal",
                            };
                            return (
                                <span className="inline-flex items-center gap-1.5">
                                    <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0l8 3 8-3v11l-8 3-8-3" />
                                    </svg>
                                    {labels[campaign.goal_type] ?? campaign.goal_type}
                                </span>
                            );
                        })()}
                        {campaign.start_date && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Started {fmtDateTime(campaign.start_date, campaign.timezone ?? "America/New_York")}
                            </span>
                        )}
                    </div>
                    <CopyUrlButton slug={slug} />
                </div>
                {isOrganizer && !isParticipantView && (
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <CampaignNavLink
                            href={`/campaigns/${slug}/edit`}
                            overlayText="Loading…"
                            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-b from-[#ff8c53] to-[#f47435] px-3 py-2.5 sm:px-5 text-[13px] font-bold uppercase tracking-[0.5px] text-white shadow-[0px_8px_15px_-8px_#ea6725] transition-all duration-150 hover:brightness-105 active:scale-[0.97]"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Edit Campaign</span>
                        </CampaignNavLink>
                        <CampaignControls
                            campaignSlug={slug}
                            visibility={campaign.visibility}
                            donationsEnabled={campaign.donations_enabled}
                            donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                            status={campaign.status}
                            endDate={campaign.end_date}
                        />
                        {(campaign.status === CampaignStatus.draft ||
                          (campaign.status === CampaignStatus.upcoming && donationTotal === 0)) && (
                            <DeleteCampaignButton
                                slug={slug}
                                campaignName={campaign.name ?? null}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* ── Role toggle ── */}
            {isBothRoles && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                        <a
                            href={`/dashboard/campaigns/${slug}`}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                !isParticipantView ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Organizer View
                        </a>
                        <a
                            href={`/dashboard/campaigns/${slug}?view=participant`}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                isParticipantView ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Participant View
                        </a>
                    </div>
                    {isParticipantView && (
                        <RemoveParticipantRoleButton
                            campaignSlug={slug}
                            memberId={myMembership.id}
                            raised={myMembership.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0)}
                        />
                    )}
                </div>
            )}


            {/* ── Upcoming banner ── */}
            {campaign.status === CampaignStatus.upcoming && campaign.start_date && (
                <UpcomingBanner startDate={campaign.start_date} />
            )}

            {/* ── Participant view ── */}
            {isParticipantView && (() => {
                const myRaised     = myMembership.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0);
                // Use campaign-level donors_per_participant as the goal; fall back to per-member override
                const myTarget     = campaign.donors_per_participant ?? myMembership.target_donors;
                // Participant-specific stats
                const myDonatedCount = donors.filter((d) => d.donations.length > 0).length;
                const participantStats = {
                    section:     "participant" as const,
                    anonRaised,
                    totalRaised: myRaised,
                    pctOfGoal:   raisedAmt > 0 ? (myRaised / raisedAmt) * 100 : null,
                    avgPerDonor: myDonatedCount > 0 ? myRaised / myDonatedCount : 0,
                };
                const myAdded      = myMembership._count.donors;
                const myDonated    = donors.filter((d) => d.status === "donated").length;
                const donorPct     = myTarget > 0 ? Math.min(100, Math.round((myAdded / myTarget) * 100)) : 0;
                const launchLabel  = campaign.status === CampaignStatus.upcoming && campaign.start_date
                    ? new Intl.DateTimeFormat("en-US", { timeZone: campaign.timezone ?? "America/New_York", month: "long", day: "numeric", year: "numeric" }).format(campaign.start_date)
                    : null;

                return (
                    <>
                        {/* FundBuddy onboarding welcome — shown once per participant (dismissal persisted client-side) */}
                        {campaign.status !== CampaignStatus.completed && (
                            <FundBuddyOnboarding
                                storageKey={`fbt:onboard:${slug}:${myMembership.id}`}
                                campaignName={campaign.name ?? "this campaign"}
                                donorTarget={myTarget}
                                launchLabel={launchLabel}
                            />
                        )}

                        {!campaign.donations_enabled && campaign.status === CampaignStatus.active && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <p className="text-sm text-amber-700">
                                    <span className="font-semibold">Donations are currently paused.</span>
                                    {campaign.donations_disabled_message
                                        ? <> {campaign.donations_disabled_message}</>
                                        : " Please check back later or contact the organizer."}
                                </p>
                            </div>
                        )}

                        {campaign.goal_type !== "participant_goal" && myRaised > 0 && (() => {
                            const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
                            const pct = raisedAmt > 0 ? parseFloat(((myRaised / raisedAmt) * 100).toFixed(2)) : 0;
                            const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                            return (
                                <div className="flex items-center gap-2.5 rounded-xl border border-[#cfe0f3] bg-[#eef5fc] px-4 py-2.5 text-sm text-[#0268c0]">
                                    <svg className="h-4 w-4 shrink-0 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>
                                        You&apos;ve personally raised{" "}
                                        <span className="font-bold text-[#003060]">{fmt(myRaised)}</span>
                                        {pct > 0 && (
                                            <> — <span className="font-semibold">{pct}%</span> of the total raised</>
                                        )}
                                    </span>
                                    {rank > 0 && participants.length >= 2 && <RankBadge rank={rank} className="ml-auto" />}
                                </div>
                            );
                        })()}

                        {campaign.goal_type === "participant_goal" && goalAmt && myRaised < goalAmt && campaign.status === CampaignStatus.active && (() => {
                            const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                            return (
                                <ParticipantGoalCard
                                    raised={myRaised}
                                    goal={goalAmt}
                                    rank={rank > 0 && participants.length >= 2 ? rank : null}
                                />
                            );
                        })()}

                        {campaign.goal_type === "participant_goal" && goalAmt && myRaised >= goalAmt && (campaign.status === CampaignStatus.active || campaign.status === CampaignStatus.completed) && (
                            <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-green-800">You&apos;ve reached your fundraising goal!</p>
                                        {(() => {
                                            const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                                            if (rank === 0 || participants.length < 2) return null;
                                            return <RankBadge rank={rank} />;
                                        })()}
                                    </div>
                                    <p className="text-xs text-green-600 mt-0.5">
                                        You&apos;ve raised{" "}
                                        <span className="font-semibold">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(myRaised)}
                                        </span>{" "}
                                        of your{" "}
                                        <span className="font-semibold">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmt)}
                                        </span>{" "}
                                        goal. Keep going — every extra donation counts!
                                    </p>
                                </div>
                            </div>
                        )}

                        {campaign.status === CampaignStatus.completed && (
                            <>
                                <div className="rounded-2xl overflow-hidden shadow-sm">
                                    <img
                                        src="/congratulations.png"
                                        alt="Congratulations! Campaign completed."
                                        className="w-full object-cover"
                                    />
                                </div>
                                <div id="statistics" className="scroll-mt-6">
                                    <CampaignStatsBars {...participantStats} />
                                </div>
                            </>
                        )}

                        <div id="fundraising-goal" className="flex flex-col gap-6 lg:flex-row lg:items-start scroll-mt-6">
                            {/* Left — progress bar + chart (matches organizer view) */}
                            <div className="flex-1 min-w-0 space-y-6">
                                <CampaignProgressBar
                                    raisedAmt={raisedAmt}
                                    goalAmt={effectiveGoalAmt}
                                    initialGoalAmt={initialGoalAmt}
                                    donationCount={donationTotal}
                                    endDate={campaign.end_date}
                                    startDate={campaign.start_date}
                                    daysLeft={daysLeft}
                                    status={campaign.status}
                                    goalType={campaign.goal_type}
                                    timezone={campaign.timezone}
                                />
                                <DonationChart startTs={campaign.start_date?.getTime() ?? null} endTs={campaign.end_date?.getTime() ?? null} donations={chartDonations} goalAmount={effectiveGoalAmt} initialGoalAmount={initialGoalAmt} title="Campaign Fundraising Progress" />
                            </div>

                            {/* Right — live feed */}
                            <div className="w-full shrink-0 lg:w-80">
                                <LiveDonationFeed donations={feedDonations} totalCount={donationTotal} campaignSlug={slug} isCompleted={campaign.status === CampaignStatus.completed} />
                            </div>
                        </div>

                        {/* Participant rankings — same card as the organizer view, read-only (no actions) */}
                        {campaign.campaign_type === "organization" && (
                            <ParticipantsTable
                                participants={participants.slice(0, 10)}
                                initialTotal={participants.length}
                                initialMaxRaised={participants[0]?.raised ?? 0}
                                isOrganizer={false}
                                readOnly
                                campaignSlug={slug}
                                goalAmount={effectiveGoalAmt}
                                perParticipantGoal={campaign.goal_type === "participant_goal" ? goalAmt : null}
                                myMemberId={myMembership.id}
                                donorsPerParticipant={campaign.donors_per_participant}
                                isCompleted={campaign.status === CampaignStatus.completed}
                            />
                        )}

                        {/* Participant Notifications — full-width table (matches organizer Campaign Notifications) */}
                        <div id="participant-notifications" className="scroll-mt-6">
                            <ParticipantNotifications
                                notifications={myParticipantNotifs}
                                totalCount={participantNotifTotal}
                                campaignSlug={slug}
                                participantName={`${myMembership.first_name} ${myMembership.last_name}`.trim()}
                                organizerName={ownerName}
                                organizationName={campaign.campaign_type === "organization" ? (campaign.org_display_name ?? null) : null}
                                senderPhotoUrl={ownerMember?.user?.profile_photo_url ?? null}
                            />
                        </div>

                        {/* My Donor Outreach — custom card (not from Figma) */}
                        <div className="rounded-2xl border border-[#e7e9eb] bg-white p-6 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5fc] text-[#0268c0]">
                                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </span>
                                    <div>
                                        <h2 className="text-[16px] font-bold text-[#003060]">My Donor Outreach</h2>
                                        <p className="text-[12px] text-[#9aa7b8]">Your contacts and how they&apos;re converting</p>
                                    </div>
                                </div>
                                {(() => {
                                    const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                                    if (rank === 0 || participants.length < 2) return null;
                                    return <RankBadge rank={rank} />;
                                })()}
                            </div>
                            <div className="mb-5 grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-[#eef5fc] p-4 text-center">
                                    <p className="text-[24px] font-bold text-[#003060]">{myAdded}</p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Contacts Added</p>
                                </div>
                                <div className="rounded-xl bg-[#eafaf1] p-4 text-center">
                                    <p className="text-[24px] font-bold text-[#28c45d]">{myDonated}</p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Have Donated</p>
                                </div>
                                <div className="rounded-xl bg-[#f4f6f9] p-4 text-center">
                                    <p className="text-[24px] font-bold text-[#003060]">
                                        {myAdded > 0 ? `${Math.round((myDonated / myAdded) * 100)}%` : "—"}
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Conversion</p>
                                </div>
                            </div>
                            {myTarget > 0 && (
                                <div className="rounded-xl border border-[#eef1f4] bg-[#fbfcfd] px-4 py-3.5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#7e8a96]">Donor target progress</span>
                                        <span className="text-xs font-bold text-[#003060]">{myAdded} of {myTarget}</span>
                                    </div>
                                    <StripedBar pct={donorPct} color="orange" />
                                    <p className="mt-2 text-[11px] font-medium text-[#9aa7b8]">{donorPct}% of your donor target reached</p>
                                </div>
                            )}
                        </div>

                        {/* Donors table — full width */}
                        <div id="donors" className="scroll-mt-6">
                        <DonorsTable
                            donors={donors.slice(0, 5)}
                            initialTotal={donors.length}
                            campaignSlug={slug}
                            isOrganizer={false}
                            participants={[]}
                            myMemberId={myMembership.id}
                            topDonorId={topDonorId}
                            isCompleted={campaign.status === CampaignStatus.completed}
                        />
                        </div>

                        {campaign.status !== CampaignStatus.completed && (
                            <div id="statistics" className="scroll-mt-6">
                                <CampaignStatsBars {...participantStats} />
                            </div>
                        )}
                    </>
                );
            })()}

            {/* ── Organizer view ── */}
            {!isParticipantView && (
                <>
                    {campaign.status === CampaignStatus.completed && (() => {
                        const donatedCount  = donors.filter((d) => d.donations.length > 0).length;
                        const donationCount = donors.reduce((s, d) => s + d.donations.length, 0);
                        return (
                            <>
                                <div className="rounded-2xl overflow-hidden shadow-sm">
                                    <img
                                        src="/congratulations.png"
                                        alt="Congratulations! Campaign completed."
                                        className="w-full object-cover"
                                    />
                                </div>
                                <CampaignStatsBars
                                    section="overall"
                                    title="Final Campaign Statistics"
                                    potentialDonors={donors.length}
                                    donorEngagementPct={donors.length > 0 ? (donatedCount / donors.length) * 100 : 0}
                                    avgDonation={donationCount > 0 ? raisedAmt / donationCount : 0}
                                    avgPerDay={raisedAmt / daysElapsed}
                                />
                            </>
                        );
                    })()}

<div id="fundraising-goal" className="flex flex-col gap-6 lg:flex-row lg:items-start scroll-mt-6">
                        <div className="flex-1 min-w-0 space-y-6">
                            <CampaignProgressBar
                                raisedAmt={raisedAmt}
                                goalAmt={effectiveGoalAmt}
                                initialGoalAmt={initialGoalAmt}
                                donationCount={donationTotal}
                                endDate={campaign.end_date}
                                startDate={campaign.start_date}
                                daysLeft={daysLeft}
                                status={campaign.status}
                                goalType={campaign.goal_type}
                                timezone={campaign.timezone}
                            />
                            <DonationChart startTs={campaign.start_date?.getTime() ?? null} endTs={campaign.end_date?.getTime() ?? null} donations={chartDonations} goalAmount={effectiveGoalAmt} initialGoalAmount={initialGoalAmt} />
                        </div>
                        <div className="w-full shrink-0 lg:w-80">
                            <LiveDonationFeed donations={feedDonations} totalCount={donationTotal} campaignSlug={slug} isCompleted={campaign.status === CampaignStatus.completed} />
                        </div>
                    </div>

                    {/* Participants + notifications — full width below the chart/feed */}
                    {isOrganizer && campaign.campaign_type === "organization" && (
                        <div id="participants" className="scroll-mt-6">
                            <ParticipantsTable
                                participants={participants.slice(0, 10)}
                                initialTotal={participants.length}
                                initialMaxRaised={participants[0]?.raised ?? 0}
                                isOrganizer={isOrganizer}
                                campaignSlug={slug}
                                goalAmount={effectiveGoalAmt}
                                perParticipantGoal={campaign.goal_type === "participant_goal" ? goalAmt : null}
                                myMemberId={myMembership.id}
                                donorsPerParticipant={campaign.donors_per_participant}
                                isCompleted={campaign.status === CampaignStatus.completed}
                            />
                        </div>
                    )}
                    <div id="campaign-notifications" className="scroll-mt-6">
                        <NotificationsTable title="Campaign Notifications" notifications={campaignNotifs} totalCount={campaignNotifTotal} campaignSlug={slug} />
                    </div>

                    {/* Donors table — full width */}
                    <div id="donors" className="scroll-mt-6">
                    <DonorsTable
                        donors={donors.slice(0, 5)}
                        initialTotal={donors.length}
                        campaignSlug={slug}
                        isOrganizer={isOrganizer}
                        myMemberId={myMembership.id}
                        topDonorId={topDonorId}
                        participants={participants.map((p) => {
                            const [first_name, ...rest] = p.name.split(" ");
                            return { id: p.id, first_name, last_name: rest.join(" ") };
                        })}
                        isCompleted={campaign.status === CampaignStatus.completed}
                    />
                    </div>

                    {campaign.status !== CampaignStatus.completed && (
                        <div id="statistics" className="scroll-mt-6">
                        {(() => {
                            const donatedCount  = donors.filter((d) => d.donations.length > 0).length;
                            const donationCount = donors.reduce((s, d) => s + d.donations.length, 0);
                            return (
                                <CampaignStatsBars
                                    section="overall"
                                    potentialDonors={donors.length}
                                    donorEngagementPct={donors.length > 0 ? (donatedCount / donors.length) * 100 : 0}
                                    avgDonation={donationCount > 0 ? raisedAmt / donationCount : 0}
                                    avgPerDay={raisedAmt / daysElapsed}
                                />
                            );
                        })()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
