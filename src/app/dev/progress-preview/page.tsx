"use client";

/* ── SANDBOX ── Renders the dashboard/admin CampaignProgressBar across goal
 * scenarios for visual checks. Visit /dev/progress-preview. Not wired into prod. */

import CampaignProgressBar from "@/app/(protected)/dashboard/campaigns/[slug]/_components/CampaignProgressBar";

const end = new Date(Date.now() + 3 * 86_400_000);
const past = new Date(Date.now() - 3 * 86_400_000);

const CASES: { title: string; props: React.ComponentProps<typeof CampaignProgressBar> }[] = [
    { title: "Open-ended, scaled (raised 6000 · initial 5000 · goal 7200)",
      props: { raisedAmt: 6000, goalAmt: 7200, initialGoalAmt: 5000, donationCount: 16, endDate: end, startDate: null, daysLeft: 3, status: "active", goalType: "open_ended" } },
    { title: "Fixed goal (raised 3350 · goal 15000)",
      props: { raisedAmt: 3350, goalAmt: 15000, initialGoalAmt: null, donationCount: 4, endDate: end, startDate: null, daysLeft: 3, status: "active", goalType: "fixed" } },
    { title: "Nothing raised yet (raised 0 · goal 2500) — no green stub",
      props: { raisedAmt: 0, goalAmt: 2500, initialGoalAmt: null, donationCount: 0, endDate: end, startDate: null, daysLeft: 1, status: "active", goalType: "fixed" } },
    { title: "Fixed goal fully funded (raised 15000 · goal 15000)",
      props: { raisedAmt: 15000, goalAmt: 15000, initialGoalAmt: null, donationCount: 40, endDate: end, startDate: null, daysLeft: 3, status: "active", goalType: "fixed" } },
    { title: "Completed, goal not met (raised 3350 · goal 15000)",
      props: { raisedAmt: 3350, goalAmt: 15000, initialGoalAmt: null, donationCount: 4, endDate: past, startDate: null, daysLeft: 0, status: "completed", goalType: "fixed" } },
    { title: "No goal (raised 1200 · no goal)",
      props: { raisedAmt: 1200, goalAmt: null, initialGoalAmt: null, donationCount: 3, endDate: end, startDate: null, daysLeft: 3, status: "active", goalType: null } },
];

export default function ProgressPreview() {
    return (
        <div className="min-h-screen bg-gray-50 p-10 space-y-8 max-w-3xl mx-auto">
            {CASES.map((c) => (
                <div key={c.title}>
                    <p className="mb-2 text-sm font-bold text-gray-700">{c.title}</p>
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <CampaignProgressBar {...c.props} />
                    </div>
                </div>
            ))}
        </div>
    );
}
