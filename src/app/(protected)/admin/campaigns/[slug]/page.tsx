import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberRole, NotificationType, PaymentStatus } from "@/generated/prisma/enums";
import CampaignProgressBar from "@/app/(protected)/dashboard/campaigns/[slug]/_components/CampaignProgressBar";
import DonationChart       from "@/app/(protected)/dashboard/campaigns/[slug]/_components/DonationChart";
import LiveDonationFeed    from "@/app/(protected)/dashboard/campaigns/[slug]/_components/LiveDonationFeed";
import ParticipantRankings from "@/app/(protected)/dashboard/campaigns/[slug]/_components/ParticipantRankings";
import NotificationsTable  from "@/app/(protected)/dashboard/campaigns/[slug]/_components/NotificationsTable";
import CampaignStatsBars   from "@/app/(protected)/dashboard/campaigns/[slug]/_components/CampaignStatsBars";
import AdminDonorsTable       from "./_components/AdminDonorsTable";
import AdminParticipantsTable from "./_components/AdminParticipantsTable";
import AdminCampaignControls  from "./_components/AdminCampaignControls";
import DeleteCampaignButton   from "./_components/DeleteCampaignButton";
import AblyDashboardUpdater   from "@/app/(protected)/dashboard/campaigns/[slug]/_components/AblyDashboardUpdater";
import CountdownBadge     from "@/components/CountdownBadge";

type Ctx = { params: Promise<{ slug: string }>; searchParams: Promise<{ dp?: string }> };

const DONORS_PER_PAGE = 25;

function fmtDateTime(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " at "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    upcoming:  "bg-blue-100 text-blue-700",
    draft:     "bg-gray-100 text-gray-600",
    completed: "bg-purple-100 text-purple-700",
};

