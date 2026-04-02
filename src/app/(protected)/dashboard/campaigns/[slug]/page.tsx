import Link from "next/link";
import CampaignNavLink from "@/app/(protected)/dashboard/_components/CampaignNavLink";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MemberRole, CampaignStatus, NotificationType, PaymentStatus } from "@/generated/prisma/enums";
import DeleteCampaignButton from "../../_components/DeleteCampaignButton";
import CampaignStatsRow from "./_components/CampaignStatsRow";
import CampaignDatesBar from "./_components/CampaignDatesBar";
import DonationChart from "./_components/DonationChart";
import ParticipantsTable from "./_components/ParticipantsTable";
import NotificationsTable from "./_components/NotificationsTable";
import LiveDonationFeed from "./_components/LiveDonationFeed";
import ParticipantView from "./_components/ParticipantView";

const STATUS_BADGE: Record<CampaignStatus, { label: string; cls: string }> = {
    active:    { label: "Active",    cls: "bg-green-100 text-green-700"  },
    upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700"    },
    draft:     { label: "Draft",     cls: "bg-gray-100 text-gray-600"    },
    completed: { label: "Completed", cls: "bg-purple-100 text-purple-700" },
};

function fmtDate(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
                },
                orderBy: { created_at: "asc" },
            },
            donations: {
                where: { payment_status: PaymentStatus.completed },
                orderBy: { created_at: "desc" },
                take: 50,
                select: {
                    id: true,
                    amount: true,
                    donor_display_name: true,
                    donor_first_name: true,
                    donor_last_name: true,
                    is_anonymous: true,
                    created_at: true,
                },
            },
            notifications: {
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    notification_type: true,
                    trigger_event: true,
                    message: true,
                    helper_text: true,
                    scheduled_at: true,
                    sent_at: true,
                    status: true,
                    recipient_member_id: true,
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
    const isParticipantView = isBothRoles && view === "participant";

    const myDonors = isParticipantView
        ? await prisma.campaignDonor.findMany({
            where: { campaign_id: campaign.id, assigned_member_id: myMembership.id },
            orderBy: { created_at: "desc" },
            select: { id: true, first_name: true, last_name: true, email: true, phone: true, status: true },
        })
        : [];

    // ── Derived stats ────────────────────────────────────────────────────────

    const raisedAmt = parseFloat(campaign.total_raised.toString());
    const goalAmt   = campaign.goal_amount ? parseFloat(campaign.goal_amount.toString()) : null;
    const daysLeft  = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - Date.now()) / 86_400_000))
        : null;

    // ── Participants ranked by amount raised ─────────────────────────────────

    const participants = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id:          m.id,
            name:        `${m.first_name} ${m.last_name}`,
            email:       m.email,
            donorsAdded: m._count.donors,
            raised:      m.donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0),
            isOrganizer: m.roles.some((r) => r.role === MemberRole.organizer),
        }))
        .sort((a, b) => b.raised - a.raised);

    // ── Notifications split by type ──────────────────────────────────────────

    const participantNotifs = campaign.notifications.filter(
        (n) => n.notification_type === NotificationType.participant
    );
    const campaignNotifs = campaign.notifications.filter(
        (n) => n.notification_type === NotificationType.campaign
    );

    // ── Progress chart — last 14 days ────────────────────────────────────────

    const now = new Date();
    const chartDays = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (13 - i));
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const donationsByDay = chartDays.map((day) => {
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        const total = campaign.donations
            .filter((d) => d.created_at >= day && d.created_at < next)
            .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
        return { day, total };
    });

    const chartMax = Math.max(...donationsByDay.map((d) => d.total), 1);
    const badge    = STATUS_BADGE[campaign.status as CampaignStatus];

    return (
        <div className="space-y-6">
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
                            {campaign.name ?? <span className="text-gray-400 italic">Untitled Campaign</span>}
                        </h1>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            {badge.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {campaign.campaign_type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                        {campaign.start_date && ` · Started ${fmtDate(campaign.start_date)}`}
                    </p>
                </div>
                {isOrganizer && (
                    <div className="flex items-center gap-2 shrink-0">
                        {(campaign.status === CampaignStatus.draft || campaign.status === CampaignStatus.upcoming) && (
                            <DeleteCampaignButton
                                slug={slug}
                                campaignName={campaign.name ?? null}
                            />
                        )}
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
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
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
            )}

            {/* ── Participant view ── */}
            {isParticipantView && (
                <ParticipantView
                    myRaised={myMembership.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0)}
                    myTarget={myMembership.target_donors}
                    myDonorCount={myMembership._count.donors}
                    myDonors={myDonors}
                    campaignSlug={slug}
                />
            )}

            {/* ── Organizer view ── */}
            {!isParticipantView && <>
                <CampaignStatsRow
                    raisedAmt={raisedAmt}
                    goalAmt={goalAmt}
                    donationCount={campaign.donations.length}
                    daysLeft={daysLeft}
                    endDate={campaign.end_date}
                />

                <CampaignDatesBar
                    startDate={campaign.start_date}
                    endDate={campaign.end_date}
                    daysLeft={daysLeft}
                />

                <div className="flex gap-6 items-start">
                    <div className="flex-1 min-w-0 space-y-6">
                        <DonationChart donationsByDay={donationsByDay} chartMax={chartMax} />
                        <ParticipantsTable
                            participants={participants}
                            isOrganizer={isOrganizer}
                            campaignSlug={slug}
                        />
                        <NotificationsTable title="Participant Notifications" notifications={participantNotifs} />
                        <NotificationsTable title="Campaign Notifications" notifications={campaignNotifs} />
                    </div>
                    <LiveDonationFeed donations={campaign.donations} />
                </div>
            </>}
        </div>
    );
}
