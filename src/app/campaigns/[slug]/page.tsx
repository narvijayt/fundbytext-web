import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import MediaGrid from "./_components/MediaGrid";
import CampaignStory from "./_components/CampaignStory";
import SpreadTheWord from "./_components/SpreadTheWord";
import CampaignDonateShell from "./_components/CampaignDonateShell";
import Leaderboard from "./_components/Leaderboard";
import CampaignUpdater from "./_components/CampaignUpdater";

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
                take:    5,
                select: {
                    donor_display_name: true,
                    donor_first_name:   true,
                    donor_last_name:    true,
                    amount:             true,
                    is_anonymous:       true,
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
    const [campaign, authUser] = await Promise.all([getCampaign(slug), getAuthUser()]);

    if (!campaign) notFound();

    const isOrganizer = authUser && campaign.members.some(
        (m) => m.user_id === authUser.id && m.roles.some((r) => r.role === MemberRole.organizer)
    );
    const isParticipant = authUser && campaign.members.some(
        (m) => m.user_id === authUser.id && m.roles.some((r) => r.role === MemberRole.participant)
    );
    const isMember = isOrganizer || isParticipant;

    // Draft: non-organizers always get a hard 404 (draft → launch is a separate flow)
    if (campaign.status === "draft" && !isOrganizer) {
        notFound();
    }

    // Private: members (organizer + participants) can always see their campaign.
    // Everyone else — including anonymous visitors and donors with direct links — gets
    // the "not available" page. Keep CampaignUpdater alive so when visibility flips
    // back, the controls_changed event triggers router.refresh() automatically.
    if (campaign.visibility === "private" && !isMember) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
                <CampaignUpdater campaignSlug={slug} status={campaign.status} />
                <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">F</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-orange-500 hidden sm:block">FundByText</span>
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
                            If you believe this is a mistake, contact the person who shared the link with you.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Go Home
                            </Link>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
                                My Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isDraft = campaign.status === "draft";

    // ── Derived data ─────────────────────────────────────────────────────────

    const heroMedia    = campaign.media.find((m) => m.media_type === "hero");
    const galleryMedia = campaign.media.filter((m) => m.media_type === "gallery");
    const profileMedia = campaign.media.find((m) => m.media_type === "profile");

    const rawGoalAmount        = campaign.goal_amount         ? Number(campaign.goal_amount)         : null;
    const rawInitialGoalAmount = campaign.initial_goal_amount ? Number(campaign.initial_goal_amount) : null;
    const totalRaised = Number(campaign.total_raised);

    const daysLeft = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - Date.now()) / 86_400_000))
        : null;

    const organizerMember = campaign.members.find((m) =>
        m.roles.some((r) => r.role === MemberRole.organizer)
    );

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

    // For org campaigns, goal_amount is stored per-participant — scale up for display
    const isOrgCampaign = campaign.campaign_type === "organization";
    const participantScale = isOrgCampaign && participants.length > 0 ? participants.length : 1;
    const goalAmount        = rawGoalAmount        != null ? rawGoalAmount        * participantScale : null;
    const initialGoalAmount = rawInitialGoalAmount != null ? rawInitialGoalAmount * participantScale : null;
    const pct = goalAmount && goalAmount > 0 ? Math.min(100, (totalRaised / goalAmount) * 100) : 0;

    const recentDonations: RecentDonation[] = campaign.donations.map((d) => ({
        display_name: d.is_anonymous
            ? "Anonymous"
            : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`),
        amount:       Number(d.amount),
        is_anonymous: d.is_anonymous,
    }));

    const donorCount   = campaign.donations.length;
    const accent       = campaign.accent_color ?? "#1565C0";
    const displayTitle = campaign.name ?? "Campaign";

    // If a participant ref link was used, resolve the target member
    const defaultTargetMemberId = ref
        ? (campaign.members.find((m) => m.invite_token === ref)?.id ?? null)
        : null;

    // If a donor invite link was used, resolve donor prefill info
    const donorPrefill = donorToken
        ? await prisma.campaignDonor.findUnique({
            where:  { invite_token: donorToken },
            select: { id: true, first_name: true, last_name: true, email: true },
          })
        : null;

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">
            <CampaignUpdater
                campaignSlug={slug}
                status={campaign.status}
            />

            {/* ── Navbar ────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-sm bg-white border-b border-gray-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight hidden sm:block" style={{ color: accent }}>FundByText</span>
                </Link>

                <div className="flex items-center gap-3">
                    <button className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="block w-5 h-0.5 bg-gray-600 rounded" />
                        <span className="block w-5 h-0.5 bg-gray-600 rounded" />
                        <span className="block w-5 h-0.5 bg-gray-600 rounded" />
                    </button>
                </div>
            </nav>

            {/* ── Private campaign banner — visible to members only ─────── */}
            {campaign.visibility === "private" && isMember && (
                <div className="bg-gray-800 px-6 py-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-200">Private Campaign</span>
                    <span className="text-sm text-gray-400">— Only campaign members can see this page. It is not visible to the public.</span>
                </div>
            )}

            {/* ── Draft preview banner ─────────────────────────────────── */}
            {isDraft && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-sm font-semibold text-amber-800">Draft Preview</span>
                        <span className="text-sm text-amber-700">— This is how your campaign will look when published. It is not visible to the public yet.</span>
                    </div>
                    <Link
                        href={`/campaigns/${slug}/edit`}
                        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                        Back to Editor
                    </Link>
                </div>
            )}

            {/* ── Campaign title ────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase"
                            style={{ background: campaign.status === "active" ? "#22c55e" : "#f97316" }}
                        >
                            {campaign.status}
                        </span>
                        {campaign.campaign_type === "organization" && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">Organization</span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{displayTitle}</h1>
                    {campaign.campaign_type === "organization" && campaign.org_display_name && (
                        <p className="text-sm text-gray-500 mt-1">
                            by {campaign.org_display_name}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Main two-column layout ─────────────────────────────────── */}
            <div className="bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_340px] gap-8">

                    {/* Left column — server-rendered */}
                    <div className="space-y-8">
                        <MediaGrid
                            heroUrl={heroMedia?.url ?? null}
                            galleryUrls={galleryMedia.map((m) => m.url)}
                            campaignName={displayTitle}
                        />

                        <CampaignStory
                            story={campaign.story ?? ""}
                            organizerName={organizerMember
                                ? `${organizerMember.first_name} ${organizerMember.last_name}`
                                : null}
                            organizerPhotoUrl={organizerMember?.profile_photo_url ?? profileMedia?.url ?? null}
                        />

                        <SpreadTheWord
                            slug={slug}
                            galleryUrls={galleryMedia.map((m) => m.url)}
                            accent={accent}
                        />
                    </div>

                    {/* Right column — client shell owns modal state (hidden in draft) */}
                    <div>
                        {isDraft && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
                                <p className="text-sm font-semibold text-gray-500">Progress panel</p>
                                <p className="text-xs text-gray-400">Donation stats and the Donate button will appear here once the campaign is live.</p>
                            </div>
                        )}
                        {!isDraft && (
                            <CampaignDonateShell
                                totalRaised={totalRaised}
                                goalAmount={goalAmount}
                                initialGoalAmount={initialGoalAmount}
                                pct={pct}
                                daysLeft={daysLeft}
                                donorCount={donorCount}
                                recentDonations={recentDonations}
                                accent={accent}
                                participants={participants}
                                campaignSlug={slug}
                                campaignName={displayTitle}
                                campaignStory={campaign.story ?? null}
                                heroUrl={heroMedia?.url ?? null}
                                defaultTargetMemberId={defaultTargetMemberId}
                                donationsEnabled={campaign.donations_enabled ?? true}
                                donationsDisabledMessage={campaign.donations_disabled_message ?? null}
                                endDate={campaign.end_date}
                                startDate={campaign.start_date}
                                status={campaign.status}
                                isFixedGoal={campaign.goal_type === "fixed" && campaign.campaign_type === "individual"}
                                donorPrefill={donorPrefill ? {
                                    donorId:   donorPrefill.id,
                                    firstName: donorPrefill.first_name,
                                    lastName:  donorPrefill.last_name,
                                    email:     donorPrefill.email ?? "",
                                } : null}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Leaderboard — full width, below the grid ──────────────── */}
            {participants.length > 0 && (
                <Leaderboard
                    participants={participants}
                    goalAmount={goalAmount}
                    accent={accent}
                    campaignSlug={slug}
                    donationsEnabled={campaign.donations_enabled ?? true}
                    status={campaign.status}
                />
            )}

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer style={{ background: "#0a1628" }} className="px-6 py-10">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <span className="text-white font-bold">FundByText</span>
                    </div>
                    <p className="text-white/40 text-xs">© FundByText 2026 — All Rights Reserved.</p>
                    <div className="flex gap-4 text-xs text-white/40">
                        <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
