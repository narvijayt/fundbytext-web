import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import CampaignUpdater from "./_components/CampaignUpdater";
import MarketingHero from "./_components/MarketingHero";
import MarketingDetails from "./_components/MarketingDetails";
import MarketingShareables from "./_components/MarketingShareables";
import MarketingLeaderboard from "./_components/MarketingLeaderboard";
import MarketingFooter from "./_components/MarketingFooter";
import DonateModalHost from "./_components/DonateModalHost";
import ShareModalHost from "./_components/ShareModalHost";
import { getMarketingTheme } from "./_components/marketingTheme";
import type { ModalParticipant } from "./_components/DonateModal";

export const revalidate = 60;

export type ParticipantRow = {
    id:                string;
    first_name:        string;
    last_name:         string;
    profile_photo_url: string | null;
    total_raised:      number;
};

export type RecentDonation = {
    display_name: string;
    amount:       number;
    is_anonymous: boolean;
    created_at:   string; // ISO — used for the "x ago" label in the live feed
};

async function getCampaign(slug: string) {
    return prisma.campaign.findUnique({
        where: { slug },
        include: {
            media:        { orderBy: { sort_order: "asc" } },
            organization: { select: { name: true, logo_url: true } },
            members: {
                include: {
                    roles:     { select: { role: true } },
                    donations: { where: { payment_status: "completed" }, select: { amount: true } },
                },
            },
            donations: {
                where:   { payment_status: "completed" },
                orderBy: { created_at: "desc" },
                take:    8,
                select: {
                    donor_display_name: true,
                    donor_first_name:   true,
                    donor_last_name:    true,
                    amount:             true,
                    is_anonymous:       true,
                    created_at:         true,
                },
            },
        },
    });
}

