import Image from "next/image";
import Link from "next/link";
import type { AuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import SidebarUserMenu from "./SidebarUserMenu";
import SidebarCampaignsDropdown from "./SidebarCampaignsDropdown";
import NewCampaignButton from "../dashboard/_components/NewCampaignButton";

export default async function Sidebar({ user }: { user: AuthUser }) {
    const memberships = await prisma.campaignMember.findMany({
        where: {
            user_id: user.id,
            campaign: { status: CampaignStatus.active },
        },
        select: {
            campaign: { select: { slug: true, name: true } },
        },
        orderBy: { campaign: { name: "asc" } },
    });

    const activeCampaigns = memberships.map((m) => m.campaign);

    return (
        <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-linear-to-b from-[#1a3a6b] to-[#0f2548] px-3 py-5">
            {/* Logo */}
            <div className="px-2 mb-6">
                <Link href="/dashboard">
                    <Image src="/logo.svg" alt="FundByText" width={140} height={42} priority />
                </Link>
            </div>

            {/* Action button */}
            <div className="mb-6">
                <NewCampaignButton />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
                >
                    <span className="w-5 h-5 shrink-0">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </span>
                    Dashboard
                </Link>

                <SidebarCampaignsDropdown campaigns={activeCampaigns} />
            </nav>

            {/* User menu */}
            <div className="border-t border-white/10 pt-3">
                <SidebarUserMenu
                    firstName={user.first_name}
                    lastName={user.last_name}
                    photoUrl={user.profile_photo_url}
                />
            </div>
        </aside>
    );
}
