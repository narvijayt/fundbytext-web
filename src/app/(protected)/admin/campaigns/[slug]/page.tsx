import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberRole, NotificationType, PaymentStatus } from "@/generated/prisma/enums";
import CampaignProgressBar from "@/app/(protected)/dashboard/campaigns/[slug]/_components/CampaignProgressBar";
import DonationChart       from "@/app/(protected)/dashboard/campaigns/[slug]/_components/DonationChart";
import LiveDonationFeed    from "@/app/(protected)/dashboard/campaigns/[slug]/_components/LiveDonationFeed";
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

// ── Detail-card building blocks ──────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-3 border-b border-[#eef1f4] px-6 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0268c0]">{icon}</span>
            <div className="min-w-0">
                <h2 className="text-[16px] font-bold text-[#003060]">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-[#9aa7b8]">{subtitle}</p>}
            </div>
        </div>
    );
}

function InfoTile({ label, children, accent = false, className = "" }: { label: string; children: ReactNode; accent?: boolean; className?: string }) {
    return (
        <div className={`rounded-xl border px-4 py-3 ${accent ? "border-[#d9e8f8] bg-linear-to-br from-[#f2f8ff] to-white" : "border-[#eef1f4] bg-[#f7f9fb]"} ${className}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[#9aa7b8]">{label}</p>
            <div className="mt-1 text-sm font-semibold text-[#003060]">{children}</div>
        </div>
    );
}

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
                    user:      { select: { profile_photo_url: true } },
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
            profilePhotoUrl: m.user?.profile_photo_url ?? null,
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
                        videoUrl={campaign.video_url ?? null}
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
                <AdminParticipantsTable
                    participants={participants}
                    perParticipantGoal={campaign.goal_type === "participant_goal" ? goalAmt : null}
                    donorsPerParticipant={campaign.donors_per_participant ?? null}
                />
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
                const hasMedia      = profileMedia.length > 0 || heroMedia.length > 0 || galleryMedia.length > 0;
                const showOrgDisplay = campaign.org_display_name && campaign.organization?.name && campaign.organization.name !== campaign.org_display_name;
                return (
                    <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <SectionHeader
                            icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            title="Campaign Details"
                        />
                        <div className="space-y-6 p-6">
                            {/* Media */}
                            {hasMedia && (
                                <div>
                                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Media</p>
                                    <div className="flex flex-wrap items-end gap-3">
                                        {profileMedia.map((m) => (
                                            <figure key={m.id} className="flex flex-col items-center gap-1.5">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={m.url} alt="Profile" className="h-16 w-16 rounded-full border border-[#e7e9eb] object-cover shadow-sm" />
                                                <figcaption className="text-[10px] font-medium uppercase tracking-wide text-[#9aa7b8]">Profile</figcaption>
                                            </figure>
                                        ))}
                                        {heroMedia.map((m) => (
                                            <figure key={m.id} className="overflow-hidden rounded-xl border border-[#e7e9eb] bg-white shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={m.url} alt="Hero" className="h-24 w-40 object-cover" />
                                                <figcaption className="border-t border-[#eef1f4] px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-[#9aa7b8]">Hero Photo</figcaption>
                                            </figure>
                                        ))}
                                        {galleryMedia.map((m, i) => (
                                            <figure key={m.id} className="overflow-hidden rounded-xl border border-[#e7e9eb] bg-white shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={m.url} alt={`Gallery ${i + 1}`} className="h-24 w-28 object-cover" />
                                                <figcaption className="border-t border-[#eef1f4] px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-[#9aa7b8]">Gallery {i + 1}</figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info tiles */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {campaign.goal_type && <InfoTile label="Goal Type">{GOAL_TYPE_LABELS[campaign.goal_type] ?? campaign.goal_type}</InfoTile>}
                                {campaign.campaign_type === "organization" && campaign.donors_per_participant != null && <InfoTile label="Donors Per Participant">{campaign.donors_per_participant}</InfoTile>}
                                {showOrgDisplay && <InfoTile label="Org Display Name">{campaign.org_display_name}</InfoTile>}
                                {campaign.goal_type && goalAmt != null && (
                                    <InfoTile label="Fundraising Goal" accent className="sm:col-span-2">
                                        {campaign.goal_type === "open_ended" ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[15px] font-bold text-[#003060]">{fmtUSD0(initialGoalAmt ?? goalAmt)}</span>
                                                <span className="text-xs font-medium text-[#9aa7b8]">initial</span>
                                                {goalAmt !== (initialGoalAmt ?? goalAmt) && (
                                                    <>
                                                        <svg className="h-3.5 w-3.5 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                        <span className="text-[15px] font-bold text-[#f47435]">{fmtUSD0(goalAmt)}</span>
                                                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f47435]">scaled</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : campaign.goal_type === "participant_goal" ? (
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-[#5b6b7c]">
                                                <span className="font-semibold text-[#003060]">{fmtUSD0(goalAmt)}</span><span className="text-[#9aa7b8]">per participant</span>
                                                <span className="text-[#9aa7b8]">×</span><span>{participants.length} participants</span>
                                                <span className="text-[#9aa7b8]">=</span><span className="text-[15px] font-bold text-[#003060]">{fmtUSD0(effectiveGoalAmt ?? goalAmt)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[15px] font-bold text-[#003060]">{fmtUSD0(goalAmt)}</span>
                                        )}
                                    </InfoTile>
                                )}
                            </div>

                            {/* Story */}
                            {campaign.story && (
                                <div>
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Campaign Story</p>
                                    <div className="rounded-xl border border-[#eef1f4] bg-[#fbfcfe] px-4 py-3.5 text-sm leading-relaxed text-[#5b6b7c] [&_a]:text-[#0268c0] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#9aa7b8] [&_em]:italic [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#003060] [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#003060] [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-[#003060] [&_li]:mb-0.5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#003060] [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: campaign.story }} />
                                </div>
                            )}

                            {/* Thank-you note */}
                            {campaign.thank_you_message && (
                                <div>
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa7b8]">Thank You Note for Donors <span className="font-medium normal-case tracking-normal text-[#9aa7b8]">(shown in email)</span></p>
                                    <div className="flex gap-3 rounded-xl border border-[#eef1f4] bg-[#f7f9fb] px-4 py-3.5">
                                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#c9d6e2]" fill="currentColor" viewBox="0 0 24 24"><path d="M7.17 6A5.001 5.001 0 002 11v5a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H6.5A2.5 2.5 0 019 6.5V6a1 1 0 00-1-1H7.17zM17.17 6A5.001 5.001 0 0012 11v5a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-1.5A2.5 2.5 0 0119 6.5V6a1 1 0 00-1-1h-.83z" /></svg>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5b6b7c]">{campaign.thank_you_message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Payout details */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <SectionHeader
                    icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    title="Payout Details"
                    subtitle="Check mailing address on file"
                />
                {!campaign.payout ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <svg className="h-8 w-8 text-[#d4dee7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        <p className="text-sm text-[#9aa7b8]">No payout details added yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4 p-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoTile label="Recipient">{campaign.payout.recipient_first_name} {campaign.payout.recipient_last_name}</InfoTile>
                            {campaign.payout.org_name && <InfoTile label="Organization">{campaign.payout.org_name}</InfoTile>}
                        </div>

                        {/* Mailing address — highlighted */}
                        <div className="flex items-start gap-3 rounded-xl border border-[#e7e9eb] bg-[#f7f9fb] px-4 py-3.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0268c0] shadow-sm">
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[#9aa7b8]">Mailing Address</p>
                                <p className="mt-1 text-sm font-semibold text-[#003060]">{campaign.payout.street_address}{campaign.payout.apt_suite && `, ${campaign.payout.apt_suite}`}</p>
                                <p className="text-sm text-[#5b6b7c]">{campaign.payout.city}, {campaign.payout.state} {campaign.payout.zip}</p>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#eef1f4] pt-4 text-xs text-[#9aa7b8]">
                            <span className="inline-flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Added {fmtDateTime(campaign.payout.created_at)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Last updated {fmtDateTime(campaign.payout.updated_at)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
