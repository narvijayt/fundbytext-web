"use client";

import { useState } from "react";

type Props = {
    campaignName: string;
    donorTarget:  number;        // 0 when there's no per-participant target
    launchLabel:  string | null; // formatted launch date, or null if already launched / no start date
};

/* The FundBuddy onboarding welcome shown at the top of the participant view when
   a participant first opens the campaign (before they've added any donors). Not
   sticky — a dismissible top banner that scrolls away with the page. */
export default function FundBuddyOnboarding({ campaignName, donorTarget, launchLabel }: Props) {
    const [closing, setClosing] = useState(false);
    const [gone,    setGone]    = useState(false);

    if (gone) return null;

    function dismiss() {
        setClosing(true);
        window.setTimeout(() => setGone(true), 200);
    }

    const cta =
        donorTarget > 0 && launchLabel ? `Add ${donorTarget} Donors before the campaign launches on ${launchLabel}!`
        : donorTarget > 0              ? `Add ${donorTarget} Donors to kick off your fundraising!`
        : launchLabel                  ? `Start adding donors before the campaign launches on ${launchLabel}!`
        :                                "Start adding donors and reach out to your network!";

    return (
        <div className={`flex items-center transition-opacity duration-200 motion-reduce:transition-none ${closing ? "opacity-0" : "opacity-100"}`}>
            {/* Mascot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/dashboard/fundbuddy-wave.svg" alt="" aria-hidden="true" className="relative z-10 h-24 w-auto shrink-0 sm:h-32" />

            {/* Speech bubble */}
            <div className="relative -ml-1 flex flex-1 flex-col gap-4 rounded-2xl bg-gradient-to-t from-[#0278de] to-[#005bac] px-5 py-5 shadow-[0px_12px_12px_0px_rgba(0,91,172,0.25),0px_24px_36px_0px_rgba(20,65,109,0.24)] sm:px-7 sm:py-6">
                {/* Left tail pointing at the mascot */}
                <span
                    aria-hidden
                    className="absolute top-1/2 h-0 w-0 -translate-y-1/2"
                    style={{ left: -10, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: "11px solid #0278de" }}
                />
                <div className="space-y-2 text-[14px] font-bold leading-snug text-white sm:text-[15px]">
                    <p>Welcome to FundByText!</p>
                    <p>You&apos;ve been added as a participant for {campaignName}.</p>
                    <p>{cta}</p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    className="self-end rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-[#0268c0] shadow-[0px_12px_40px_-8px_rgba(255,255,255,0.6)] transition-transform hover:scale-[1.03] active:scale-95"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}
