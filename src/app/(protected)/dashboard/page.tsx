import Link from "next/link";
import { Suspense } from "react";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, MemberRole } from "@/generated/prisma/enums";
import LaunchSuccessToast from "./_components/LaunchSuccessToast";
import StatusTabs, { type TabKey } from "./_components/StatusTabs";
import CampaignCard, { type CampaignCardData } from "./_components/CampaignCard";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await getAuthUser();
    if (!user) return null;

    const sp = await searchParams;
    const activeTab = (typeof sp.filter === "string" ? sp.filter : "all") as TabKey;

    const memberships = await prisma.campaignMember.findMany({
        where: { user_id: user.id },
        select: {
            id:     true,
            _count: { select: { donors: true } }, // donors assigned to this member
            roles:  { select: { role: true } },
            campaign: {
                include: {
                    media:  { select: { media_type: true, url: true }, orderBy: { sort_order: "asc" } },
                    payout: { select: { city: true, state: true } },
                    _count: {
                        select: {
                            members:   { where: { roles: { some: { role: MemberRole.participant } } } },
                            donors:    true,
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
        myRoles:      m.roles.map((r) => r.role),
        myDonorCount: m._count.donors,
    }));

    const counts = {
        all:       allCampaigns.length,
        active:    allCampaigns.filter((c) => c.status === CampaignStatus.active).length,
        upcoming:  allCampaigns.filter((c) => c.status === CampaignStatus.upcoming).length,
        draft:     allCampaigns.filter((c) => c.status === CampaignStatus.draft).length,
        completed: allCampaigns.filter((c) => c.status === CampaignStatus.completed).length,
    };

    const filtered =
        activeTab === "all"
            ? allCampaigns
            : allCampaigns.filter((c) => c.status === (activeTab as CampaignStatus));

    return (
        <div>
            <Suspense fallback={null}><LaunchSuccessToast /></Suspense>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h1>
            </div>

            <StatusTabs activeTab={activeTab} counts={counts} />

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <p className="text-gray-700 font-semibold">No campaigns yet</p>
                    <p className="text-sm text-gray-400 mt-1 mb-5">
                        {activeTab === "all" ? "Create your first campaign to get started." : `You have no ${activeTab} campaigns.`}
                    </p>
                    {activeTab === "all" && (
                        <Link href="/campaigns/create" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors">
                            Create a Campaign
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
            )}
        </div>
    );
}
