"use client";

/*
 * ── SANDBOX PAGE ─────────────────────────────────────────────────────────
 * Standalone render of campaign-wizard Step 3 (Campaign Visuals) with mock
 * local state, for manual / visual design checks against Figma.
 * Visit /dev/step3-preview. Not wired into production.
 */

import { useState } from "react";
import StepVisual from "@/app/campaigns/[slug]/create/_components/StepVisual";
import { PAGE_GRADIENT, VectorWallpaper, StepBanner } from "@/app/campaigns/[slug]/create/_components/ui";

export default function Step3Preview() {
    const [campaignType, setCampaignType] = useState<"individual" | "organization">("individual");
    const isOrg = campaignType === "organization";

    const [profileUrl, setProfileUrl] = useState<string | null>(null);
    const [heroUrl, setHeroUrl] = useState<string | null>(null);
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [bgTheme, setBgTheme] = useState("sports");
    const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
    const [customColors, setCustomColors] = useState<[string, string, string]>(["#0268C0", "#003060", "#FFFFFF"]);
    const [colorMode, setColorMode] = useState<"logo" | "custom">("custom");
    const [extractedColors, setExtractedColors] = useState<[string, string, string] | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
    const appliedColors = colorMode === "logo" && extractedColors ? extractedColors : customColors;
    const setCustomColor = (i: number, hex: string) =>
        setCustomColors((prev) => { const n = [...prev] as [string, string, string]; n[i] = hex; return n; });

    // Mock upload: turn the chosen file into a data URL so previews render,
    // with a short delay so the loading spinner is visible (mirrors the real flow).
    function uploadPhoto(file: File, t: string, key?: string): Promise<string | null> {
        setUploadingPhoto(key ?? t);
        return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => setTimeout(() => { setUploadingPhoto(null); resolve(typeof r.result === "string" ? r.result : null); }, 900);
            r.onerror = () => { setUploadingPhoto(null); resolve(null); };
            r.readAsDataURL(file);
        });
    }

    return (
        <div className="wizard-shell relative isolate min-h-screen pb-28" style={{ background: PAGE_GRADIENT }}>
            <VectorWallpaper />

            <div className="relative z-40 bg-gray-900 text-white text-xs px-4 py-2 flex items-center gap-4">
                <span className="font-bold">Step 3 sandbox</span>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isOrg} onChange={(e) => setCampaignType(e.target.checked ? "organization" : "individual")} />
                    Org campaign
                </label>
            </div>

            <div className="relative px-6 pt-10 pb-8 flex justify-center">
                <StepBanner title="Campaign Visuals" subtitle="Make it shine!" />
            </div>

            <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 pt-5">
                <StepVisual
                    isOrg={isOrg}
                    profileUrl={profileUrl} setProfileUrl={setProfileUrl}
                    heroUrl={heroUrl} setHeroUrl={setHeroUrl}
                    galleryUrls={galleryUrls} setGalleryUrls={setGalleryUrls}
                    bgTheme={bgTheme} setBgTheme={setBgTheme}
                    customBgUrl={customBgUrl} setCustomBgUrl={setCustomBgUrl}
                    accentColor={appliedColors[0]} secondaryColor={appliedColors[1]}
                    customColors={customColors} setCustomColor={setCustomColor}
                    colorMode={colorMode} setColorMode={setColorMode}
                    extractedColors={extractedColors} setExtractedColors={setExtractedColors}
                    uploadingPhoto={uploadingPhoto} uploadPhoto={uploadPhoto}
                    fieldErrors={{}} clearFE={() => {}}
                    slug="demo-campaign" campaignName="New Helmets for the Bears"
                />
            </div>
        </div>
    );
}
