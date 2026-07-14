"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone render of the public-page MarketingLeaderboard in every view
 * variant from the Figma (organizer/public/participant × org-goal/participant-
 * goal), with mock participants. Visit /dev/leaderboard-preview.
 */

import MarketingLeaderboard from "@/app/campaigns/[slug]/_components/MarketingLeaderboard";
import type { ParticipantRow } from "@/app/campaigns/[slug]/page";
import type { MarketingTheme } from "@/app/campaigns/[slug]/_components/marketingTheme";

const theme: MarketingTheme = {
    accent: "#0268c0",
    secondary: "#003060",
    tertiary: "#ffffff",
    themeImage: "/assets/campaigns/tiles/theme-sports-tile.png",
    themeSize: "25.2vw auto",
    themeCover: false,
};

const P = (id: string, first: string, last: string, raised: number): ParticipantRow => ({
    id, first_name: first, last_name: last, profile_photo_url: null, total_raised: raised,
});

const participants: ParticipantRow[] = [
    P("1", "Stephanie", "Smith", 6000),
    P("2", "Ethan", "Thompson", 5500),
    P("3", "Noah", "Wilson", 5000),
    P("4", "Jane", "Wells", 4500),
    P("5", "Michael", "Doe", 4000),
    P("6", "Johnny", "Mayer", 3500),
    P("7", "Samuel", "Smith", 3000),
    P("8", "Andrea", "Joe", 2500),
];

const CASES: { title: string; props: Partial<React.ComponentProps<typeof MarketingLeaderboard>> }[] = [
    { title: "Org goal — PUBLIC view (percent labels, no highlight)",
      props: { showAmounts: false, highlightMemberId: null } },
    { title: "Org goal — ORGANIZER view ($ amounts, no highlight)",
      props: { showAmounts: true, highlightMemberId: null } },
    { title: "Org goal — PARTICIPANT view, viewer is #1 (navy podium card)",
      props: { showAmounts: true, highlightMemberId: "1" } },
    { title: "Org goal — PARTICIPANT view, viewer in table (blue row)",
      props: { showAmounts: true, highlightMemberId: "4" } },
    { title: "Participant goal — MEMBER view (pills)",
      props: { showAmounts: true, highlightMemberId: "5", isParticipantGoal: true } },
    { title: "Participant goal — PUBLIC view (no pills)",
      props: { showAmounts: false, highlightMemberId: null, isParticipantGoal: true } },
];

export default function LeaderboardPreview() {
    return (
        <div className="min-h-screen bg-gray-100">
            {CASES.map((c) => (
                <div key={c.title}>
                    <p className="bg-gray-900 px-6 py-3 text-sm font-bold text-white">{c.title}</p>
                    <MarketingLeaderboard
                        participants={participants}
                        goalAmount={100000}
                        perParticipantGoal={10000}
                        theme={theme}
                        highlightMemberId={null}
                        canDonate
                        isParticipantGoal={false}
                        showAmounts
                        {...c.props}
                    />
                </div>
            ))}
        </div>
    );
}
