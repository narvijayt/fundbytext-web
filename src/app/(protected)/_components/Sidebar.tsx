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
            className="w-56 shrink-0 flex flex-col h-screen sticky top-0 z-10"
            style={{ background: "linear-gradient(to bottom, #0268c0 0%, #ffffff 30%, #ffffff 100%)" }}
        >
            {/* Logo */}
            <div className="px-5 pt-5 mb-5">
                <Link href="/dashboard">
                    <Image src="/logo.svg" alt="FundByText" width={140} height={42} priority className="app-logo" />
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

                {activeCampaigns.length > 0 && <div className="my-3 border-t border-gray-100" />}

                <Suspense>
                    <SidebarCampaignsDropdown campaigns={activeCampaigns} />
                </Suspense>

                {/* Admin section — only for platform admins */}
                {user.role === "admin" && (
                    <>
                        <div className="my-3 border-t border-gray-100" />
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                        >
                            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Overview
                        </Link>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                        >
                            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Users
                        </Link>
                        <Link
                            href="/admin/campaigns"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                        >
                            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            Campaigns
                        </Link>
                        <Link
                            href="/admin/donations"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                        >
                            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Donations
                        </Link>
                        <Link
                            href="/admin/organizations"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0268c0] hover:bg-[#0268c0]/8 text-sm font-medium transition-colors"
                        >
                            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Organizations
                        </Link>
                    </>
                )}
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
