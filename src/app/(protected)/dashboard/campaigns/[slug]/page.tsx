import Link from "next/link";
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
import ParticipantRankings from "./_components/ParticipantRankings";
import ParticipantNotifications from "./_components/ParticipantNotifications";
import CampaignStatsBars from "./_components/CampaignStatsBars";
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

    return (
        <div className="space-y-6">
            <AblyDashboardUpdater campaignSlug={slug} />

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            Campaigns
                        </Link>
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm text-gray-600">{campaign.name ?? "Untitled Campaign"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isParticipantView ? (
                                <>
                                    {campaign.name ?? <span className="text-gray-400 italic">Untitled Campaign</span>}
                                    <span className="text-gray-300 mx-2 font-light">|</span>
                                    <span className="text-gray-700">{myMembership.first_name} {myMembership.last_name}</span>
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
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {campaign.campaign_type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                        {campaign.goal_type && (() => {
                            const labels: Record<string, string> = {
                                open_ended:       "Open-Ended Goal",
                                fixed:            "Fixed Goal",
                                org_goal:         "Shared Goal",
                                participant_goal: "Per-Participant Goal",
                            };
                            return ` · ${labels[campaign.goal_type] ?? campaign.goal_type}`;
                        })()}
                        {campaign.start_date && ` · Started ${fmtDate(campaign.start_date, campaign.timezone ?? "America/New_York")}`}
                    </p>
                    <CopyUrlButton slug={slug} />
                </div>
                {isOrganizer && !isParticipantView && (
                    <div className="flex items-center gap-2 shrink-0">
                        {(campaign.status === CampaignStatus.draft ||
                          (campaign.status === CampaignStatus.upcoming && donationTotal === 0)) && (
                            <DeleteCampaignButton
                                slug={slug}
                                campaignName={campaign.name ?? null}
                            />
                        )}
                        <CampaignControls
                            campaignSlug={slug}
                            visibility={campaign.visibility}
                            donationsEnabled={campaign.donations_enabled}
                            donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                            status={campaign.status}
                            endDate={campaign.end_date}
                        />
                        <CampaignNavLink
                            href={`/campaigns/${slug}/edit`}
                            overlayText="Loading…"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Campaign
                        </CampaignNavLink>
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

            {/* ── Visibility + donations status bar ── */}
            {campaign.status !== CampaignStatus.draft && (() => {
                const vis = {
                    private:  { label: "Private",  cls: "bg-gray-100 text-gray-600 border-gray-200",   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
                    unlisted: { label: "Unlisted", cls: "bg-blue-50 text-blue-600 border-blue-100",     icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /> },
                    public:   { label: "Public",   cls: "bg-green-50 text-green-700 border-green-100",  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                }[campaign.visibility] ?? { label: campaign.visibility, cls: "bg-gray-100 text-gray-500 border-gray-200", icon: null };

                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Visibility pill */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${vis.cls}`}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{vis.icon}</svg>
                            {vis.label}
                            {!isOrganizer && campaign.visibility === "private" && (
                                <span className="text-gray-400 font-normal">· not visible to donors</span>
                            )}
                        </div>

                        {/* Donations pill */}
                        {campaign.donations_enabled ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-green-50 text-green-700 border-green-100">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Accepting Donations
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-100">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Donations Paused
                            </div>
                        )}
                    </div>
                );
            })()}

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

                return (
                    <>
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
                            const rankColors =
                                rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                rank === 2 ? "bg-gray-100 text-gray-600 border-gray-200" :
                                rank === 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                             "bg-gray-50 text-gray-500 border-gray-100";
                            return (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                    <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>
                                        You&apos;ve personally raised{" "}
                                        <span className="font-bold">{fmt(myRaised)}</span>
                                        {pct > 0 && (
                                            <> — <span className="font-semibold">{pct}%</span> of the total raised</>
                                        )}
                                    </span>
                                    {rank > 0 && participants.length >= 2 && (
                                        <span className={`ml-auto inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${rankColors}`}>
                                            #{rank} in Rankings
                                        </span>
                                    )}
                                </div>
                            );
                        })()}

                        {campaign.goal_type === "participant_goal" && goalAmt && myRaised < goalAmt && campaign.status === CampaignStatus.active && (() => {
                            const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
                            const pct       = Math.min(100, Math.round((myRaised / goalAmt) * 100));
                            const remaining = goalAmt - myRaised;
                            return (
                                <div className="px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Your Fundraising Goal</p>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                                                if (rank === 0 || participants.length < 2) return null;
                                                const colors =
                                                    rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    rank === 2 ? "bg-gray-100 text-gray-600 border-gray-200" :
                                                    rank === 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                 "bg-gray-50 text-gray-500 border-gray-100";
                                                return (
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${colors}`}>
                                                        #{rank} in Rankings
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-xs font-semibold text-gray-500">{fmt(myRaised)} of {fmt(goalAmt)}</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">{pct}%</span> of your goal reached
                                        {" · "}
                                        <span className="font-semibold text-orange-600">{fmt(remaining)}</span> remaining
                                    </p>
                                </div>
                            );
                        })()}

                        {campaign.goal_type === "participant_goal" && goalAmt && myRaised >= goalAmt && (campaign.status === CampaignStatus.active || campaign.status === CampaignStatus.completed) && (
                            <div className="flex items-center gap-4 px-5 py-4 bg-green-50 border border-green-200 rounded-2xl shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
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
                                            const colors =
                                                rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                rank === 2 ? "bg-gray-100 text-gray-600 border-gray-200" :
                                                rank === 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                             "bg-gray-50 text-gray-500 border-gray-100";
                                            return (
                                                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${colors}`}>
                                                    #{rank} in Rankings
                                                </span>
                                            );
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

                        <div id="fundraising-goal" className="flex gap-6 items-start scroll-mt-6">
                            {/* Left — chart + notifications */}
                            <div className="flex-1 min-w-0 space-y-6">
                                <DonationChart startTs={campaign.start_date?.getTime() ?? null} endTs={campaign.end_date?.getTime() ?? null} donations={chartDonations} goalAmount={effectiveGoalAmt} initialGoalAmount={initialGoalAmt} title="Campaign Fundraising Progress" />

                                {/* Notifications */}
                                <div id="participant-notifications" className="scroll-mt-6">
                                <ParticipantNotifications
                                    notifications={myParticipantNotifs}
                                    totalCount={participantNotifTotal}
                                    campaignSlug={slug}
                                />
                                </div>
                            </div>

                            {/* Right — live feed + rankings */}
                            <div className="w-80 shrink-0 space-y-4">
                                <LiveDonationFeed donations={feedDonations} totalCount={donationTotal} campaignSlug={slug} isCompleted={campaign.status === CampaignStatus.completed} />
                                <ParticipantRankings
                                    participants={participants}
                                    myMemberId={myMembership.id}
                                />
                            </div>
                        </div>

                        {/* My Donor Outreach — full width, above donors table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-gray-900">My Donor Outreach</h2>
                                {(() => {
                                    const rank = participants.findIndex((p) => p.id === myMembership.id) + 1;
                                    if (rank === 0 || participants.length < 2) return null;
                                    const colors =
                                        rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                        rank === 2 ? "bg-gray-100 text-gray-600 border-gray-200" :
                                        rank === 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                     "bg-gray-50 text-gray-500 border-gray-100";
                                    return (
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${colors}`}>
                                            #{rank} in Rankings
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                <div className="text-center">
                                    <p className="text-2xl font-extrabold text-gray-900">{myAdded}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Contacts Added</p>
                                </div>
                                <div className="text-center border-x border-gray-100">
                                    <p className="text-2xl font-extrabold text-green-600">{myDonated}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Have Donated</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-extrabold text-gray-900">
                                        {myAdded > 0 ? `${Math.round((myDonated / myAdded) * 100)}%` : "—"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Conversion</p>
                                </div>
                            </div>
                            {myTarget > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-gray-500">Donor target progress</span>
                                        <span className="text-xs font-bold text-gray-700">{myAdded} of {myTarget}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${donorPct}%` }} />
                                    </div>
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

<div id="fundraising-goal" className="flex gap-6 items-start scroll-mt-6">
                        <div className="flex-1 min-w-0 space-y-6">
                            <DonationChart startTs={campaign.start_date?.getTime() ?? null} endTs={campaign.end_date?.getTime() ?? null} donations={chartDonations} goalAmount={effectiveGoalAmt} initialGoalAmount={initialGoalAmt} />
                            {isOrganizer && campaign.campaign_type === "organization" && (
                                <div id="participants" className="scroll-mt-6">
                                <ParticipantsTable
                                    participants={participants}
                                    isOrganizer={isOrganizer}
                                    campaignSlug={slug}
                                    goalAmount={effectiveGoalAmt}
                                    myMemberId={myMembership.id}
                                    donorsPerParticipant={campaign.donors_per_participant}
                                    isCompleted={campaign.status === CampaignStatus.completed}
                                />
                                </div>
                            )}
                            <div id="campaign-notifications" className="scroll-mt-6">
                                <NotificationsTable title="Campaign Notifications" notifications={campaignNotifs} totalCount={campaignNotifTotal} campaignSlug={slug} />
                            </div>
                        </div>
                        <div className="w-80 shrink-0">
                            <LiveDonationFeed donations={feedDonations} totalCount={donationTotal} campaignSlug={slug} isCompleted={campaign.status === CampaignStatus.completed} />
                        </div>
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
