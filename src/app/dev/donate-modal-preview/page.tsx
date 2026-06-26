"use client";

/*
 * ── SANDBOX ──────────────────────────────────────────────────────────────
 * Visual check of the redesigned DonateModal (org + individual variants).
 * Visit /dev/donate-modal-preview. Not wired into production.
 * NOTE: Stripe card fields render real Stripe iframes (needs the publishable key).
 */

import { useState } from "react";
import DonateModal, { type ModalParticipant } from "@/app/campaigns/[slug]/_components/DonateModal";

const PARTICIPANTS: ModalParticipant[] = [
    { id: "p1", first_name: "Michael", last_name: "Doe", profile_photo_url: null },
    { id: "p2", first_name: "Johnny", last_name: "Mayer", profile_photo_url: null },
    { id: "p3", first_name: "Samuel", last_name: "Smith", profile_photo_url: null },
];

export default function DonateModalPreview() {
    const [variant, setVariant] = useState<"org" | "individual">("org");

    return (
        <div className="min-h-screen bg-[#cdd8e6]">
            <div className="relative z-[60] flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Donate modal preview</span>
                {(["org", "individual"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-1.5"><input type="radio" name="v" checked={variant === v} onChange={() => setVariant(v)} /> {v}</label>
                ))}
            </div>
            <DonateModal
                isOpen
                onClose={() => {}}
                campaignSlug="demo"
                campaignName="This is your campaign title number one"
                campaignStory="<p>Help us unlock brighter futures. Every donation gives a student the tools they need to succeed and reach their goals this season.</p>"
                heroUrl="/assets/marketing/hero/photo-1.png"
                accent="#0268C0"
                participants={variant === "org" ? PARTICIPANTS : [{ id: "t1", first_name: "Stephanie", last_name: "Smith", profile_photo_url: null }]}
                targetMemberId={variant === "individual" ? "t1" : null}
                donationsEnabled
                donationsDisabledMessage={null}
                maxDonationCents={null}
                daysLeft={60}
                donorPrefill={null}
            />
        </div>
    );
}
