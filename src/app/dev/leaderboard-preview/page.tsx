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
    // >10 so the "Load more" / "Show more" paging is exercised in the sandbox.
    P("9", "Priya", "Nair", 2400),
    P("10", "Marcus", "Bell", 2300),
    P("11", "Elena", "Ortiz", 2200),
    P("12", "Tom", "Baker", 2100),
    P("13", "Aisha", "Khan", 2000),
    P("14", "Leo", "Fischer", 1900),
    P("15", "Nina", "Patel", 1800),
    P("16", "Owen", "Clark", 1700),
    P("17", "Zara", "Hughes", 1600),
    P("18", "Kai", "Nakamura", 1500),
];

const CASES: { title: string; props: Partial<React.ComponentProps<typeof MarketingLeaderboard>> }[] = [
    { title: "Org goal — PUBLIC view (percent labels, no highlight)",
      props: { showAmounts: false, highlightMemberId: null } },
    { title: "Org goal — ORGANIZER view ($ amounts + % of goal)",
      props: { showAmounts: true, isOrganizer: true, highlightMemberId: null } },
    { title: "Org goal — PARTICIPANT view, viewer is #1 (navy podium card)",
      props: { showAmounts: true, highlightMemberId: "1" } },
    { title: "Org goal — PARTICIPANT view, viewer in table (blue row)",
      props: { showAmounts: true, highlightMemberId: "4" } },
    { title: "Participant goal — ORGANIZER view (pills + % of goal)",
      props: { showAmounts: true, isOrganizer: true, highlightMemberId: "5", isParticipantGoal: true } },
    { title: "Participant goal — PUBLIC view (no pills)",
      props: { showAmounts: false, highlightMemberId: null, isParticipantGoal: true } },
    { title: "THEMED (red accent) — banner/halo/highlights must recolor",
      props: { showAmounts: true, highlightMemberId: "1",
               theme: { ...theme, accent: "#b02a2a", secondary: "#4a0d0d", themeImage: "/assets/campaigns/tiles/theme-trophy-tile.png", themeSize: "12.9vw auto" } } },
    { title: "SINGLE participant — full-width podium card",
      props: { showAmounts: true, highlightMemberId: null, participants: [P("1", "Participant", "One", 500)] } },
    { title: "Org goal $10k — ORGANIZER (reported bug: % must be share of the $10k, no per-participant goal)",
      props: { showAmounts: true, isOrganizer: true, highlightMemberId: "1", goalAmount: 10000, perParticipantGoal: null,
               participants: [P("1", "Abhay", "Kumar", 3000), P("2", "Participant", "One", 500), P("3", "Participant", "Three", 0), P("4", "Participant", "Four", 0), P("5", "Participant", "Five", 0)] } },
    { title: "Org goal $10k — PUBLIC (percent = share of the shared goal)",
      props: { showAmounts: false, highlightMemberId: null, goalAmount: 10000, perParticipantGoal: null,
               participants: [P("1", "Abhay", "Kumar", 3000), P("2", "Participant", "One", 500), P("3", "Participant", "Three", 0), P("4", "Participant", "Four", 0), P("5", "Participant", "Five", 0)] } },
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
