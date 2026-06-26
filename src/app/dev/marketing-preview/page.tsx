"use client";

/*
 * ── SANDBOX ──────────────────────────────────────────────────────────────
 * Visual check of the marketing page's details + leaderboard with mock data,
 * since the only public live campaign has no participants/donations.
 * Visit /dev/marketing-preview. Not wired into production.
 */

import { useState } from "react";
import MarketingDetails from "@/app/campaigns/[slug]/_components/MarketingDetails";
import MarketingLeaderboard from "@/app/campaigns/[slug]/_components/MarketingLeaderboard";
import { getMarketingTheme } from "@/app/campaigns/[slug]/_components/marketingTheme";
import type { ParticipantRow, RecentDonation } from "@/app/campaigns/[slug]/page";

const theme = getMarketingTheme({ accent_color: "#0268C0", secondary_color: "#003060", tertiary_color: "#FFFFFF", background_theme: "sports" });

const NAMES = ["Jane Wells", "Ethan Thompson", "Noah Wilson", "Stephanie Smith", "Michael Doe", "Johnny Mayer", "Samuel Smith", "Andrea Joe"];
const participants: ParticipantRow[] = NAMES.map((n, i) => ({
    id: `p${i}`,
    first_name: n.split(" ")[0],
    last_name: n.split(" ")[1],
    profile_photo_url: null,
    total_raised: [6000, 5500, 5000, 4500, 4000, 3500, 3000, 2500][i],
}));

const recentDonations: RecentDonation[] = [
    { display_name: "Stephanie Smith", amount: 500, is_anonymous: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    { display_name: "Michael Moore", amount: 50, is_anonymous: false, created_at: new Date(Date.now() - 47 * 60000).toISOString() },
    { display_name: "Hannah Lee", amount: 250, is_anonymous: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { display_name: "Anonymous", amount: 75, is_anonymous: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { display_name: "Johnny Park", amount: 250, is_anonymous: false, created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export default function MarketingPreview() {
    const [participantGoal, setParticipantGoal] = useState(false);
    const [showAmounts, setShowAmounts] = useState(true);

    return (
        <div className="min-h-screen bg-[#f9f9fc] font-sans text-[#003060]">
            <div className="sticky top-0 z-50 flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Marketing preview</span>
                <label className="flex items-center gap-2"><input type="checkbox" checked={participantGoal} onChange={(e) => setParticipantGoal(e.target.checked)} /> Participant goal (Layout A)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={showAmounts} onChange={(e) => setShowAmounts(e.target.checked)} /> Show amounts</label>
            </div>

            <MarketingDetails
                theme={theme}
                totalRaised={4500} goalAmount={5000} donorCount={16} pct={90} daysLeft={3}
                recentDonations={recentDonations}
                story="<p>Help our soccer team get new uniforms and travel costs. This is for the upcoming regional tournament. Every little bit counts! Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut. More text to trigger read more so we can see the clamp behaviour clearly across a few lines.</p>"
                organizerName="Stephanie Smith" organizerPhotoUrl={null} orgBadge="ABC University"
                endDateLabel="March 5, 2025" startDateLabel="January 1, 2025"
                status="active" donationsEnabled donationsDisabledMessage={null} isFixedGoal={false}
                inlineRef={null}
            />

            <MarketingLeaderboard
                participants={participants}
                goalAmount={participantGoal ? 40000 : 100000}
                perParticipantGoal={participantGoal ? 5000 : 12500}
                theme={theme}
                highlightMemberId="p3"
                canDonate
                isParticipantGoal={participantGoal}
                showAmounts={showAmounts}
            />
        </div>
    );
}
