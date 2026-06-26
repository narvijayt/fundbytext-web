"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone render of the campaign-wizard steps (1 = Campaign Details,
 * 2 = Funding Goal) with mock local state, for manual / visual design checks
 * against Figma. Visit /dev/step1-preview. Not wired into production.
 */

import { useState } from "react";
import StepDetails from "@/app/campaigns/[slug]/create/_components/StepDetails";
import StepFundingGoal from "@/app/campaigns/[slug]/create/_components/StepFundingGoal";
import { type Payout } from "@/app/campaigns/[slug]/create/_components/types";
import { PAGE_GRADIENT, VectorWallpaper } from "@/app/campaigns/[slug]/create/_components/ui";

export default function StepPreview() {
    const [step, setStep] = useState<1 | 2>(2);
    const [campaignType, setCampaignType] = useState<"individual" | "organization">("individual");
    const isOrg = campaignType === "organization";

    // Step 1 state
    const [name, setName] = useState("New Helmets for the Bears Football Team");
    const [orgDisplayName, setOrgDisplayName] = useState("Riverside Youth Soccer Club");
    const [story, setStory] = useState("");
    const [timezone, setTimezone] = useState("America/New_York");
    const [startDate, setStartDate] = useState("2025-03-05T07:00");
    const [endDate, setEndDate] = useState("2025-05-30T18:00");

    // Step 2 state
    const [goalType, setGoalType] = useState("fixed");
    const [goalAmount, setGoalAmount] = useState("5000");
    const [donorsPerParticipant, setDonorsPerParticipant] = useState("20");
    const [payout, setPayout] = useState<Payout>({
        recipient_first_name: "", recipient_last_name: "", org_name: "",
        street_address: "", apt_suite: "", city: "", state: "", zip: "",
    });

    return (
        <div className="wizard-shell relative isolate min-h-screen pb-28" style={{ background: PAGE_GRADIENT }}>
            <VectorWallpaper />

            <div className="relative z-40 bg-gray-900 text-white text-xs px-4 py-2 flex items-center gap-4">
                <span className="font-bold">Step sandbox</span>
                <label className="flex items-center gap-2">
                    Step:
                    <select value={step} onChange={(e) => setStep(Number(e.target.value) as 1 | 2)} className="text-black rounded px-1">
                        <option value={1}>1 — Details</option>
                        <option value={2}>2 — Funding Goal</option>
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isOrg} onChange={(e) => setCampaignType(e.target.checked ? "organization" : "individual")} />
                    Org campaign
                </label>
            </div>

            <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 pt-8">
                {step === 1 ? (
                    <StepDetails
                        campaignType={campaignType} setCampaignType={setCampaignType}
                        campaignTypeReadOnly={false}
                        isOrg={isOrg}
                        name={name} setName={setName} nameReadOnly={false}
                        orgDisplayName={orgDisplayName} setOrgDisplayName={setOrgDisplayName}
                        orgDisplayNameLocked={false}
                        story={story} setStory={setStory}
                        timezone={timezone} setTimezone={setTimezone}
                        startDate={startDate} setStartDate={setStartDate}
                        endDate={endDate} setEndDate={setEndDate}
                        fieldErrors={{}} clearFE={() => {}}
                        isLaunched={false} isUpcoming={false} isActive={false} isCompleted={false}
                    />
                ) : (
                    <StepFundingGoal
                        isOrg={isOrg}
                        goalType={goalType} setGoalType={setGoalType}
                        goalAmount={goalAmount} setGoalAmount={setGoalAmount}
                        donorsPerParticipant={donorsPerParticipant} setDonorsPerParticipant={setDonorsPerParticipant}
                        payout={payout} setPayout={setPayout}
                        orgDisplayName={orgDisplayName}
                        fieldErrors={{}} clearFE={() => {}}
                        isLaunched={false}
                    />
                )}
            </div>
        </div>
    );
}