export default async function AdminCampaignDetailPage({ params, searchParams }: Ctx) {
    const { slug } = await params;
    const sp = await searchParams;
    const dp = Math.max(1, parseInt(sp.dp ?? "1") || 1);

    const campaign = await prisma.campaign.findUnique({
        where: { slug },
        include: {
            payout:       true,
            media:        { orderBy: { sort_order: "asc" } },
            organization: { select: { id: true, name: true } },
            members: {
                select: {
                    id:            true,
                    user_id:       true,
                    first_name:    true,
                    last_name:     true,
                    email:         true,
                    target_donors: true,
                    created_at:    true,
                    roles:     { select: { role: true } },
                    donations: {
                        where:  { payment_status: PaymentStatus.completed },
                        select: { amount: true },
                    },
                    _count: { select: { donors: true } },
                },
                orderBy: { created_at: "asc" },
            },
            donations: {
                where:   { payment_status: PaymentStatus.completed },
                orderBy: { created_at: "asc" },
                take:    200,
                select:  { amount: true, is_anonymous: true, created_at: true },
            },
        },
    });

    if (!campaign) notFound();

    const [donorsRaw, donorsTotal, donatedCount, feedDonationsRaw, donationTotal, campaignNotifRows, campaignNotifTotal] = await Promise.all([
        prisma.campaignDonor.findMany({
            where:   { campaign_id: campaign.id },
            orderBy: { created_at: "desc" },
            skip:    (dp - 1) * DONORS_PER_PAGE,
            take:    DONORS_PER_PAGE,
            select: {
                id:           true,
                first_name:   true,
                last_name:    true,
                email:        true,
                phone:        true,
                status:       true,
                invite_token: true,
                assigned_member_id: true,
                created_at:   true,
                assigned_member: { select: { user_id: true, first_name: true, last_name: true } },
                added_by_member: { select: { user_id: true, first_name: true, last_name: true } },
                donations: {
                    where:  { payment_status: "completed" },
                    select: { amount: true, created_at: true, is_anonymous: true },
                },
            },
        }),
        prisma.campaignDonor.count({ where: { campaign_id: campaign.id } }),
        prisma.campaignDonor.count({
            where: { campaign_id: campaign.id, donations: { some: { payment_status: PaymentStatus.completed } } },
        }),
        prisma.donation.findMany({
            where:   { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
            orderBy: { created_at: "desc" },
            take:    5,
            select: {
                id: true, amount: true, donor_display_name: true,
                donor_first_name: true, donor_last_name: true,
                is_anonymous: true, created_at: true,
            },
        }),
        prisma.donation.count({ where: { campaign_id: campaign.id, payment_status: PaymentStatus.completed } }),
        prisma.campaignNotification.findMany({
            where:   { campaign_id: campaign.id, notification_type: NotificationType.campaign },
            orderBy: { created_at: "desc" },
            take:    5,
            select: {
                id: true, notification_type: true, trigger_event: true,
                message: true, helper_text: true, scheduled_at: true,
                sent_at: true, status: true, recipient_member_id: true,
            },
        }),
        prisma.campaignNotification.count({
            where: { campaign_id: campaign.id, notification_type: NotificationType.campaign },
        }),
    ]);

    // ── Derived ──────────────────────────────────────────────────────────────

    const raisedAmt      = parseFloat(campaign.total_raised.toString());
    const goalAmt        = campaign.goal_amount         ? parseFloat(campaign.goal_amount.toString())         : null;
    const initialGoalAmt = campaign.initial_goal_amount ? parseFloat(campaign.initial_goal_amount.toString()) : null;
    const daysLeft       = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - Date.now()) / 86_400_000))
        : null;
    const daysElapsed    = campaign.start_date
        ? Math.max(1, Math.ceil((Date.now() - campaign.start_date.getTime()) / 86_400_000))
        : 1;

    const participants = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id:           m.id,
            userId:       m.user_id,
            name:         `${m.first_name} ${m.last_name}`,
            email:        m.email,
            donorsAdded:  m._count.donors,
            targetDonors: m.target_donors,
            raised:       m.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0),
            isOrganizer:  m.roles.some((r) => r.role === MemberRole.organizer),
        }))
        .sort((a, b) => b.raised - a.raised);

    const organizer = campaign.members.find((m) => m.roles.some((r) => r.role === MemberRole.organizer));

    const effectiveGoalAmt = goalAmt && campaign.goal_type === "participant_goal"
        ? goalAmt * participants.length
        : goalAmt;

    const donationCount  = donationTotal;

    const chartDonations = campaign.donations.map((d) => ({
        ts:     d.created_at.getTime(),
        amount: parseFloat(d.amount.toString()),
    }));

    const feedDonations = feedDonationsRaw.map((d) => ({
        id: d.id, amount: d.amount.toString(),
        donor_display_name: d.donor_display_name,
        donor_first_name:   d.donor_first_name,
        donor_last_name:    d.donor_last_name,
        is_anonymous:       d.is_anonymous,
        created_at:         d.created_at.getTime(),
    }));

    const campaignNotifs = campaignNotifRows.map((n) => ({
        id: n.id, notification_type: n.notification_type,
        trigger_event: n.trigger_event, message: n.message,
        helper_text: n.helper_text,
        scheduled_at: n.scheduled_at?.getTime() ?? null,
        sent_at:      n.sent_at?.getTime()      ?? null,
        status: n.status, recipient_member_id: n.recipient_member_id,
    }));

    const donors = donorsRaw.map((d) => ({
        ...d,
        isWalkIn:      !d.invite_token,
        isGeneralFund: !d.assigned_member_id,
        isAnonymous:   d.donations.some((don) => don.is_anonymous),
        created_at: d.created_at.getTime(),
        donations:  d.donations.map((don) => ({
            amount:     parseFloat(don.amount.toString()),
            donated_at: don.created_at.getTime(),
        })),
    }));

    return (
        <div className="space-y-6">
            <AblyDashboardUpdater campaignSlug={slug} />
            {/* Back */}
            <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Campaigns
            </Link>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h1 className="text-xl font-bold text-gray-900">{campaign.name ?? "Untitled Campaign"}</h1>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[campaign.status] ?? "bg-gray-100 text-gray-500"}`}>
                                {campaign.status}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                                {campaign.campaign_type}
                            </span>
                        </div>
                        {campaign.campaign_type === "organization" && (campaign.organization?.name || campaign.org_display_name) && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                Organization:{" "}
                                <span className="font-medium text-gray-700">
                                    {campaign.organization?.name ?? campaign.org_display_name}
                                </span>
                                {campaign.organization?.name && campaign.org_display_name &&
                                 campaign.organization.name !== campaign.org_display_name && (
                                    <span className="text-gray-400 text-xs ml-1">(display: {campaign.org_display_name})</span>
                                )}
                            </p>
                        )}
                        {organizer && (
                            <p className="text-sm text-gray-500 mt-1">
                                Organizer:{" "}
                                <Link href={`/admin/users/${organizer.user_id}`} className="font-medium text-[#0268c0] hover:underline">
                                    {organizer.first_name} {organizer.last_name}
                                </Link>
                                {organizer.email && (
                                    <Link href={`/admin/users/${organizer.user_id}`} className="text-gray-400 hover:text-[#0268c0] hover:underline">
                                        {" · "}{organizer.email}
                                    </Link>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="text-right text-sm text-gray-400 space-y-0.5">
                        <div className="flex justify-end items-center gap-2 mb-2">
                            {campaign.status === "draft" && (
                                <DeleteCampaignButton campaignSlug={slug} />
                            )}
                            <Link
                                href={`/campaigns/${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Public Page
                            </Link>
                            <AdminCampaignControls
                                campaignSlug={slug}
                                visibility={campaign.visibility as "private" | "unlisted" | "public"}
                                donationsEnabled={campaign.donations_enabled}
                                donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                                status={campaign.status}
                            />
                        </div>
                        <p>Start: <span className="text-gray-600 font-medium">{fmtDateTime(campaign.start_date)}</span></p>
                        <p>End: <span className="text-gray-600 font-medium">{fmtDateTime(campaign.end_date)}</span></p>
                        {campaign.status === "upcoming" && (
                            <CountdownBadge date={campaign.start_date} mode="toStart" className="text-xs font-bold text-orange-500 mt-1" />
                        )}
                        {campaign.status === "active" && (
                            <CountdownBadge date={campaign.end_date} mode="left" className="text-xs font-bold text-red-500 mt-1" />
                        )}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100 text-center">
                    <div>
                        <p className="text-xl font-extrabold text-gray-900">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(raisedAmt)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Total Raised</p>
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-gray-900">{donationTotal}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Donations</p>
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-gray-900">{donorsTotal}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Donors Added</p>
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-gray-900">{participants.length}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Participants</p>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
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
            />

            {/* Chart + Feed */}
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0">
                    <DonationChart
                        startTs={campaign.start_date?.getTime() ?? null}
                        endTs={campaign.end_date?.getTime() ?? null}
                        donations={chartDonations}
                        goalAmount={effectiveGoalAmt}
                        initialGoalAmount={initialGoalAmt}
                        title="Fundraising Progress"
                    />
                </div>
                <div className="w-80 shrink-0 space-y-4">
                    <LiveDonationFeed
                        donations={feedDonations}
                        totalCount={donationTotal}
                        campaignSlug={slug}
                        isCompleted={campaign.status === "completed"}
                    />
                    {participants.length >= 2 && (
                        <ParticipantRankings participants={participants} myMemberId={null} />
                    )}
                </div>
            </div>

            {/* Overall stats */}
            <CampaignStatsBars
                section="overall"
                title="Campaign Statistics"
                potentialDonors={donorsTotal}
                donorEngagementPct={donorsTotal > 0 ? (donatedCount / donorsTotal) * 100 : 0}
                avgDonation={donationCount > 0 ? raisedAmt / donationCount : 0}
                avgPerDay={raisedAmt / daysElapsed}
            />

            {/* Participants */}
            {campaign.campaign_type === "organization" && participants.length > 0 && (
                <AdminParticipantsTable participants={participants} goalAmount={effectiveGoalAmt} />
            )}

            {/* Donors */}
            <AdminDonorsTable
                donors={donors}
                total={donorsTotal}
                page={dp}
                totalPages={Math.ceil(donorsTotal / DONORS_PER_PAGE)}
                prevHref={dp > 1 ? `/admin/campaigns/${slug}?dp=${dp - 1}` : null}
                nextHref={dp < Math.ceil(donorsTotal / DONORS_PER_PAGE) ? `/admin/campaigns/${slug}?dp=${dp + 1}` : null}
            />

            {/* Notifications */}
            <NotificationsTable
                title="Campaign Notifications"
                notifications={campaignNotifs}
                totalCount={campaignNotifTotal}
                campaignSlug={slug}
            />

            {/* Campaign details */}
            {(() => {
                const profileMedia = campaign.media.filter((m) => m.media_type === "profile");
                const heroMedia    = campaign.media.filter((m) => m.media_type === "hero");
                const galleryMedia = campaign.media.filter((m) => m.media_type === "gallery");

                const GOAL_TYPE_LABELS: Record<string, string> = {
                    open_ended:       "Open Ended (auto-scales +20%)",
                    fixed:            "Fixed",
                    org_goal:         "Organization Goal",
                    participant_goal: "Per-Participant Goal",
                };

                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">Campaign Details</h2>
                        </div>
                        <div className="p-6 space-y-6">

                            {/* Media row */}
                            {(profileMedia.length > 0 || heroMedia.length > 0 || galleryMedia.length > 0) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Media</p>
                                    <div className="flex flex-wrap gap-3">
                                        {profileMedia.map((m) => (
                                            <div key={m.id} className="flex flex-col items-center gap-1">
                                                <img src={m.url} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-gray-100 shadow-sm" />
                                                <span className="text-[10px] text-gray-400">Profile</span>
                                            </div>
                                        ))}
                                        {heroMedia.map((m) => (
                                            <div key={m.id} className="flex flex-col items-center gap-1">
                                                <img src={m.url} alt="Hero" className="w-40 h-24 rounded-lg object-cover border border-gray-100 shadow-sm" />
                                                <span className="text-[10px] text-gray-400">Hero Photo</span>
                                            </div>
                                        ))}
                                        {galleryMedia.map((m, i) => (
                                            <div key={m.id} className="flex flex-col items-center gap-1">
                                                <img src={m.url} alt={`Gallery ${i + 1}`} className="w-28 h-24 rounded-lg object-cover border border-gray-100 shadow-sm" />
                                                <span className="text-[10px] text-gray-400">Gallery {i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Goal + donors per participant */}
                            <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                                {campaign.goal_type && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Goal Type</p>
                                        <p className="font-medium text-gray-800">{GOAL_TYPE_LABELS[campaign.goal_type] ?? campaign.goal_type}</p>
                                    </div>
                                )}
                                {campaign.campaign_type === "organization" && campaign.donors_per_participant != null && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Donors Per Participant</p>
                                        <p className="font-medium text-gray-800">{campaign.donors_per_participant}</p>
                                    </div>
                                )}
                                {campaign.goal_type && goalAmt != null && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 mb-1">Fundraising Goal</p>
                                        {campaign.goal_type === "open_ended" ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-gray-800">
                                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(initialGoalAmt ?? goalAmt)}
                                                </span>
                                                <span className="text-gray-400">initial</span>
                                                {goalAmt !== (initialGoalAmt ?? goalAmt) && (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <span className="font-semibold text-orange-600">
                                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmt)}
                                                        </span>
                                                        <span className="text-xs text-orange-500 font-medium">scaled</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : campaign.goal_type === "participant_goal" ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-gray-500">
                                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmt)}
                                                    <span className="text-gray-400"> per participant</span>
                                                </span>
                                                <span className="text-gray-400">×</span>
                                                <span className="text-gray-500">{participants.length} participants</span>
                                                <span className="text-gray-400">=</span>
                                                <span className="font-semibold text-gray-800">
                                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(effectiveGoalAmt ?? goalAmt)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="font-medium text-gray-800">
                                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmt)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Story */}
                            {campaign.story && (
                                <div className="text-sm">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Campaign Story</p>
                                    <div
                                        className="text-gray-700 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:font-semibold [&_h3]:mb-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:font-semibold [&_em]:italic [&_a]:text-[#0268c0] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_blockquote]:italic"
                                        dangerouslySetInnerHTML={{ __html: campaign.story }}
                                    />
                                </div>
                            )}

                            {/* Thank you note */}
                            {campaign.thank_you_message && (
                                <div className="text-sm">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Thank You Note for Donors (shown in email)</p>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                        {campaign.thank_you_message}
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                );
            })()}

            {/* Payout details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Payout Details</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Check mailing address on file</p>
                </div>
                {!campaign.payout ? (
                    <p className="px-6 py-8 text-sm text-gray-400 text-center">No payout details added yet.</p>
                ) : (
                    <div className="px-6 py-5 grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Recipient</p>
                            <p className="font-medium text-gray-800">
                                {campaign.payout.recipient_first_name} {campaign.payout.recipient_last_name}
                            </p>
                        </div>
                        {campaign.payout.org_name && (
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Organization</p>
                                <p className="font-medium text-gray-800">{campaign.payout.org_name}</p>
                            </div>
                        )}
                        <div className={campaign.payout.org_name ? "col-span-2" : ""}>
                            <p className="text-xs text-gray-400 mb-0.5">Mailing Address</p>
                            <p className="font-medium text-gray-800">
                                {campaign.payout.street_address}
                                {campaign.payout.apt_suite && `, ${campaign.payout.apt_suite}`}
                            </p>
                            <p className="text-gray-600">
                                {campaign.payout.city}, {campaign.payout.state} {campaign.payout.zip}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Added</p>
                            <p className="text-gray-600">{fmtDateTime(campaign.payout.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                            <p className="text-gray-600">{fmtDateTime(campaign.payout.updated_at)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
