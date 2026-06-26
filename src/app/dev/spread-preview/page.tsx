"use client";

/* ── SANDBOX ── Visual check of the Help-Spread-the-Word modal. /dev/spread-preview */

import HelpSpreadModal from "@/app/campaigns/[slug]/_components/HelpSpreadModal";

export default function SpreadPreview() {
    return (
        <div className="min-h-screen bg-[#cdd8e6]">
            <HelpSpreadModal
                isOpen
                onClose={() => {}}
                slug="boost-campaign123"
                campaignName="This is your campaign title number one"
                heroUrl="/assets/marketing/hero/photo-1.png"
                accent="#0268C0"
            />
        </div>
    );
}
