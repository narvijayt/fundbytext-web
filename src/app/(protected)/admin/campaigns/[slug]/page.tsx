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
import AblyDashboardUpdater   from "@/app/(protected)/dashboard/campaigns/[slug]/_components/AblyDashboardUpdater";
import AdminDonorsTable       from "./_components/AdminDonorsTable";
import AdminParticipantsTable from "./_components/AdminParticipantsTable";
import AdminCampaignControls  from "./_components/AdminCampaignControls";
import DeleteCampaignButton   from "./_components/DeleteCampaignButton";
import CountdownBadge         from "@/components/CountdownBadge";
import { queryCampaignDonors, DEFAULT_PAGE_SIZE } from "./_lib/donors-query";

type Ctx = { params: Promise<{ slug: string }> };

function fmtUSD0(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    active:    { label: "Active",    cls: "bg-green-100 text-green-700"   },
    upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700"     },
    draft:     { label: "Draft",     cls: "bg-gray-100 text-gray-600"     },
    completed: { label: "Completed", cls: "bg-purple-100 text-purple-700" },
};

const META_ICON = "h-4 w-4 shrink-0 text-[#9aa7b8]";

export default async function AdminCampaignDetailPage({ params }: Ctx) {
    const { slug } = await params;

    const campaign = await prisma.campaign.findUnique({
        where: { slug },
        include: {
            payout:       true,
            media:        { orderBy: { sort_order: "asc" } },
            organization: { select: { id: true, name: true } },
            members: {
                select: {
                    id: true, user_id: true, first_name: true, last_name: true, email: true,
                    target_donors: true, created_at: true,
                    roles:     { select: { role: true } },
                    donations: { where: { payment_status: PaymentStatus.completed }, select: { amount: true } },
                    _count:    { select: { donors: true } },
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

    const [donorsFirst, donatedCount, feedDonationsRaw, donationTotal, campaignNotifRows, campaignNotifTotal] = await Promise.all([
        queryCampaignDonors({ campaignId: campaign.id, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
        prisma.campaignDonor.count({ where: { campaign_id: campaign.id, donations: { some: { payment_status: PaymentStatus.completed } } } }),
        prisma.donation.findMany({
            where:   { campaign_id: campaign.id, payment_status: PaymentStatus.completed },
            orderBy: { created_at: "desc" },
            take:    5,
            select:  { id: true, amount: true, donor_display_name: true, donor_first_name: true, donor_last_name: true, is_anonymous: true, created_at: true },
        }),
        prisma.donation.count({ where: { campaign_id: campaign.id, payment_status: PaymentStatus.completed } }),
        prisma.campaignNotification.findMany({
            where:   { campaign_id: campaign.id, notification_type: NotificationType.campaign },
            orderBy: { created_at: "desc" },
            take:    5,
            select:  { id: true, notification_type: true, trigger_event: true, message: true, helper_text: true, scheduled_at: true, sent_at: true, status: true, recipient_member_id: true },
        }),
        prisma.campaignNotification.count({ where: { campaign_id: campaign.id, notification_type: NotificationType.campaign } }),
    ]);

    // ── Derived ──
    const raisedAmt      = parseFloat(campaign.total_raised.toString());
    const goalAmt        = campaign.goal_amount         ? parseFloat(campaign.goal_amount.toString())         : null;
    const initialGoalAmt = campaign.initial_goal_amount ? parseFloat(campaign.initial_goal_amount.toString()) : null;
    // eslint-disable-next-line react-hooks/purity -- current time for countdown / per-day math
    const nowMs          = Date.now();
    const daysLeft       = campaign.end_date   ? Math.max(0, Math.ceil((campaign.end_date.getTime() - nowMs) / 86_400_000)) : null;
    const daysElapsed    = campaign.start_date ? Math.max(1, Math.ceil((nowMs - campaign.start_date.getTime()) / 86_400_000)) : 1;
    const donorsTotal    = donorsFirst.total;

    const participants = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id: m.id, userId: m.user_id, name: `${m.first_name} ${m.last_name}`, email: m.email,
            donorsAdded: m._count.donors, targetDonors: m.target_donors,
            raised: m.donations.reduce((s, d) => s + parseFloat(d.amount.toString()), 0),
            isOrganizer: m.roles.some((r) => r.role === MemberRole.organizer),
        }))
        .sort((a, b) => b.raised - a.raised);

    const organizer = campaign.members.find((m) => m.roles.some((r) => r.role === MemberRole.organizer));
    const effectiveGoalAmt = goalAmt && campaign.goal_type === "participant_goal" ? goalAmt * participants.length : goalAmt;

    const chartDonations = campaign.donations.map((d) => ({ ts: d.created_at.getTime(), amount: parseFloat(d.amount.toString()) }));
    const feedDonations  = feedDonationsRaw.map((d) => ({
        id: d.id, amount: d.amount.toString(), donor_display_name: d.donor_display_name,
        donor_first_name: d.donor_first_name, donor_last_name: d.donor_last_name,
        is_anonymous: d.is_anonymous, created_at: d.created_at.getTime(),
    }));
    const campaignNotifs = campaignNotifRows.map((n) => ({
        id: n.id, notification_type: n.notification_type, trigger_event: n.trigger_event, message: n.message,
        helper_text: n.helper_text, scheduled_at: n.scheduled_at?.getTime() ?? null, sent_at: n.sent_at?.getTime() ?? null,
        status: n.status, recipient_member_id: n.recipient_member_id,
    }));

    const badge = STATUS_BADGE[campaign.status] ?? { label: campaign.status, cls: "bg-gray-100 text-gray-500" };
    const orgName = campaign.organization?.name ?? campaign.org_display_name;

    const GOAL_TYPE_META: Record<string, string> = { open_ended: "Open-Ended Goal", fixed: "Fixed Goal", org_goal: "Shared Goal", participant_goal: "Per-Participant Goal" };

    const STATS = [
        { label: "Total Raised", value: fmtUSD0(raisedAmt) },
        { label: "Donations",    value: donationTotal.toLocaleString() },
        { label: "Donors Added", value: donorsTotal.toLocaleString() },
        { label: "Participants", value: participants.length.toLocaleString() },
    ];

    return (
        <div className="space-y-6">
            <AblyDashboardUpdater campaignSlug={slug} />

            {/* Back */}
            <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7e8a96] transition-colors hover:text-[#003060]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to Campaigns
            </Link>

            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-[22px] font-black leading-tight text-[#003060] sm:text-[28px]">
                            {campaign.name ?? <span className="italic text-gray-400">Untitled Campaign</span>}
                        </h1>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 text-xs font-semibold capitalize text-[#5b6b7c]">{campaign.campaign_type}</span>
                        {campaign.status !== "draft" && (() => {
                            const vis = {
                                private:  { label: "Private",  cls: "bg-gray-100 text-gray-600"  },
                                unlisted: { label: "Unlisted", cls: "bg-blue-100 text-blue-700"   },
                                public:   { label: "Public",   cls: "bg-green-100 text-green-700" },
                            }[campaign.visibility] ?? { label: campaign.visibility, cls: "bg-gray-100 text-gray-500" };
                            return (
                                <>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${vis.cls}`}>{vis.label}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.donations_enabled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                        {campaign.donations_enabled ? "Accepting Donations" : "Donations Paused"}
                                    </span>
                                </>
                            );
                        })()}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-[#7e8a96]">
                        {organizer && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className={META_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span>Organized by <Link href={`/admin/users/${organizer.user_id}`} className="font-semibold text-[#0268c0] hover:underline">{organizer.first_name} {organizer.last_name}</Link></span>
                            </span>
                        )}
                        {campaign.campaign_type === "organization" && orgName && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className={META_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                {campaign.organization ? <Link href={`/admin/organizations/${campaign.organization.id}`} className="font-semibold text-[#0268c0] hover:underline">{orgName}</Link> : <span className="font-semibold text-[#003060]">{orgName}</span>}
                            </span>
                        )}
                        {campaign.goal_type && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className={META_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0l8 3 8-3v11l-8 3-8-3" /></svg>
                                {GOAL_TYPE_META[campaign.goal_type] ?? campaign.goal_type}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <svg className={META_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {fmtDate(campaign.start_date)} – {fmtDate(campaign.end_date)}
                        </span>
                        {campaign.status === "upcoming" && <CountdownBadge date={campaign.start_date} mode="toStart" className="text-xs font-bold text-orange-500" />}
                        {campaign.status === "active" && <CountdownBadge date={campaign.end_date} mode="left" className="text-xs font-bold text-red-500" />}
                    </div>
                </div>

                {/* Right actions */}
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {campaign.status === "draft" && <DeleteCampaignButton campaignSlug={slug} />}
                    <Link
                        href={`/campaigns/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e7e9eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <p className="text-[13px] font-medium text-[#9aa7b8]">{s.label}</p>
                        <p className="mt-1 text-[24px] font-black text-[#003060]">{s.value}</p>
                    </div>
                ))}
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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                    <DonationChart
                        startTs={campaign.start_date?.getTime() ?? null}
                        endTs={campaign.end_date?.getTime() ?? null}
                        donations={chartDonations}
                        goalAmount={effectiveGoalAmt}
                        initialGoalAmount={initialGoalAmt}
                        title="Fundraising Progress"
                    />
                </div>
                <div className="w-full shrink-0 space-y-4 lg:w-80">
                    <LiveDonationFeed donations={feedDonations} totalCount={donationTotal} campaignSlug={slug} isCompleted={campaign.status === "completed"} />
                    {participants.length >= 2 && <ParticipantRankings participants={participants} myMemberId={null} />}
                </div>
            </div>

            {/* Overall stats */}
            <CampaignStatsBars
                section="overall"
                title="Campaign Statistics"
                potentialDonors={donorsTotal}
                donorEngagementPct={donorsTotal > 0 ? (donatedCount / donorsTotal) * 100 : 0}
                avgDonation={donationTotal > 0 ? raisedAmt / donationTotal : 0}
                avgPerDay={raisedAmt / daysElapsed}
            />

            {/* Participants */}
            {campaign.campaign_type === "organization" && participants.length > 0 && (
                <AdminParticipantsTable participants={participants} goalAmount={effectiveGoalAmt} />
            )}

            {/* Donors */}
            <AdminDonorsTable
                campaignSlug={slug}
                initialDonors={donorsFirst.donors}
                initialTotal={donorsFirst.total}
                totalRaised={donorsFirst.totalRaised}
                initialQuery=""
                initialStatus="all"
                initialSort="newest"
                initialPage={1}
                initialPageSize={DEFAULT_PAGE_SIZE}
            />

            {/* Notifications */}
            <NotificationsTable title="Campaign Notifications" notifications={campaignNotifs} totalCount={campaignNotifTotal} campaignSlug={slug} />

            {/* Campaign details */}
            {(() => {
                const profileMedia = campaign.media.filter((m) => m.media_type === "profile");
                const heroMedia    = campaign.media.filter((m) => m.media_type === "hero");
                const galleryMedia = campaign.media.filter((m) => m.media_type === "gallery");
                const GOAL_TYPE_LABELS: Record<string, string> = {
                    open_ended: "Open Ended (auto-scales +20%)", fixed: "Fixed", org_goal: "Organization Goal", participant_goal: "Per-Participant Goal",
                };
                return (
                    <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <div className="border-b border-[#eef1f4] px-6 py-4"><h2 className="text-[16px] font-bold text-[#003060]">Campaign Details</h2></div>
                        <div className="space-y-6 p-6">
                            {(profileMedia.length > 0 || heroMedia.length > 0 || galleryMedia.length > 0) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa7b8]">Media</p>
                                    <div className="flex flex-wrap gap-3">
                                        {profileMedia.map((m) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <div key={m.id} className="flex flex-col items-center gap-1"><img src={m.url} alt="Profile" className="h-16 w-16 rounded-full border border-[#e7e9eb] object-cover shadow-sm" /><span className="text-[10px] text-[#9aa7b8]">Profile</span></div>
                                        ))}
                                        {heroMedia.map((m) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <div key={m.id} className="flex flex-col items-center gap-1"><img src={m.url} alt="Hero" className="h-24 w-40 rounded-lg border border-[#e7e9eb] object-cover shadow-sm" /><span className="text-[10px] text-[#9aa7b8]">Hero Photo</span></div>
                                        ))}
                                        {galleryMedia.map((m, i) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <div key={m.id} className="flex flex-col items-center gap-1"><img src={m.url} alt={`Gallery ${i + 1}`} className="h-24 w-28 rounded-lg border border-[#e7e9eb] object-cover shadow-sm" /><span className="text-[10px] text-[#9aa7b8]">Gallery {i + 1}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-x-10 gap-y-4 text-sm sm:grid-cols-2">
                                {campaign.goal_type && (
                                    <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Goal Type</p><p className="font-semibold text-[#003060]">{GOAL_TYPE_LABELS[campaign.goal_type] ?? campaign.goal_type}</p></div>
                                )}
                                {campaign.campaign_type === "organization" && campaign.donors_per_participant != null && (
                                    <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Donors Per Participant</p><p className="font-semibold text-[#003060]">{campaign.donors_per_participant}</p></div>
                                )}
                                {campaign.org_display_name && campaign.organization?.name && campaign.organization.name !== campaign.org_display_name && (
                                    <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Org Display Name</p><p className="font-semibold text-[#003060]">{campaign.org_display_name}</p></div>
                                )}
                                {campaign.goal_type && goalAmt != null && (
                                    <div className="sm:col-span-2">
                                        <p className="mb-1 text-xs text-[#9aa7b8]">Fundraising Goal</p>
                                        {campaign.goal_type === "open_ended" ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-[#003060]">{fmtUSD0(initialGoalAmt ?? goalAmt)}</span>
                                                <span className="text-[#9aa7b8]">initial</span>
                                                {goalAmt !== (initialGoalAmt ?? goalAmt) && (
                                                    <>
                                                        <svg className="h-3.5 w-3.5 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                        <span className="font-bold text-[#f47435]">{fmtUSD0(goalAmt)}</span>
                                                        <span className="text-xs font-medium text-[#f47435]">scaled</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : campaign.goal_type === "participant_goal" ? (
                                            <div className="flex flex-wrap items-center gap-2 text-[#5b6b7c]">
                                                <span>{fmtUSD0(goalAmt)} <span className="text-[#9aa7b8]">per participant</span></span>
                                                <span className="text-[#9aa7b8]">×</span>
                                                <span>{participants.length} participants</span>
                                                <span className="text-[#9aa7b8]">=</span>
                                                <span className="font-bold text-[#003060]">{fmtUSD0(effectiveGoalAmt ?? goalAmt)}</span>
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-[#003060]">{fmtUSD0(goalAmt)}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {campaign.story && (
                                <div className="text-sm">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa7b8]">Campaign Story</p>
                                    <div className="leading-relaxed text-[#5b6b7c] [&_a]:text-[#0268c0] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#9aa7b8] [&_em]:italic [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:font-semibold [&_li]:mb-0.5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: campaign.story }} />
                                </div>
                            )}

                            {campaign.thank_you_message && (
                                <div className="text-sm">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa7b8]">Thank You Note for Donors (shown in email)</p>
                                    <p className="whitespace-pre-wrap rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-4 py-3 leading-relaxed text-[#5b6b7c]">{campaign.thank_you_message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Payout details */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="border-b border-[#eef1f4] px-6 py-4">
                    <h2 className="text-[16px] font-bold text-[#003060]">Payout Details</h2>
                    <p className="mt-0.5 text-xs text-[#9aa7b8]">Check mailing address on file</p>
                </div>
                {!campaign.payout ? (
                    <p className="px-6 py-8 text-center text-sm text-[#9aa7b8]">No payout details added yet.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-x-10 gap-y-4 px-6 py-5 text-sm sm:grid-cols-2">
                        <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Recipient</p><p className="font-semibold text-[#003060]">{campaign.payout.recipient_first_name} {campaign.payout.recipient_last_name}</p></div>
                        {campaign.payout.org_name && (<div><p className="mb-0.5 text-xs text-[#9aa7b8]">Organization</p><p className="font-semibold text-[#003060]">{campaign.payout.org_name}</p></div>)}
                        <div className={campaign.payout.org_name ? "sm:col-span-2" : ""}>
                            <p className="mb-0.5 text-xs text-[#9aa7b8]">Mailing Address</p>
                            <p className="font-semibold text-[#003060]">{campaign.payout.street_address}{campaign.payout.apt_suite && `, ${campaign.payout.apt_suite}`}</p>
                            <p className="text-[#5b6b7c]">{campaign.payout.city}, {campaign.payout.state} {campaign.payout.zip}</p>
                        </div>
                        <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Added</p><p className="text-[#5b6b7c]">{fmtDateTime(campaign.payout.created_at)}</p></div>
                        <div><p className="mb-0.5 text-xs text-[#9aa7b8]">Last Updated</p><p className="text-[#5b6b7c]">{fmtDateTime(campaign.payout.updated_at)}</p></div>
                    </div>
                )}
            </div>
        </div>
    );
}
