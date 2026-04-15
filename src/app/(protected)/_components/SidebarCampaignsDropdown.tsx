"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import CampaignNavLink from "@/app/(protected)/dashboard/_components/CampaignNavLink";

const LS_KEY = "sidebar_my_campaigns_open";

type Campaign = {
    slug:          string;
    name:          string | null;
    campaign_type: string;
    isOrganizer:   boolean;
    isParticipant: boolean;
};

const CAMPAIGN_LINKS: { label: string; hash: string; icon: React.ReactNode; organizerOnly?: boolean; participantOnly?: boolean; orgOnly?: boolean }[] = [
    {
        label: "Fundraising Goal",
        hash:  "fundraising-goal",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        label: "Participants",
        hash:  "participants",
        organizerOnly: true,
        orgOnly: true,
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        label: "Participant Notifications",
        hash:  "participant-notifications",
        participantOnly: true,
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        label: "Campaign Notifications",
        hash:  "campaign-notifications",
        organizerOnly: true,
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ),
    },
    {
        label: "Donors",
        hash:  "donors",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
    },
    {
        label: "Statistics",
        hash:  "statistics",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
];

export default function SidebarCampaignsDropdown({ campaigns }: { campaigns: Campaign[] }) {
    const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const isParticipantView = searchParams.get("view") === "participant";

    useEffect(() => {
        try {
            const saved: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
            setOpenSlugs(new Set(saved));
        } catch {
            // default: all closed
        }
    }, []);

    function toggle(slug: string) {
        setOpenSlugs((prev) => {
            const next = new Set(prev);
            next.has(slug) ? next.delete(slug) : next.add(slug);
            localStorage.setItem(LS_KEY, JSON.stringify([...next]));
            return next;
        });
    }

    const activeCampaignSlug = (() => {
        const match = pathname.match(/^\/dashboard\/campaigns\/([^/]+)/);
        return match ? match[1] : null;
    })();

    if (campaigns.length === 0) return null;

    return (
        <div className="space-y-0.5">
            {campaigns.map((c) => {
                const isActive = activeCampaignSlug === c.slug;

                // A pure participant always sees participant view.
                // A dual-role user sees participant view only when actively on that campaign with ?view=participant.
                // An organizer-only user always sees organizer view.
                const viewingAsParticipant =
                    !c.isOrganizer ||
                    (c.isParticipant && isActive && isParticipantView);

                return (
                    <div key={c.slug}>
                        {/* Campaign header row */}
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#0268c0]/10 transition-colors">
                            <span className="text-[#0268c0] shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 3a1 1 0 00-1 1v16a1 1 0 002 0v-6h12l-2-4 2-4H7V4a1 1 0 00-1-1z" />
                                </svg>
                            </span>
                            <CampaignNavLink
                                href={`/dashboard/campaigns/${c.slug}`}
                                overlayText="Loading…"
                                className="flex-1 text-left text-xs font-semibold text-[#0268c0] truncate min-w-0"
                            >
                                {c.name ?? "Untitled"}
                            </CampaignNavLink>
                            <button
                                onClick={() => toggle(c.slug)}
                                className="shrink-0 text-[#0268c0]/60 hover:text-[#0268c0] transition-colors"
                                aria-label="Toggle campaign links"
                            >
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform ${openSlugs.has(c.slug) ? "rotate-180" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Sub-links */}
                        {openSlugs.has(c.slug) && (
                            <div className="ml-2 space-y-0.5 mb-2">
                                {CAMPAIGN_LINKS.filter((link) => {
                                    if (link.organizerOnly  && viewingAsParticipant)               return false;
                                    if (link.participantOnly && !viewingAsParticipant)              return false;
                                    if (link.orgOnly        && c.campaign_type !== "organization") return false;
                                    return true;
                                }).map((link) => (
                                    <a
                                        key={link.hash}
                                        href={isActive ? `#${link.hash}` : `/dashboard/campaigns/${c.slug}#${link.hash}`}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#0268c0]/80 hover:text-[#0268c0] hover:bg-[#0268c0]/10 text-xs font-medium transition-colors"
                                    >
                                        <span className="shrink-0">{link.icon}</span>
                                        <span className="truncate">{link.label}</span>
                                    </a>
                                ))}

                                {/* Edit Campaign — organizers only */}
                                {c.isOrganizer && (
                                    <div className="pt-2 px-1">
                                        <CampaignNavLink
                                            href={`/campaigns/${c.slug}/edit`}
                                            overlayText="Loading…"
                                            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-semibold transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Campaign
                                        </CampaignNavLink>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
