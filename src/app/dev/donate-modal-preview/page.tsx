"use client";
/*
 * ── SANDBOX ──────────────────────────────────────────────────────────────
 * Visual check of the DonateModal (org + individual variants) + enter/exit
 * animation + selected-theme header pattern. Visit /dev/donate-modal-preview.
 */
import { useState } from "react";
import DonateModal, { type ModalParticipant } from "@/app/campaigns/[slug]/_components/DonateModal";

const PARTICIPANTS: ModalParticipant[] = [
    { id: "p1", first_name: "Michael", last_name: "Doe", profile_photo_url: null },
    { id: "p2", first_name: "Johnny", last_name: "Mayer", profile_photo_url: null },
    { id: "p3", first_name: "Samuel", last_name: "Smith", profile_photo_url: null },
];

const THEMES: Record<string, { img: string; size: string }> = {
    trophy_wall: { img: "/assets/campaigns/tiles/theme-trophy-tile.png", size: "12.9vw auto" },
    sports:      { img: "/assets/campaigns/tiles/theme-sports-tile.png", size: "25.2vw auto" },
    abstract:    { img: "/assets/campaigns/tiles/theme-abstract-tile.png", size: "20.2vw auto" },
};

export default function DonateModalPreview() {
    const [variant, setVariant] = useState<"org" | "individual">("org");
    const [theme, setTheme] = useState<keyof typeof THEMES>("trophy_wall");
    const [open, setOpen] = useState(true);
    const t = THEMES[theme];
    return (
        <div className="min-h-screen bg-[#cdd8e6]">
            <div className="relative z-[60] flex flex-wrap items-center gap-4 bg-gray-900 px-4 py-2 text-xs text-white">
                <span className="font-bold">Donate modal preview</span>
                <button onClick={() => setOpen((o) => !o)} className="rounded bg-white/20 px-2 py-0.5 font-semibold">{open ? "Close" : "Open"}</button>
                {(["org", "individual"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-1.5"><input type="radio" name="v" checked={variant === v} onChange={() => setVariant(v)} /> {v}</label>
                ))}
                <span className="opacity-60">theme:</span>
                {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
                    <label key={k} className="flex items-center gap-1.5"><input type="radio" name="t" checked={theme === k} onChange={() => setTheme(k)} /> {k}</label>
                ))}
            </div>
            <DonateModal
                isOpen={open}
                onClose={() => setOpen(false)}
                campaignSlug="demo"
                campaignName="This is your campaign title number one"
                campaignStory="<p>Help us unlock brighter futures. Every donation gives a student the tools they need to succeed and reach their goals this season.</p>"
                heroUrl="/assets/marketing/hero/photo-1.png"
                accent="#0268C0"
                patternImage={t.img}
                patternSize={t.size}
                patternCover={false}
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
