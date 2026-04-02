"use client";

import React from "react";
import { BACKGROUND_THEMES } from "./types";
import UploadBox from "./UploadBox";

type Props = {
    isOrg: boolean;
    profileUrl: string | null;
    setProfileUrl: (url: string | null) => void;
    heroUrl: string | null;
    setHeroUrl: (url: string | null) => void;
    galleryUrls: string[];
    setGalleryUrls: (fn: (prev: string[]) => string[]) => void;
    bgTheme: string;
    setBgTheme: (v: string) => void;
    accentColor: string;
    setAccentColor: (v: string) => void;
    secondaryColor: string;
    setSecondaryColor: (v: string) => void;
    colorMode: "logo" | "custom";
    setColorMode: (m: "logo" | "custom") => void;
    extractedColors: [string, string] | null;
    setExtractedColors: (c: [string, string] | null) => void;
    uploadingPhoto: string | null;
    uploadPhoto: (file: File, type: string) => Promise<string | null>;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    slug: string;
    campaignName: string | null;
};

async function extractColorsFromUrl(url: string): Promise<[string, string]> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 50; canvas.height = 50;
                const ctx = canvas.getContext("2d");
                if (!ctx) { resolve(["#1565C0", "#374151"]); return; }
                ctx.drawImage(img, 0, 0, 50, 50);
                const pixels = ctx.getImageData(0, 0, 50, 50).data;
                const freq = new Map<string, number>();
                for (let i = 0; i < pixels.length; i += 4) {
                    const a = pixels[i + 3];
                    if (a < 128) continue;
                    const r = Math.round(pixels[i] / 32) * 32;
                    const g = Math.round(pixels[i + 1] / 32) * 32;
                    const b = Math.round(pixels[i + 2] / 32) * 32;
                    if (r > 230 && g > 230 && b > 230) continue;
                    if (r < 25  && g < 25  && b < 25)  continue;
                    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                    freq.set(hex, (freq.get(hex) ?? 0) + 1);
                }
                const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
                resolve([sorted[0]?.[0] ?? "#1565C0", sorted[2]?.[0] ?? "#374151"]);
            } catch {
                resolve(["#1565C0", "#374151"]);
            }
        };
        img.onerror = () => resolve(["#1565C0", "#374151"]);
        img.src = url;
    });
}

const THEME_PREVIEWS: Record<string, React.ReactNode> = {
    logo: (
        <div className="w-full h-full bg-[#1a2744] flex flex-col items-center justify-center gap-1 rounded-t-lg">
            <div className="w-10 h-3 bg-orange-500 rounded-sm" />
            <div className="w-14 h-1.5 bg-white/40 rounded-sm" />
            <div className="w-8 h-1 bg-white/20 rounded-sm" />
        </div>
    ),
    athletic: (
        <div className="w-full h-full bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 60 40" className="w-full h-full opacity-40">
                {[10, 20, 30, 40, 50].map((x) => (
                    <g key={x} transform={`translate(${x},8)`}>
                        <circle cx="0" cy="0" r="3" fill="#374151" />
                        <line x1="0" y1="3" x2="0" y2="12" stroke="#374151" strokeWidth="1.5" />
                        <line x1="-4" y1="7" x2="4" y2="7" stroke="#374151" strokeWidth="1.5" />
                        <line x1="0" y1="12" x2="-3" y2="20" stroke="#374151" strokeWidth="1.5" />
                        <line x1="0" y1="12" x2="3" y2="20" stroke="#374151" strokeWidth="1.5" />
                    </g>
                ))}
            </svg>
        </div>
    ),
    sports: (
        <div className="w-full h-full bg-gray-50 rounded-t-lg overflow-hidden relative">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute rounded-full border border-gray-300 opacity-50"
                    style={{ width: 16 + (i % 3) * 8, height: 16 + (i % 3) * 8, top: `${(i * 23) % 80}%`, left: `${(i * 31) % 85}%` }} />
            ))}
        </div>
    ),
    trophy_wall: (
        <div className="w-full h-full bg-amber-50 rounded-t-lg overflow-hidden flex items-center justify-center gap-1.5">
            {[28, 36, 30].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-4 rounded-t-full bg-amber-400" style={{ height: h }} />
                    <div className="w-6 h-1 bg-amber-500 rounded-sm" />
                    <div className="w-3 h-2 bg-amber-400 rounded-sm" />
                </div>
            ))}
        </div>
    ),
    geometric: (
        <div className="w-full h-full bg-white rounded-t-lg overflow-hidden">
            <svg viewBox="0 0 60 40" className="w-full h-full opacity-30">
                {[...Array(8)].map((_, i) => (
                    <polygon key={i} points={`${(i % 4) * 16},${Math.floor(i / 4) * 20} ${(i % 4) * 16 + 10},${Math.floor(i / 4) * 20} ${(i % 4) * 16 + 5},${Math.floor(i / 4) * 20 + 12}`} fill="#6366f1" />
                ))}
            </svg>
        </div>
    ),
    abstract: (
        <div className="w-full h-full bg-white rounded-t-lg overflow-hidden">
            {[...Array(16)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-blue-400 opacity-20"
                    style={{ width: 6 + (i % 4) * 4, height: 6 + (i % 4) * 4, top: `${(i * 19) % 85}%`, left: `${(i * 27) % 85}%` }} />
            ))}
        </div>
    ),
};

