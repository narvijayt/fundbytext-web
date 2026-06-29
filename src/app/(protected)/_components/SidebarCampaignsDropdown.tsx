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

// Exact Figma (vuesax) icons pulled from the sidebar-detail design (node 5455:9962).
function LinkIcon({ src }: { src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-[18px] w-[18px] shrink-0" />;
}

const CAMPAIGN_LINKS: { label: string; hash: string; icon: React.ReactNode; organizerOnly?: boolean; participantOnly?: boolean; orgOnly?: boolean }[] = [
    { label: "Fundraising Goal",         hash: "fundraising-goal",          icon: <LinkIcon src="/assets/dashboard/sidebar-goal.svg" /> },
    { label: "Participants",             hash: "participants",              organizerOnly: true, orgOnly: true, icon: <LinkIcon src="/assets/dashboard/sidebar-people.svg" /> },
    { label: "Participant Notifications", hash: "participant-notifications", participantOnly: true, icon: <LinkIcon src="/assets/dashboard/sidebar-notif-status.svg" /> },
    { label: "Campaign Notifications",   hash: "campaign-notifications",    organizerOnly: true, icon: <LinkIcon src="/assets/dashboard/sidebar-notif.svg" /> },
    { label: "Donors",                   hash: "donors",                    icon: <LinkIcon src="/assets/dashboard/sidebar-people.svg" /> },
    { label: "Statistics",               hash: "statistics",                icon: <LinkIcon src="/assets/dashboard/sidebar-graph.svg" /> },
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
                        {/* Whole row toggles the dropdown (not just the chevron) */}
                        <button
                            type="button"
                            onClick={() => toggle(c.slug)}
                            aria-expanded={openSlugs.has(c.slug)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#0268c0]/8"
                        >
                            <span className="shrink-0 text-[#003060]">
                                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4.2916 1.66602V18.3327" />
                                    <path d="M4.2916 3.33398H13.6249C15.8749 3.33398 16.3749 4.58398 14.7916 6.16732L13.7916 7.16732C13.1249 7.83398 13.1249 8.91732 13.7916 9.50065L14.7916 10.5007C16.3749 12.084 15.7916 13.334 13.6249 13.334H4.2916" />
                                </svg>
                            </span>
                            <span className="flex-1 min-w-0 text-[15px] font-medium leading-tight text-[#003060] line-clamp-2">
                                {c.name ?? "Untitled"}
                            </span>
                            <span className={`shrink-0 text-[#003060]/50 transition-transform ${openSlugs.has(c.slug) ? "rotate-180" : ""}`}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </button>

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
                                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] font-medium text-[#0268c0] transition-colors hover:bg-[#0268c0]/8"
                                    >
                                        <span className="shrink-0">{link.icon}</span>
                                        <span className="truncate">{link.label}</span>
                                    </a>
                                ))}

                                {/* Edit Campaign — organizers only (gradient pill matching New Campaign) */}
                                {c.isOrganizer && (
                                    <div className="px-1 pt-2.5">
                                        <CampaignNavLink
                                            href={`/campaigns/${c.slug}/edit`}
                                            overlayText="Loading…"
                                            className="flex items-center overflow-hidden rounded-[14px] bg-gradient-to-b from-[#ff8c53] to-[#f47435] pr-0.5 text-white"
                                        >
                                            <span className="flex-1 py-2.5 text-center text-[14px] font-medium leading-[1.4]">Edit Campaign</span>
                                            <span className="flex h-11 w-11 items-center justify-center border-l border-white/[0.12]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src="/assets/dashboard/sidebar-edit.svg" alt="" className="h-[18px] w-[18px]" />
                                            </span>
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
