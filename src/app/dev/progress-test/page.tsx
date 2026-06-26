"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone copy of the campaign-creation header bar + progress bar, for
 * manual design experiments. Visit /dev/progress-test.
 *
 * Nothing here is wired into production — edit freely. Once a layout is
 * confirmed, the equivalent changes get ported back into SetupWizard.tsx /
 * WizardNav.tsx (and the two campaign/create forms that share the header).
 */

import { useState } from "react";
import Image from "next/image";
import { ProgressBarSandbox } from "./ProgressBarSandbox";

export default function ProgressTestPage() {
    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(5);
    const [isOrg, setIsOrg] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ── Controls ─────────────────────────────────────────────── */}
            <div className="bg-gray-900 text-white text-sm px-4 py-3 flex flex-wrap items-center gap-4">
                <span className="font-bold">Sandbox controls:</span>

                <label className="flex items-center gap-2">
                    Step:
                    <select
                        value={step}
                        onChange={(e) => setStep(Number(e.target.value))}
                        className="text-black rounded px-2 py-1"
                    >
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2">
                    Max Step:
                    <select
                        value={maxStep}
                        onChange={(e) => setMaxStep(Number(e.target.value))}
                        className="text-black rounded px-2 py-1"
                    >
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isOrg}
                        onChange={(e) => setIsOrg(e.target.checked)}
                    />
                    Org campaign
                </label>
            </div>

            {/* ── Header bar copy ──────────────────────────────────────── */}
            <div className="relative z-40 bg-white h-15.5 md:h-27">
                <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-10">
                    <div className="flex items-center transition-opacity hover:opacity-70 shrink-0">
                        <Image
                            src="/assets/campaigns/app-logo.svg"
                            width={34}
                            height={48}
                            alt="FundbyText"
                            className="w-5.25 h-7.5 md:w-8.5 md:h-12"
                        />
                    </div>
                    <h1
                        className="text-center font-black text-base md:text-[32px]"
                        style={{ color: "rgba(0,79,149,1)", lineHeight: "115%", letterSpacing: 0 }}
                    >
                        Create Your Campaign
                    </h1>
                    <p className="shrink-0 text-right font-sans font-black text-[10px] md:text-sm leading-none tracking-[1px] uppercase text-[rgba(87,114,141,1)]">
                        STEP <span className="text-[#26BA58]">{step}</span> / <span>5</span>
                    </p>
                </div>
            </div>

            {/* ── Progress bar copy ────────────────────────────────────── */}
            <div className="relative z-40 bg-white w-full">
                <ProgressBarSandbox step={step} maxStep={maxStep} isOrg={isOrg} onStepClick={setStep} />
            </div>

            {/* ── Rest of the page (gray, just for context) ────────────── */}
            <div className="p-10 text-center text-gray-400 text-sm">
                Sandbox area — design the header + progress bar above.
            </div>
        </div>
    );
}