export default function StepVisual({
    isOrg,
    profileUrl, setProfileUrl,
    heroUrl, setHeroUrl,
    galleryUrls, setGalleryUrls,
    bgTheme, setBgTheme,
    accentColor, setAccentColor,
    secondaryColor, setSecondaryColor,
    colorMode, setColorMode,
    extractedColors, setExtractedColors,
    uploadingPhoto, uploadPhoto,
    fieldErrors, clearFE,
    slug, campaignName,
}: Props) {
    return (
        <div className="space-y-8">

            {/* ── Section 1: Upload your photos ── */}
            <div>
                <div className="text-center mb-5">
                    <p className="text-sm font-bold text-blue-600">📷 Upload your photos</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Pick great photos to showcase your campaign.<br />
                        This will be the first thing your supporters see.
                    </p>
                </div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {isOrg ? "Organization Logo / Profile Photo" : "Profile Picture / Logo"} &nbsp;
                    <span className="normal-case font-normal text-gray-400">ⓘ</span>
                </p>
                <UploadBox
                    url={profileUrl}
                    type="profile"
                    onUploaded={(url) => {
                        setProfileUrl(url);
                        if (colorMode === "logo") {
                            extractColorsFromUrl(url).then(([c1, c2]) => {
                                setExtractedColors([c1, c2]);
                                setAccentColor(c1);
                                setSecondaryColor(c2);
                            });
                        }
                    }}
                    onRemoved={() => setProfileUrl(null)}
                    className="h-20 w-28 mb-4"
                    uploadingPhoto={uploadingPhoto}
                    uploadPhoto={uploadPhoto}
                />

                <div className="flex gap-3">
                    <div className="flex-none w-36">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Campaign Photos &nbsp;<span className="normal-case font-normal text-gray-400">ⓘ</span>
                        </p>
                        <UploadBox
                            url={heroUrl}
                            type="hero"
                            onUploaded={(url) => { setHeroUrl(url); clearFE("hero"); }}
                            onRemoved={() => setHeroUrl(null)}
                            className={`h-28${fieldErrors.hero ? " ring-2 ring-red-400 rounded-xl" : ""}`}
                            uploadingPhoto={uploadingPhoto}
                            uploadPhoto={uploadPhoto}
                        />
                        {fieldErrors.hero && <p className="text-xs text-red-500 mt-1">{fieldErrors.hero}</p>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Gallery Photos &nbsp;<span className="normal-case font-normal text-gray-400">ⓘ</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {[0, 1, 2].map((i) => (
                                <UploadBox
                                    key={i}
                                    url={galleryUrls[i] ?? null}
                                    type="gallery"
                                    onUploaded={(url) => setGalleryUrls((prev) => { const n = [...prev]; n[i] = url; return n; })}
                                    onRemoved={() => setGalleryUrls((prev) => { const n = [...prev]; n[i] = ""; return n.filter(Boolean); })}
                                    className="h-28"
                                    uploadingPhoto={uploadingPhoto}
                                    uploadPhoto={uploadPhoto}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Supports JPG and PNG format. Max size 5MB each.
                </p>
            </div>

            {/* ── Section 2: Colors ── */}
            <div>
                <div className="text-center mb-4">
                    <p className="text-sm font-bold text-blue-600">🎨 Choose your campaign&apos;s colors</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Make your campaign feel like home with your campaign&apos;s official colors.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        type="button"
                        onClick={async () => {
                            setColorMode("logo");
                            if (profileUrl) {
                                const [c1, c2] = await extractColorsFromUrl(profileUrl);
                                setExtractedColors([c1, c2]);
                                setAccentColor(c1);
                                setSecondaryColor(c2);
                            }
                        }}
                        disabled={!profileUrl}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            colorMode === "logo"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        <span>Your Logo Colors</span>
                        {colorMode === "logo" && (
                            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 5l2 2 4-4" />
                                </svg>
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setColorMode("custom")}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                            colorMode === "custom"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        <span>Custom Colors</span>
                        {colorMode === "custom" && (
                            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 5l2 2 4-4" />
                                </svg>
                            </span>
                        )}
                    </button>
                </div>

                {colorMode === "logo" && extractedColors ? (
                    <div className="flex items-center gap-3 px-3 py-3 border border-blue-100 bg-blue-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg border border-white shadow" style={{ background: extractedColors[0] }} />
                        <div className="w-10 h-10 rounded-lg border border-white shadow" style={{ background: extractedColors[1] }} />
                        <p className="text-xs text-blue-600 font-medium ml-1">Colors extracted from your logo</p>
                    </div>
                ) : (
                    <div className="border border-blue-200 rounded-xl p-3 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Custom Colors &nbsp;
                            <span className="normal-case font-normal text-gray-400">ⓘ</span>
                        </p>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                />
                                <span className="text-xs text-gray-500 font-mono">{accentColor}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                />
                                <span className="text-xs text-gray-500 font-mono">{secondaryColor}</span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => { setAccentColor("#1565C0"); setSecondaryColor("#374151"); setColorMode("custom"); setExtractedColors(null); }}
                    className="text-xs text-blue-500 hover:text-blue-700 mt-2 block ml-auto"
                >
                    Reset to default
                </button>
            </div>

            {/* ── Section 3: Background Theme ── */}
            <div>
                <div className="text-center mb-4">
                    <p className="text-sm font-bold text-blue-600">🎭 Select a background theme</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Make your page unique with one of these backgrounds.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {BACKGROUND_THEMES.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setBgTheme(t.value)}
                            className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                                bgTheme === t.value
                                    ? "border-blue-500 shadow-md"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <div className="h-20 relative">
                                {THEME_PREVIEWS[t.value]}
                            </div>
                            <div className={`py-1.5 text-xs font-semibold text-center ${bgTheme === t.value ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600"}`}>
                                {t.label}
                            </div>
                            {bgTheme === t.value && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 6l2.5 2.5 4.5-4.5" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Section 4: Preview ── */}
            <div>
                <div className="text-center mb-4">
                    <p className="text-sm font-bold text-blue-600">👁 Preview your Campaign page</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Preview your campaign page based on the selections you&apos;ve made before proceeding to the next step!
                    </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-3">
                    <div className="h-24 relative flex items-end" style={{ background: accentColor }}>
                        {heroUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        ) : (
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: `repeating-linear-gradient(45deg, ${secondaryColor} 0, ${secondaryColor} 1px, transparent 0, transparent 50%)`, backgroundSize: "8px 8px" }}
                            />
                        )}
                        <div className="relative px-3 pb-2 flex items-end gap-2">
                            {profileUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profileUrl} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow" />
                            ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-white/30" />
                            )}
                            <div>
                                <p className="text-white font-bold text-xs drop-shadow">{campaignName ?? "Your Campaign Name"}</p>
                                <p className="text-white/70 text-[10px]">Campaign page preview</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white px-3 py-2 flex gap-1.5">
                        {galleryUrls.filter(Boolean).slice(0, 3).map((u, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={u} alt="" className="w-14 h-10 rounded object-cover border border-gray-100" />
                        ))}
                        {galleryUrls.filter(Boolean).length === 0 && (
                            <p className="text-xs text-gray-400 italic">Gallery photos will appear here</p>
                        )}
                    </div>
                </div>

                <a
                    href={`/campaigns/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-blue-500 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview your Campaign page
                </a>
            </div>
        </div>
    );
}
