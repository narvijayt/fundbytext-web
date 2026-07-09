"use client";

/* ── SANDBOX ── Renders the dashboard/admin CampaignProgressBar in a few goal
 * scenarios for visual checks. Visit /dev/progress-preview. Not wired into prod. */

import CampaignProgressBar from "@/app/(protected)/dashboard/campaigns/[slug]/_components/CampaignProgressBar";

const end = new Date(Date.now() + 3 * 86_400_000);

export default function ProgressPreview() {
    return (
        <div className="min-h-screen bg-gray-50 p-10 space-y-10 max-w-3xl mx-auto">
            <div>
                <p className="mb-2 text-sm font-bold text-gray-700">Open-ended, scaled (raised 6000 · initial 5000 · goal 7200)</p>
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <CampaignProgressBar raisedAmt={6000} goalAmt={7200} initialGoalAmt={5000} donationCount={16} endDate={end} startDate={null} daysLeft={3} status="active" goalType="open_ended" />
                </div>
            </div>
            <div>
                <p className="mb-2 text-sm font-bold text-gray-700">Fixed goal (raised 3350 · goal 15000)</p>
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <CampaignProgressBar raisedAmt={3350} goalAmt={15000} initialGoalAmt={null} donationCount={4} endDate={end} startDate={null} daysLeft={3} status="active" goalType="fixed" />
                </div>
            </div>
        </div>
    );
}