export default async function CampaignPublicPage({
    params,
    searchParams,
}: {
    params:       Promise<{ slug: string }>;
    searchParams: Promise<{ ref?: string; donor?: string }>;
}) {
    const [{ slug }, { ref, donor: donorToken }] = await Promise.all([params, searchParams]);
    const [campaign, authUser, donorCount] = await Promise.all([
        getCampaign(slug),
        getAuthUser(),
        prisma.donation.count({ where: { campaign: { slug }, payment_status: "completed" } }),
    ]);

    if (!campaign) notFound();

    const isOrganizer = authUser && campaign.members.some(
        (m) => m.user_id === authUser.id && m.roles.some((r) => r.role === MemberRole.organizer)
    );
    const isParticipant = authUser && campaign.members.some(
        (m) => m.user_id === authUser.id && m.roles.some((r) => r.role === MemberRole.participant)
    );
    const isMember = isOrganizer || isParticipant;

    // Draft: non-organizers always get a hard 404.
    if (campaign.status === "draft" && !isOrganizer) notFound();

    // Private: only members can view; everyone else gets the "not available" page.
    if (campaign.visibility === "private" && !isMember) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
                <CampaignUpdater campaignSlug={slug} status={campaign.status} />
                <nav className="flex items-center justify-between px-6 py-3 shadow-md" style={{ background: "#1565C0" }}>
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src="/assets/campaigns/app-logo.svg" width={28} height={40} alt="FundByText" className="app-logo w-6 h-9 brightness-0 invert" />
                        <span className="font-extrabold text-lg tracking-tight text-white hidden sm:block">FundByText</span>
                    </Link>
                    <Link href="/campaigns/create" className="px-5 py-2 rounded-lg text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
                        Get Started
                    </Link>
                </nav>
                <div className="flex-1 flex items-center justify-center px-4 py-20">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Campaign Not Found</h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8">
                            This campaign doesn&apos;t exist or the link you followed may be incorrect.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">Go Home</Link>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors">My Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isDraft = campaign.status === "draft";

    // ── Derived data ─────────────────────────────────────────────────────────
    const heroMedia    = campaign.media.find((m) => m.media_type === "hero");
    const galleryUrls  = campaign.media.filter((m) => m.media_type === "gallery").map((m) => m.url);
    const profileMedia = campaign.media.find((m) => m.media_type === "profile");

    const rawGoalAmount = campaign.goal_amount ? Number(campaign.goal_amount) : null;
    const totalRaised   = Number(campaign.total_raised);

    // Server component renders once per request, so reading the clock here is fine.
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now();
    const daysLeft = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - nowMs) / 86_400_000))
        : null;

    const organizerMember = campaign.members.find((m) => m.roles.some((r) => r.role === MemberRole.organizer));

    const participants: ParticipantRow[] = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id:                m.id,
            first_name:        m.first_name,
            last_name:         m.last_name,
            profile_photo_url: m.profile_photo_url,
            total_raised:      m.donations.reduce((s, d) => s + Number(d.amount), 0),
        }))
        .sort((a, b) => b.total_raised - a.total_raised);

    // participant_goal stores a per-participant target — scale up for the total.
    const isPerParticipantGoal = campaign.goal_type === "participant_goal";
    const participantScale = isPerParticipantGoal && participants.length > 0 ? participants.length : 1;
    const goalAmount = rawGoalAmount != null ? rawGoalAmount * participantScale : null;
    const pct = goalAmount && goalAmount > 0 ? Math.min(100, (totalRaised / goalAmount) * 100) : 0;
    const perParticipantGoal = isPerParticipantGoal
        ? rawGoalAmount
        : (goalAmount && participants.length > 0 ? Math.round(goalAmount / participants.length) : goalAmount);

    const recentDonations: RecentDonation[] = campaign.donations.map((d) => ({
        display_name: d.is_anonymous ? "Anonymous" : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`),
        amount:       Number(d.amount),
        is_anonymous: d.is_anonymous,
        created_at:   d.created_at.toISOString(),
    }));

    const accent       = campaign.accent_color ?? "#0268c0";
    const theme        = getMarketingTheme(campaign);
    const displayTitle = campaign.name ?? "Campaign";
    const tz           = campaign.timezone ?? "America/New_York";
    const fmtDate = (d: Date | null) => d
        ? new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", day: "numeric", year: "numeric" }).format(d)
        : null;

    const organizerName = organizerMember ? `${organizerMember.first_name} ${organizerMember.last_name}` : null;
    const orgBadge = campaign.campaign_type === "organization"
        ? (campaign.org_display_name ?? campaign.organization?.name ?? null)
        : null;
    const logoUrl = profileMedia?.url ?? campaign.organization?.logo_url ?? organizerMember?.profile_photo_url ?? null;

    const highlightMemberId = authUser
        ? (campaign.members.find((m) => m.user_id === authUser.id && m.roles.some((r) => r.role === MemberRole.participant))?.id ?? null)
        : null;

    const isFixedGoal = campaign.goal_type === "fixed" && campaign.campaign_type === "individual";
    const canDonate   = campaign.status === "active" && (campaign.donations_enabled ?? true);

    // ?ref= participant share link → inline donate form (not for draft/completed).
    const defaultTargetMemberId = ref
        ? (campaign.members.find((m) => m.invite_token === ref)?.id ?? null)
        : null;
    const donorPrefillRecord = donorToken
        ? await prisma.campaignDonor.findUnique({
            where:  { invite_token: donorToken },
            select: { id: true, first_name: true, last_name: true, email: true, prefill_amount_cents: true },
          })
        : null;
    const donorPrefill = donorPrefillRecord ? {
        donorId:   donorPrefillRecord.id,
        firstName: donorPrefillRecord.first_name,
        lastName:  donorPrefillRecord.last_name,
        email:     donorPrefillRecord.email ?? "",
        prefillAmountCents: donorPrefillRecord.prefill_amount_cents ?? null,
    } : null;

    const isParticipantRefLink = !!defaultTargetMemberId && !donorPrefill;
    const refTarget: ModalParticipant | null = defaultTargetMemberId
        ? (() => {
            const m = campaign.members.find((mm) => mm.id === defaultTargetMemberId);
            return m ? { id: m.id, first_name: m.first_name, last_name: m.last_name, profile_photo_url: m.profile_photo_url } : null;
        })()
        : null;
    const showInlineRef = isParticipantRefLink && !isDraft && campaign.status !== "completed";

    return (
        <div className="min-h-screen bg-[#f9f9fc] font-sans text-[#003060] overflow-x-hidden">
            <CampaignUpdater campaignSlug={slug} status={campaign.status} />

            {/* Member / draft preview banners */}
            {campaign.visibility === "private" && isMember && (
                <div className="bg-gray-800 px-6 py-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span className="text-sm font-semibold text-gray-200">Private Campaign</span>
                    <span className="text-sm text-gray-400">— Only campaign members can see this page.</span>
                </div>
            )}
            {isDraft && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        <span className="text-sm font-semibold text-amber-800">Draft Preview</span>
                        <span className="text-sm text-amber-700 hidden sm:inline">— This is how your campaign will look when published.</span>
                    </div>
                    <Link href={`/campaigns/${slug}/edit`} className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">Back to Editor</Link>
                </div>
            )}

            <MarketingHero
                slug={slug}
                title={displayTitle}
                logoUrl={logoUrl}
                heroUrl={heroMedia?.url ?? null}
                galleryUrls={galleryUrls}
                isOrganizer={!!isOrganizer}
                theme={theme}
                canDonate={canDonate}
            />

            <MarketingDetails
                theme={theme}
                totalRaised={totalRaised}
                goalAmount={goalAmount}
                donorCount={donorCount}
                pct={pct}
                daysLeft={daysLeft}
                recentDonations={recentDonations}
                story={campaign.story}
                organizerName={organizerName}
                organizerPhotoUrl={organizerMember?.profile_photo_url ?? profileMedia?.url ?? null}
                orgBadge={orgBadge}
                endDateLabel={fmtDate(campaign.end_date)}
                startDateLabel={fmtDate(campaign.start_date)}
                status={campaign.status}
                donationsEnabled={campaign.donations_enabled ?? true}
                donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                isFixedGoal={isFixedGoal}
                inlineRef={showInlineRef ? {
                    target:       refTarget,
                    donorPrefill: donorPrefill,
                    campaignSlug: slug,
                    campaignName: displayTitle,
                    heroUrl:      heroMedia?.url ?? null,
                } : null}
            />

            <MarketingShareables slug={slug} galleryUrls={galleryUrls} heroUrl={heroMedia?.url ?? null} theme={theme} />

            <MarketingLeaderboard
                participants={participants}
                goalAmount={goalAmount}
                perParticipantGoal={perParticipantGoal}
                theme={theme}
                highlightMemberId={highlightMemberId}
                canDonate={canDonate}
                isParticipantGoal={isPerParticipantGoal}
                showAmounts={!!isMember}
            />

            <MarketingFooter accent={accent} />

            {/* Donate modal host — drives the modal for nav / Donate Now / leaderboard.
                Skipped for ?ref= links (the inline form handles those) and drafts. */}
            {!isDraft && !showInlineRef && (
                <DonateModalHost
                    totalRaised={totalRaised}
                    goalAmount={goalAmount}
                    accent={accent}
                    participants={participants}
                    campaignSlug={slug}
                    campaignName={displayTitle}
                    campaignStory={campaign.story}
                    heroUrl={heroMedia?.url ?? null}
                    defaultTargetMemberId={defaultTargetMemberId}
                    donationsEnabled={campaign.donations_enabled ?? true}
                    donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                    status={campaign.status}
                    isFixedGoal={isFixedGoal}
                    donorPrefill={donorPrefill}
                    daysLeft={daysLeft}
                />
            )}

            {/* Help-Spread-the-Word modal — opened by any "share / more" affordance
                (hero + shareables share rows, and the thank-you modal). */}
            <ShareModalHost slug={slug} campaignName={displayTitle} heroUrl={heroMedia?.url ?? null} accent={accent} />
        </div>
    );
}
