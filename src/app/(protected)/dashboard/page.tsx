import Link from "next/link";
import { Suspense } from "react";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, MemberRole } from "@/generated/prisma/enums";
import LaunchSuccessToast from "./_components/LaunchSuccessToast";
import StatusTabs, { type TabKey } from "./_components/StatusTabs";
import SearchFilterBar from "./_components/SearchFilterBar";
import CampaignCard, { type CampaignCardData } from "./_components/CampaignCard";
import Pagination from "./_components/Pagination";
import OverallStatistics, { type Stat } from "./_components/OverallStatistics";

const PAGE_SIZE = 6;

function usd(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await getAuthUser();
    if (!user) return null;

    const sp = await searchParams;
    const activeTab = (typeof sp.filter === "string" ? sp.filter : "all") as TabKey;
    const query = typeof sp.q === "string" ? sp.q : "";
    const sort = typeof sp.sort === "string" ? sp.sort : "newest";
    const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

    const memberships = await prisma.campaignMember.findMany({
        where: { user_id: user.id },
        select: {
            id: true,
            _count: { select: { donors: true } },
            roles: { select: { role: true } },
            campaign: {
                include: {
                    media: { select: { media_type: true, url: true }, orderBy: { sort_order: "asc" } },
                    payout: { select: { city: true, state: true } },
                    _count: {
                        select: {
                            members: { where: { roles: { some: { role: MemberRole.participant } } } },
                            donors: true,
                            donations: true,
                        },
                    },
                },
            },
        },
        orderBy: { campaign: { created_at: "desc" } },
    });

    const allCampaigns: CampaignCardData[] = memberships.map((m) => ({
        ...m.campaign,
        myRoles: m.roles.map((r) => r.role),
        myDonorCount: m._count.donors,
    }));

    // ── Overall statistics (across all of the user's campaigns) ──────────────
    const raisedOf = (c: CampaignCardData) => parseFloat(c.total_raised.toString());
    const totalRaised = allCampaigns.reduce((s, c) => s + raisedOf(c), 0);
    const totalDonors = allCampaigns.reduce((s, c) => s + c._count.donors, 0);
    const completedRaised = allCampaigns.filter((c) => c.status === CampaignStatus.completed).reduce((s, c) => s + raisedOf(c), 0);
    const topRaised = allCampaigns.reduce((mx, c) => Math.max(mx, raisedOf(c)), 0);
    const participantsRecruited = allCampaigns.reduce((s, c) => s + c._count.members, 0);
    const avgPerDonor = totalDonors > 0 ? totalRaised / totalDonors : 0;
    const stats: Stat[] = [
        { label: "Completed Campaign", value: usd(completedRaised) },
        { label: "Top Fundraiser Raised", value: usd(topRaised) },
        { label: "Participants Recruited", value: participantsRecruited.toLocaleString() },
        { label: "Avg Donation Per Donor", value: usd(avgPerDonor) },
    ];

    // ── Filter → search → sort → paginate ────────────────────────────────────
    let list = activeTab === "all" ? allCampaigns : allCampaigns.filter((c) => c.status === (activeTab as CampaignStatus));
    if (query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter((c) => (c.name ?? "").toLowerCase().includes(q));
    }
    if (sort === "oldest") list = [...list].sort((a, b) => +a.created_at - +b.created_at);
    else if (sort === "raised") list = [...list].sort((a, b) => raisedOf(b) - raisedOf(a));

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const pageItems = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const linkParams = [
        activeTab !== "all" ? `filter=${activeTab}` : "",
        query ? `q=${encodeURIComponent(query)}` : "",
        sort !== "newest" ? `sort=${sort}` : "",
    ].filter(Boolean).join("&");

    return (
        <div className="mx-auto max-w-[1600px]">
            <Suspense fallback={null}><LaunchSuccessToast /></Suspense>

            <h1 className="mb-6 text-[24px] font-black leading-[1.15] tracking-[-0.4px] text-[#003060]">Campaign Dashboard</h1>

            <div className="mb-6">
                <StatusTabs activeTab={activeTab} query={query} />
            </div>
            <div className="mb-6">
                <Suspense fallback={null}><SearchFilterBar /></Suspense>
            </div>

            {pageItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e7e9eb] bg-white py-20 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2f6]">
                        <svg className="h-7 w-7 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <p className="font-semibold text-[#003060]">{query ? "No campaigns match your search" : "No campaigns yet"}</p>
                    <p className="mb-5 mt-1 text-sm text-[#9aa7b8]">
                        {query ? "Try a different search." : activeTab === "all" ? "Create your first campaign to get started." : `You have no ${activeTab} campaigns.`}
                    </p>
                    {activeTab === "all" && !query && (
                        <Link href="/campaigns/create" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#ff8c53] to-[#f47435] px-6 py-3 text-sm font-bold text-white shadow-[0px_10px_24px_-8px_rgba(244,116,53,0.6)] transition-all hover:brightness-[1.03] hover:shadow-[0px_14px_28px_-8px_rgba(244,116,53,0.7)] active:scale-[0.98]">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            Create a Campaign
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {pageItems.map((c) => <CampaignCard key={c.id} campaign={c} />)}
                    </div>
                    <div className="mt-8">
                        <Pagination page={current} totalPages={totalPages} params={linkParams} />
                    </div>
                </>
            )}

            <div className="mt-12">
                <OverallStatistics stats={stats} />
            </div>
        </div>
    );
}
