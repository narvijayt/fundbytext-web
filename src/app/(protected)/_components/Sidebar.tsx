import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { AuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import SidebarUserMenu from "./SidebarUserMenu";
import SidebarCampaignsDropdown from "./SidebarCampaignsDropdown";
import NewCampaignButton from "../dashboard/_components/NewCampaignButton";

export default async function Sidebar({ user }: { user: AuthUser }) {
    const [memberships, orgCampaign] = await Promise.all([
        prisma.campaignMember.findMany({
            where: {
                user_id: user.id,
                campaign: { status: CampaignStatus.active },
            },
            select: {
                campaign: { select: { slug: true, name: true, campaign_type: true } },
                roles:    { select: { role: true } },
            },
            orderBy: { campaign: { name: "asc" } },
        }),
        prisma.campaignMember.findFirst({
            where: {
                user_id: user.id,
                campaign: { campaign_type: "organization", org_display_name: { not: null } },
            },
            select: { campaign: { select: { org_display_name: true } } },
            orderBy: { created_at: "desc" },
        }),
    ]);

    const activeCampaigns = memberships.map((m) => ({
        ...m.campaign,
        isOrganizer:  m.roles.some((r) => r.role === "organizer"),
        isParticipant: m.roles.some((r) => r.role === "participant"),
    }));
    const orgName = orgCampaign?.campaign.org_display_name ?? null;

    // Derive the user's primary role across active campaigns (organizer > participant)
    const allRoles = memberships.flatMap((m) => m.roles.map((r) => r.role));
    const primaryRole = allRoles.includes("organizer") ? "Organizer"
        : allRoles.includes("participant")             ? "Participant"
        : null;

    return (
        <aside
            className="w-56 shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden"
            style={{ background: "linear-gradient(to bottom, #0268c0 0%, #ffffff 30%, #ffffff 100%)" }}
        >
            {/* Logo */}
            <div className="px-5 pt-5 mb-5">
                <Link href="/dashboard">
                    <Image src="/logo.svg" alt="FundByText" width={140} height={42} priority />
                </Link>
            </div>

            {/* New Campaign button */}
            <div className="px-3 mb-4">
                <NewCampaignButton />
            </div>

            {/* Navigation */}
            <nav className="flex-1 min-h-0 overflow-y-auto px-3 pt-2">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                >
                    <span className="w-4.5 h-4.5 shrink-0">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4.5 h-4.5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </span>
                    Dashboard
                </Link>

                <div className="my-3 border-t border-gray-100" />

                <Suspense>
                    <SidebarCampaignsDropdown campaigns={activeCampaigns} />
                </Suspense>
            </nav>

            {/* User menu */}
            <div className="px-3 border-t border-gray-100 pt-3 mt-2 pb-4">
                <SidebarUserMenu
                    firstName={user.first_name}
                    lastName={user.last_name}
                    photoUrl={user.profile_photo_url}
                    orgName={orgName}
                    role={primaryRole}
                />
            </div>
        </aside>
    );
}
