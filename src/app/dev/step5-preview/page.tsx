"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone render of campaign-wizard Step 5 (Thank You Note) with mock
 * local state, for manual / visual design checks against Figma.
 * Three variants: Individual, Organization (org goal), Participant (participant goal).
 * Visit /dev/step5-preview. Not wired into production.
 */

import { useState } from "react";
import StepThankYou from "@/app/campaigns/[slug]/create/_components/StepThankYou";
import { type Member } from "@/app/campaigns/[slug]/create/_components/types";
import { PAGE_GRADIENT, VectorWallpaper, StepBanner } from "@/app/campaigns/[slug]/create/_components/ui";
import { BottomNav } from "@/app/campaigns/[slug]/create/_components/WizardNav";

const MEMBERS: Member[] = [
    { id: "o1", first_name: "Alex", last_name: "Organizer", email: "alex@example.com", phone: "", profile_photo_url: null, roles: [{ role: "organizer" }] },
    { id: "p1", first_name: "Jordan", last_name: "Runner", email: "jordan@example.com", phone: "", profile_photo_url: null, roles: [{ role: "participant" }] },
];

type Variant = "individual" | "org_goal" | "participant_goal";

export default function Step5Preview() {
    const [variant, setVariant] = useState<Variant>("individual");
    const [thankYou, setThankYou] = useState("");

    const isOrg = variant !== "individual";
    const goalType = variant === "individual" ? "fixed" : variant;

    return (
        <div className="wizard-shell relative isolate min-h-screen pb-28" style={{ background: PAGE_GRADIENT }}>
            <VectorWallpaper />

            <div className="relative z-40 flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Step 5 sandbox</span>
                {(["individual", "org_goal", "participant_goal"] as Variant[]).map((v) => (
                    <label key={v} className="flex items-center gap-1.5">
                        <input type="radio" name="variant" checked={variant === v} onChange={() => setVariant(v)} />
                        {v}
                    </label>
                ))}
            </div>

            <div className="relative flex justify-center px-6 pt-10 pb-8">
                <StepBanner title="Thank You Note" subtitle="Write a heartfelt message for your donors" />
            </div>

            <div className="mx-auto w-full max-w-2xl px-4 pt-5 lg:max-w-3xl xl:max-w-4xl">
                <StepThankYou
                    thankYou={thankYou} setThankYou={setThankYou}
                    fieldErrors={{}} clearFE={() => {}}
                    isOrg={isOrg} goalType={goalType} orgDisplayName="Acme Track Club"
                    members={MEMBERS}
                />
            </div>

            <BottomNav
                step={5} saving={false} launching={false} uploadingPhoto={null} isLaunched={false}
                onBack={() => {}} onNext={() => {}} onLaunch={() => {}} onExit={() => {}}
            />
        </div>
    );
}
