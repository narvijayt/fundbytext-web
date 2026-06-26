"use client";

/*
 * ── SANDBOX ──────────────────────────────────────────────────────────────
 * Visual check of the post-payment Thank-You modal (DonationSuccess).
 * Visit /dev/thankyou-preview. Not wired into production.
 */

import { useState } from "react";
import DonationSuccess from "@/app/campaigns/[slug]/_components/DonationSuccess";

export default function ThankYouPreview() {
    const [variant, setVariant] = useState<"org" | "individual">("org");

    return (
        <div className="min-h-screen bg-[#cdd8e6]">
            <div className="relative z-[60] flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Thank-you modal preview</span>
                {(["org", "individual"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-1.5"><input type="radio" name="v" checked={variant === v} onChange={() => setVariant(v)} /> {v}</label>
                ))}
            </div>
            <div className="flex items-start justify-center p-6">
                <div className="w-full max-w-[460px]">
                    <DonationSuccess
                        amount={11}
                        cardBrand="mastercard"
                        cardLast4="0123"
                        receiptUrl="https://pay.stripe.com/receipts/example"
                        participant={variant === "individual" ? { id: "t1", first_name: "Stephanie", last_name: "Smith", profile_photo_url: null } : null}
                        campaignSlug="demo"
                        campaignName="This is your campaign title number one"
                        campaignStory="<p>Help us unlock brighter futures. Every donation gives a student the tools they need to succeed this season.</p>"
                        heroUrl="/assets/marketing/hero/photo-1.png"
                        accent="#0268C0"
                        daysLeft={90}
                        onClose={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}
