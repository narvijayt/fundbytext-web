import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import MediaGrid from "./_components/MediaGrid";
import ProgressPanel from "./_components/ProgressPanel";
import CampaignStory from "./_components/CampaignStory";
import SpreadTheWord from "./_components/SpreadTheWord";
import Leaderboard from "./_components/Leaderboard";

export type ParticipantRow = {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
    total_raised: number;
};

export type RecentDonation = {
    display_name: string;
    amount: number;
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
                take:    8,
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
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const [campaign, authUser] = await Promise.all([getCampaign(slug), getAuthUser()]);

    if (!campaign || campaign.status === "draft") notFound();

    // ── Derived data ─────────────────────────────────────────────────────────

    const heroMedia    = campaign.media.find((m) => m.media_type === "hero");
    const galleryMedia = campaign.media.filter((m) => m.media_type === "gallery");
    const profileMedia = campaign.media.find((m) => m.media_type === "profile");

    const goalAmount   = campaign.goal_amount ? Number(campaign.goal_amount) : null;
    const totalRaised  = Number(campaign.total_raised);
    const pct          = goalAmount && goalAmount > 0 ? Math.min(100, (totalRaised / goalAmount) * 100) : 0;

    const daysLeft = campaign.end_date
        ? Math.max(0, Math.ceil((campaign.end_date.getTime() - Date.now()) / 86_400_000))
        : null;

    // Organizer member
    const organizerMember = campaign.members.find((m) =>
        m.roles.some((r) => r.role === MemberRole.organizer)
    );

    // Participants ranked by total raised
    const participants: ParticipantRow[] = campaign.members
        .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
        .map((m) => ({
            id:               m.id,
            first_name:       m.first_name,
            last_name:        m.last_name,
            profile_photo_url: m.profile_photo_url,
            total_raised:     m.donations.reduce((s, d) => s + Number(d.amount), 0),
        }))
        .sort((a, b) => b.total_raised - a.total_raised);

    // Recent donations for donor feed
    const recentDonations: RecentDonation[] = campaign.donations.map((d) => ({
        display_name: d.is_anonymous
            ? "Anonymous"
            : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`),
        amount:       Number(d.amount),
        is_anonymous: d.is_anonymous,
    }));

    const donorCount = campaign.donations.length;

    const accent    = campaign.accent_color    ?? "#1565C0";
    const secondary = campaign.secondary_color ?? "#374151";

    const displayTitle = campaign.org_display_name ?? campaign.name ?? "Campaign";

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ── Navbar ────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-sm bg-white border-b border-gray-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight" style={{ color: accent }}>FundByText</span>
                </Link>

                <div className="flex items-center gap-3">
                    {authUser ? (
                        <Link href="/dashboard" className="px-4 py-1.5 rounded-full text-white font-semibold text-sm" style={{ background: "#f97316" }}>
                            My Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
                            <Link href="/campaigns/create" className="px-4 py-1.5 rounded-full text-white font-semibold text-sm" style={{ background: "#f97316" }}>
                                Start a Campaign
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Campaign title ────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase"
                                style={{ background: campaign.status === "active" ? "#22c55e" : "#f97316" }}>
                                {campaign.status}
                            </span>
                            {campaign.campaign_type === "organization" && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">Organization</span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{displayTitle}</h1>
                        {(campaign.organization || campaign.org_display_name) && (
                            <p className="text-sm text-gray-500 mt-1">
                                by {campaign.organization?.name ?? campaign.org_display_name}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main two-column layout ─────────────────────────────────── */}
            <div className="bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_340px] gap-8">

                    {/* Left column */}
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

                    {/* Right column */}
                    <div>
                        <ProgressPanel
                            totalRaised={totalRaised}
                            goalAmount={goalAmount}
                            pct={pct}
                            daysLeft={daysLeft}
                            donorCount={donorCount}
                            recentDonations={recentDonations}
                            accent={accent}
                            campaignSlug={slug}
                        />
                    </div>
                </div>
            </div>

            {/* ── Leaderboard (individual campaigns with participants) ─── */}
            {participants.length > 0 && (
                <Leaderboard
                    participants={participants}
                    goalAmount={goalAmount}
                    accent={accent}
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
