import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { getDefaultCampaignVideo, getDefaultCampaignVideoThumbnail } from "@/lib/settings";
import { MemberRole } from "@/generated/prisma/enums";
import CampaignUpdater from "./_components/CampaignUpdater";
import MarketingHero from "./_components/MarketingHero";
import MarketingDetails from "./_components/MarketingDetails";
import MarketingShareables from "./_components/MarketingShareables";
import MarketingLeaderboard from "./_components/MarketingLeaderboard";
import MarketingFooter from "./_components/MarketingFooter";
import ErrorScreen, { PrimaryLink, SecondaryLink } from "@/components/ErrorScreen";
import CampaignPreviewBar from "./_components/CampaignPreviewBar";
import DonateModalHost from "./_components/DonateModalHost";
import ShareModalHost from "./_components/ShareModalHost";
import { getMarketingTheme } from "./_components/marketingTheme";
import type { ModalParticipant } from "./_components/DonateModal";

export const revalidate = 60;

// Open Graph / Twitter metadata so shared links preview with the campaign's
// name, story excerpt and hero image. Private/draft campaigns stay generic.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const c = await prisma.campaign.findUnique({
        where:  { slug },
        select: {
            name: true, story: true, status: true, visibility: true,
            media: { where: { media_type: "hero" }, select: { url: true }, take: 1 },
        },
    });
    if (!c || c.visibility === "private" || c.status === "draft") {
        return { title: "FundByText", description: "Fundraising made simple — start a campaign in minutes." };
    }
    const title       = c.name ?? "Campaign";
    const description = ((c.story ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200))
        || `Support ${title} on FundByText.`;
    const heroUrl = c.media[0]?.url ?? null;
    return {
        title:       `${title} · FundByText`,
        description,
        openGraph: { title, description, type: "website", images: heroUrl ? [{ url: heroUrl }] : undefined },
        twitter:   { card: "summary_large_image", title, description, images: heroUrl ? [heroUrl] : undefined },
    };
}

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
    const [campaign, authUser, donorCount, defaultVideo, defaultVideoThumb] = await Promise.all([
        getCampaign(slug),
        getAuthUser(),
        prisma.donation.count({ where: { campaign: { slug }, payment_status: "completed" } }),
        getDefaultCampaignVideo(),
        getDefaultCampaignVideoThumbnail(),
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

    // Private: only members can view; everyone else gets a branded 403.
    if (campaign.visibility === "private" && !isMember) {
        return (
            <>
                <CampaignUpdater campaignSlug={slug} status={campaign.status} />
                <ErrorScreen
                    code="403"
                    title="This campaign is private"
                    message="Only the organizer and campaign members can view this page. If you should have access, ask them to add you — otherwise, let’s get you back home."
                    actions={
                        <>
                            <PrimaryLink href="/">Back to home</PrimaryLink>
                            <SecondaryLink href="/dashboard">My dashboard</SecondaryLink>
                        </>
                    }
                />
            </>
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

    // When donations aren't live, the donate buttons stay clickable but open an
    // explanatory notice (draft / upcoming / completed / paused) instead of the form.
    const donateNotice = canDonate ? null
        : campaign.status === "draft"     ? { title: "Almost there!",    message: "Donations go live the moment this campaign is published." }
        : campaign.status === "upcoming"  ? { title: "Not open yet",     message: `Donations open when the campaign starts${fmtDate(campaign.start_date) ? ` on ${fmtDate(campaign.start_date)}` : ""}.` }
        : campaign.status === "completed" ? { title: "Campaign ended",   message: "This campaign has wrapped up and is no longer accepting donations. Thank you for the support!" }
        :                                   { title: "Donations paused", message: campaign.donations_disabled_message?.trim() || "This campaign has temporarily paused donations — please check back soon." };

    return (
        <div className="min-h-screen bg-[#f9f9fc] font-sans text-[#003060] overflow-x-hidden">
            <CampaignUpdater campaignSlug={slug} status={campaign.status} />

            {/* Member / draft preview banners */}
            <CampaignPreviewBar
                isDraft={isDraft}
                isPrivate={campaign.visibility === "private"}
                isOrganizer={!!isOrganizer}
                slug={slug}
            />

            <MarketingHero
                slug={slug}
                title={displayTitle}
                logoUrl={logoUrl}
                heroUrl={heroMedia?.url ?? null}
                galleryUrls={galleryUrls}
                isOrganizer={!!isOrganizer}
                theme={theme}
                canDonate={canDonate}
                donateNotice={donateNotice}
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
                startDate={campaign.start_date?.toISOString() ?? null}
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

            <MarketingShareables slug={slug} galleryUrls={galleryUrls} heroUrl={heroMedia?.url ?? null} videoUrl={campaign.video_url ?? defaultVideo} videoThumbnail={campaign.video_thumbnail_url ?? defaultVideoThumb} theme={theme} />

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
                    patternImage={theme.themeImage}
                    patternSize={theme.themeSize}
                    patternCover={theme.themeCover}
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
            <ShareModalHost slug={slug} campaignName={displayTitle} heroUrl={heroMedia?.url ?? null} accent={accent} videoUrl={campaign.video_url ?? defaultVideo} videoPoster={campaign.video_thumbnail_url ?? defaultVideoThumb ?? heroMedia?.url ?? null} />
        </div>
    );
}
