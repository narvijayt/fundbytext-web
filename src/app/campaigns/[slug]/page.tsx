import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import MediaGrid from "./_components/MediaGrid";
import CampaignStory from "./_components/CampaignStory";
import SpreadTheWord from "./_components/SpreadTheWord";
import CampaignDonateShell from "./_components/CampaignDonateShell";
import Leaderboard from "./_components/Leaderboard";
import CampaignUpdater from "./_components/CampaignUpdater";
import CampaignHeaderShare from "./_components/CampaignHeaderShare";

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

    // participant_goal stores a per-participant target — scale up to get the total.
    // org_goal is already the single shared total — use it as-is.
    const isPerParticipantGoal = campaign.goal_type === "participant_goal";
    const participantScale = isPerParticipantGoal && participants.length > 0 ? participants.length : 1;
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
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-md" style={{ background: "#1565C0" }}>
                <Link href="/" className="flex items-center gap-2.5">
                    <Image
                        src="/assets/campaigns/app-logo.svg"
                        width={28}
                        height={40}
                        alt="FundByText"
                        className="app-logo w-6 h-9 brightness-0 invert"
                    />
                    <span className="font-extrabold text-lg tracking-tight text-white hidden sm:block">FundByText</span>
                </Link>

                <Link
                    href="/campaigns/create"
                    className="px-5 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                >
                    Get Started
                </Link>
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

            {/* ── Campaign title + share bar ─────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: title + badges */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span
                                    className="px-2.5 py-0.5 rounded-md text-white text-[10px] font-bold uppercase tracking-wide"
                                    style={{ background: campaign.status === "active" ? "#22c55e" : "#f97316" }}
                                >
                                    {campaign.status}
                                </span>
                                {campaign.campaign_type === "organization" && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">Organization</span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{displayTitle}</h1>
                            {campaign.campaign_type === "organization" && campaign.org_display_name && (
                                <p className="text-sm text-gray-500 mt-1">
                                    by <span className="font-semibold">{campaign.org_display_name}</span>
                                </p>
                            )}
                        </div>

                        {/* Right: share icons + organizer set-up */}
                        <div className="flex items-center gap-3 shrink-0 pt-1">
                            <CampaignHeaderShare slug={slug} />
                            {isOrganizer && (
                                <Link
                                    href={`/campaigns/${slug}/edit`}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-bold transition-opacity hover:opacity-90 shadow-sm"
                                    style={{ background: "#f97316" }}
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Set Up
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Full-width media grid ─────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 pb-0">
                <div className="max-w-6xl mx-auto">
                    <MediaGrid
                        heroUrl={heroMedia?.url ?? null}
                        galleryUrls={galleryMedia.map((m) => m.url)}
                        campaignName={displayTitle}
                    />
                </div>
            </div>

            {/* ── Two-column: story+social | donate panel ───────────────── */}
            <div className="bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-8">

                    {/* Left column */}
                    <div className="space-y-8">
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
            <footer style={{ background: "#0a1628" }} className="px-6 pt-14 pb-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-start">

                    {/* Left: Brand info + nav + payment + social */}
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-8">
                        {/* Logo + tagline */}
                        <div className="space-y-4 min-w-40">
                            <div className="flex items-center gap-2.5">
                                <Image
                                    src="/assets/campaigns/app-logo.svg"
                                    width={28}
                                    height={40}
                                    alt="FundByText"
                                    className="w-6 h-9 brightness-0 invert opacity-90"
                                />
                                <span className="text-white font-extrabold text-lg tracking-tight">FundByText</span>
                            </div>
                            <p className="text-white/40 text-xs leading-relaxed max-w-40">
                                The easiest way to raise funds via text message.
                            </p>
                            {/* Payment icons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {["VISA", "MC", "AMEX", "PP"].map((p) => (
                                    <div key={p} className="px-2 py-1 rounded bg-white/10 text-white/50 text-[9px] font-bold tracking-wide">{p}</div>
                                ))}
                            </div>
                        </div>

                        {/* Nav column 1 */}
                        <div className="space-y-3">
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Platform</p>
                            {["How It Works", "Pricing", "Features", "Success Stories"].map((l) => (
                                <Link key={l} href="#" className="block text-white/50 text-sm hover:text-white/80 transition-colors">{l}</Link>
                            ))}
                        </div>

                        {/* Nav column 2 */}
                        <div className="space-y-3">
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Company</p>
                            {["About Us", "Contact", "Privacy Policy", "Terms & Conditions"].map((l) => (
                                <Link key={l} href="#" className="block text-white/50 text-sm hover:text-white/80 transition-colors">{l}</Link>
                            ))}
                            {/* Social icons */}
                            <div className="flex gap-2 pt-2">
                                {[
                                    { label: "Facebook", color: "#1877F2", path: "M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" },
                                    { label: "Instagram", color: "#E1306C", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                                ].map((s) => (
                                    <a key={s.label} href="#" aria-label={s.label}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                                        style={{ background: s.color }}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Ready to Fundraise? CTA */}
                    <div
                        className="rounded-2xl p-8 text-center shadow-xl w-full lg:w-80"
                        style={{ background: "linear-gradient(160deg, #1e40af 0%, #1565C0 60%, #0d47a1 100%)" }}
                    >
                        <h3 className="text-white font-extrabold text-2xl leading-tight">Ready to<br />Fundraise?</h3>
                        <p className="text-white/70 text-sm mt-2 leading-relaxed">
                            Start your campaign today<br />and make a difference.
                        </p>
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/campaigns/create"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 shadow-sm"
                                style={{ background: "#f97316", color: "#fff" }}
                            >
                                Get Started for Free
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href="#"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-colors"
                            >
                                See how it works
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-white/25 text-xs">© FundByText 2026 — All Rights Reserved.</p>
                    <div className="flex gap-5 text-xs text-white/25">
                        <Link href="#" className="hover:text-white/50 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white/50 transition-colors">Terms &amp; Conditions</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
