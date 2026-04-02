"use client";

import { useState, useEffect } from "react";
import CampaignNavLink from "@/app/(protected)/dashboard/_components/CampaignNavLink";

const LS_KEY = "sidebar_my_campaigns_open";

type Campaign = {
    slug: string;
    name: string | null;
};

export default function SidebarCampaignsDropdown({ campaigns }: { campaigns: Campaign[] }) {
    const [open, setOpen] = useState(false);

    // Restore persisted state on mount
    useEffect(() => {
        setOpen(localStorage.getItem(LS_KEY) === "true");
    }, []);

    function toggle() {
        setOpen((prev) => {
            const next = !prev;
            localStorage.setItem(LS_KEY, String(next));
            return next;
        });
    }

    return (
        <div>
            <button
                onClick={toggle}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
                <span className="w-5 h-5 shrink-0">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </span>
                <span className="flex-1 text-left">My Campaigns</span>
                <svg
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="mt-1 ml-8 space-y-0.5">
                    {campaigns.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-white/40 italic">No active campaigns</p>
                    ) : (
                        campaigns.map((c) => (
                            <CampaignNavLink
                                key={c.slug}
                                href={`/dashboard/campaigns/${c.slug}`}
                                overlayText="Loading…"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                                <span className="truncate">{c.name ?? "Untitled campaign"}</span>
                            </CampaignNavLink>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
