"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { QuestionCard, InfoTooltip } from "./ui";
import UploadBox from "./UploadBox";
import { THEME_TILES } from "../../_components/marketingTheme";

/* Image that stays transparent until it is fully loaded, then fades in over its
   container's placeholder — so the user never watches it decode top-to-bottom
   (which reads as the card / cell "filling in"). Used for the theme swatches and
   the campaign-preview collage. Cached images are caught as already-complete via
   the ref check, so they show instantly. */
function FadeInImg({ src }: { src: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            ref={(el) => { if (el && el.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
            src={src}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
    );
}

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
    // Applied colours (derived from the active mode) — read-only, for the preview.
    accentColor: string;
    secondaryColor: string;
    // The custom box's 3 editable colours.
    customColors: [string, string, string];
    setCustomColor: (i: number, hex: string) => void;
    colorMode: "logo" | "custom";
    setColorMode: (m: "logo" | "custom") => void;
    // The logo box's 3 colours, extracted from the uploaded logo.
    extractedColors: [string, string, string] | null;
    setExtractedColors: (c: [string, string, string] | null) => void;
    uploadingPhoto: string | null;
    uploadPhoto: (file: File, type: string, key?: string) => Promise<string | null>;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    slug: string;
    campaignName: string | null;
};

const DEFAULT_ACCENT = "#0268C0";
const DEFAULT_SECONDARY = "#003060";
const DEFAULT_TERTIARY = "#FFFFFF";
const DEFAULT_COLORS: [string, string, string] = [DEFAULT_ACCENT, DEFAULT_SECONDARY, DEFAULT_TERTIARY];

/* Gallery is a fixed set of 4 independent slots. Normalising to a fixed-length
   array (empties as "") keeps each slot stable — uploading/removing one slot
   never shifts the others. Empty slots are dropped only when saved. */
const GALLERY_SLOTS = 4;
function toGallerySlots(prev: string[]): string[] {
    return Array.from({ length: GALLERY_SLOTS }, (_, k) => prev[k] ?? "");
}

/* ── Background themes — pattern art exported from Figma ───────────────── */
const THEMES: { value: string; label: string; img?: string }[] = [
    { value: "logo",        label: "Your Logo Here" },
    { value: "athletic",    label: "Athletic",     img: "/assets/campaigns/theme-athletic.png" },
    { value: "sports",      label: "Sports",       img: "/assets/campaigns/theme-sports.png" },
    { value: "trophy_wall", label: "Trophy Wall",  img: "/assets/campaigns/theme-trophy.png" },
    { value: "geometric",   label: "Geometric",    img: "/assets/campaigns/theme-geometric.png" },
    { value: "abstract",    label: "Abstract",     img: "/assets/campaigns/theme-abstract.png" },
];

/* ── Colour helpers (hex ⇄ rgb ⇄ hsv) ─────────────────────────────────── */
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h || "000000", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
    const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60; if (h < 0) h += 360;
    }
    return [h, max === 0 ? 0 : d / max, max];
}
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
function luminance(hex: string) {
    const [r, g, b] = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

async function extractColorsFromUrl(url: string): Promise<[string, string, string]> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const SIZE = 96;
                const canvas = document.createElement("canvas");
                canvas.width = SIZE; canvas.height = SIZE;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) { resolve(DEFAULT_COLORS); return; }
                ctx.drawImage(img, 0, 0, SIZE, SIZE);
                const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;

                // Cluster pixels into colour buckets (16 levels/channel) while keeping a
                // running average, so each candidate is the true centre of its cluster.
                type Bucket = { r: number; g: number; b: number; n: number };
                const buckets = new Map<number, Bucket>();
                for (let i = 0; i < pixels.length; i += 4) {
                    if (pixels[i + 3] < 128) continue;             // transparent
                    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
                    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
                    if (mx > 244 && mn > 232) continue;            // drop white-ish background
                    if (mx < 16) continue;                          // drop pure black
                    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
                    const bk = buckets.get(key);
                    if (bk) { bk.r += r; bk.g += g; bk.b += b; bk.n++; }
                    else buckets.set(key, { r, g, b, n: 1 });
                }
                if (buckets.size === 0) { resolve(DEFAULT_COLORS); return; }

                // Rank by how much each colour POPS, not just how much area it covers:
                // population × vibrancy, where vibrancy is driven by saturation (the
                // "highlighted" feel) and a healthy mid-brightness. This surfaces a
                // logo's bright brand colours instead of large pale / grey fills.
                const scored = [...buckets.values()].map((bk) => {
                    const r = bk.r / bk.n, g = bk.g / bk.n, b = bk.b / bk.n;
                    const [h, s, v] = rgbToHsv(r, g, b);
                    const vibrancy = (0.12 + s) ** 2 * (0.55 + 0.45 * (1 - Math.abs(v - 0.6)));
                    return { hex: rgbToHex(r, g, b), h, score: bk.n * vibrancy };
                }).sort((a, b) => b.score - a.score);

                // Take the 3 strongest that are visually distinct (different hue, or far
                // apart in RGB for near-greys) so we never return 3 shades of one colour.
                const picked: typeof scored = [];
                for (const c of scored) {
                    if (picked.length === 3) break;
                    const distinct = picked.every((p) => {
                        const dh = Math.min(Math.abs(p.h - c.h), 360 - Math.abs(p.h - c.h));
                        const [pr, pg, pb] = hexToRgb(p.hex);
                        const [cr, cg, cb] = hexToRgb(c.hex);
                        return dh > 28 || Math.hypot(pr - cr, pg - cg, pb - cb) > 64;
                    });
                    if (distinct) picked.push(c);
                }
                // Top up if the logo genuinely doesn't have 3 distinct colours.
                for (const c of scored) { if (picked.length === 3) break; if (!picked.includes(c)) picked.push(c); }

                resolve([
                    picked[0]?.hex ?? DEFAULT_ACCENT,
                    picked[1]?.hex ?? DEFAULT_SECONDARY,
                    picked[2]?.hex ?? DEFAULT_TERTIARY,
                ]);
            } catch {
                resolve(DEFAULT_COLORS);
            }
        };
        img.onerror = () => resolve(DEFAULT_COLORS);
        img.src = url;
    });
}

/* ── Section field label (e.g. "PROFILE PICTURE / LOGO") ──────────────── */
function FieldLabel({ children, info }: { children: React.ReactNode; info?: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[1px] text-[#57728d]">
                {children}
            </span>
            {info && <InfoTooltip tip={info} />}
        </div>
    );
}

/* ── Colour picker popover — saturation box + hue slider + hex input ──── */
function ColorPickerPopover({
    anchorRef, value, onChange, onClose,
}: {
    anchorRef: React.RefObject<HTMLElement | null>;
    value: string;
    onChange: (hex: string) => void;
    onClose: () => void;
}) {
    const popRef = useRef<HTMLDivElement>(null);
    const satRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLSpanElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [hsv, setHsv] = useState<[number, number, number]>(() => {
        const [r, g, b] = hexToRgb(value); return rgbToHsv(r, g, b);
    });
    const [hexText, setHexText] = useState(value.toUpperCase());

    const [r, g, b] = hsvToRgb(hsv[0], hsv[1], hsv[2]);
    const currentHex = rgbToHex(r, g, b);

    function commitHsv(next: [number, number, number]) {
        setHsv(next);
        const [rr, gg, bb] = hsvToRgb(next[0], next[1], next[2]);
        const hex = rgbToHex(rr, gg, bb);
        setHexText(hex.toUpperCase());
        onChange(hex);
    }

    // Track anchor rect to position the popover above the swatch.
    useLayoutEffect(() => {
        function update() {
            const a = anchorRef.current;
            if (a) setRect(a.getBoundingClientRect());
        }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [anchorRef]);

    // Place the popover (prefer above the swatch, flip below if no room).
    useLayoutEffect(() => {
        const el = popRef.current;
        if (!rect || !el) return;
        const margin = 12;
        const gap = 14;
        const w = el.offsetWidth, h = el.offsetHeight;
        let left = rect.left + rect.width / 2 - w / 2;
        left = clamp(left, margin, window.innerWidth - w - margin);
        let top = rect.top - gap - h;
        let below = false;
        if (top < margin) { top = rect.bottom + gap; below = true; }
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.visibility = "visible";
        // caret follows the swatch centre, flips to the side facing the swatch
        const caret = caretRef.current;
        if (caret) {
            caret.style.left = `${clamp(rect.left + rect.width / 2 - left, 18, w - 18)}px`;
            caret.style.top = below ? "-6px" : "";
            caret.style.bottom = below ? "" : "-6px";
        }
    });

    useEffect(() => {
        function onDown(e: MouseEvent) {
            const a = anchorRef.current, el = popRef.current;
            if (el && !el.contains(e.target as Node) && a && !a.contains(e.target as Node)) onClose();
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [anchorRef, onClose]);

    function satFromEvent(e: React.PointerEvent) {
        const el = satRef.current; if (!el) return;
        const r2 = el.getBoundingClientRect();
        const s = clamp((e.clientX - r2.left) / r2.width, 0, 1);
        const v = clamp(1 - (e.clientY - r2.top) / r2.height, 0, 1);
        commitHsv([hsv[0], s, v]);
    }
    function hueFromEvent(e: React.PointerEvent) {
        const el = hueRef.current; if (!el) return;
        const r2 = el.getBoundingClientRect();
        const hh = clamp((e.clientX - r2.left) / r2.width, 0, 1) * 360;
        commitHsv([hh, hsv[1], hsv[2]]);
    }

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={popRef}
            className="fixed z-[210] w-[300px] sm:w-[340px] rounded-2xl bg-white p-4"
            style={{
                top: 0, left: 0, visibility: "hidden",
                boxShadow: "0px 24px 48px -12px rgba(0,48,96,0.35), 0px 8px 16px -8px rgba(0,48,96,0.2)",
            }}
        >
            {/* Saturation / brightness area */}
            <div
                ref={satRef}
                className="relative w-full h-[160px] sm:h-[180px] rounded-xl cursor-crosshair touch-none overflow-hidden"
                style={{
                    backgroundColor: `hsl(${hsv[0]}, 100%, 50%)`,
                    backgroundImage:
                        "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
                }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); satFromEvent(e); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) satFromEvent(e); }}
                onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
            >
                <span
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, background: currentHex }}
                />
            </div>

            {/* Hue slider */}
            <div
                ref={hueRef}
                className="relative w-full h-4 mt-4 rounded-full cursor-pointer touch-none"
                style={{ backgroundImage: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); hueFromEvent(e); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) hueFromEvent(e); }}
                onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
            >
                <span
                    className="absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${(hsv[0] / 360) * 100}%`, background: `hsl(${hsv[0]}, 100%, 50%)` }}
                />
            </div>

            {/* Hex input + swatch */}
            <div className="flex items-center gap-2 mt-4 rounded-xl border-2 border-[#d4dee7] pl-3 pr-1.5 py-1.5">
                <input
                    value={hexText}
                    onChange={(e) => {
                        const t = e.target.value.toUpperCase();
                        setHexText(t);
                        if (/^#?[0-9A-F]{6}$/.test(t)) {
                            const hex = t.startsWith("#") ? t : `#${t}`;
                            const [rr, gg, bb] = hexToRgb(hex);
                            setHsv(rgbToHsv(rr, gg, bb));
                            onChange(hex);
                        }
                    }}
                    aria-label="Hex colour value"
                    className="flex-1 min-w-0 bg-transparent text-[14px] sm:text-[14px] font-medium text-[#003060] focus:outline-none uppercase"
                />
                <span className="w-8 h-8 rounded-lg border border-[#d4dee7] shrink-0" style={{ background: currentHex }} />
            </div>

            {/* Caret pointing at the swatch (flipped in the layout effect) */}
            <span
                ref={caretRef}
                aria-hidden
                className="absolute w-3 h-3 bg-white"
                style={{ left: 0, bottom: -6, transform: "translateX(-50%) rotate(45deg)" }}
            />
        </div>,
        document.body,
    );
}

/* ── A single colour swatch inside a colour-option box ────────────────── */
function Swatch({
    color, editable, showHex, swatchRef, onClick,
}: {
    color: string;
    editable?: boolean;
    showHex?: boolean;
    swatchRef?: React.Ref<HTMLDivElement>;
    onClick?: () => void;
}) {
    const dark = luminance(color) < 0.6;
    const interactive = editable && onClick;
    return (
        <div
            ref={swatchRef}
            {...(interactive
                ? {
                    role: "button" as const, tabIndex: 0,
                    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onClick(); },
                    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onClick(); } },
                }
                : {})}
            className={`relative flex-1 h-[58px] sm:h-[68px] rounded-xl border border-[#d4dee7] overflow-hidden pointer-events-auto ${interactive ? "cursor-pointer" : ""}`}
            style={{ background: color }}
        >
            {editable && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Image src="/assets/campaigns/edit-pencil.svg" width={24} height={24} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
                </span>
            )}
            {showHex && (
                <span
                    className={`absolute left-2 bottom-2 text-[11px] sm:text-[12px] font-bold uppercase ${dark ? "text-white" : "text-[#003060]"}`}
                >
                    {color.replace("#", "")}
                </span>
            )}
        </div>
    );
}

/* ── Selected check badge (top-right of a colour-option box) ───────────── */
function CheckBadge({ selected }: { selected: boolean }) {
    return selected ? (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0268c0] shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </span>
    ) : (
        <span className="w-6 h-6 rounded-full border-2 border-[#d4dee7] shrink-0" />
    );
}

/* ── Colour-option box ("Your Logo Colors" / "Custom Colors") ─────────── */
function ColorBox({
    label, info, selected, disabled = false, disabledHint, showSelectedLabel = true, onSelect, children,
}: {
    label: string;
    info?: string;
    selected: boolean;
    /* When set, the option can't be picked (e.g. logo colours before a logo
       is uploaded) — it dims, shows the hint, and the select target is inert. */
    disabled?: boolean;
    disabledHint?: string;
    showSelectedLabel?: boolean;
    onSelect: () => void;
    children: React.ReactNode;
}) {
    const isSelected = selected && !disabled;
    return (
        <div
            className={`relative flex-1 rounded-2xl ${disabled ? "opacity-55" : ""}`}
            style={{
                border: isSelected ? "2px solid transparent" : "2px solid #d4dee7",
                backgroundImage: isSelected
                    ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                    : undefined,
                backgroundOrigin: isSelected ? "border-box" : undefined,
                backgroundClip: isSelected ? "padding-box, border-box" : undefined,
                boxShadow: isSelected ? "0px 12px 28px -12px rgba(2,104,192,0.4)" : undefined,
            }}
        >
            {/* Full-box select target (behind the content). */}
            <button
                type="button"
                onClick={onSelect}
                disabled={disabled}
                aria-label={`Use ${label}`}
                className={`absolute inset-0 z-0 rounded-2xl ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            />
            <div className="relative z-10 p-5 sm:p-6 pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[15px] sm:text-[14px] font-bold text-[#003060]">{label}</span>
                            {info && <InfoTooltip tip={info} />}
                        </div>
                        {isSelected && showSelectedLabel && (
                            <span className="block mt-1 text-[10px] sm:text-[12px] font-bold uppercase tracking-[1px] text-[#0268c0]">
                                Selected
                            </span>
                        )}
                        {disabled && disabledHint && (
                            <span className="block mt-1 text-[10px] sm:text-[12px] font-medium text-[#8f98a3]">
                                {disabledHint}
                            </span>
                        )}
                    </div>
                    <CheckBadge selected={isSelected} />
                </div>
                <div className="flex gap-2.5 sm:gap-3 mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function StepVisual({
    isOrg,
    profileUrl, setProfileUrl,
    heroUrl, setHeroUrl,
    galleryUrls, setGalleryUrls,
    bgTheme, setBgTheme,
    accentColor, secondaryColor,
    customColors, setCustomColor,
    colorMode, setColorMode,
    extractedColors, setExtractedColors,
    uploadingPhoto, uploadPhoto,
    fieldErrors, clearFE,
    slug, campaignName,
}: Props) {
    // Individuals only get the custom-colour option; orgs also get logo colours.
    const mode: "logo" | "custom" = isOrg ? colorMode : "custom";
    const [picking, setPicking] = useState<null | 0 | 1 | 2>(null);
    const customRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

    // Pull the logo's colours into the (independent) logo box.
    function applyLogoColors(url: string) {
        extractColorsFromUrl(url).then((cols) => setExtractedColors(cols));
    }

    function resetColors() {
        DEFAULT_COLORS.forEach((c, i) => setCustomColor(i, c));
        setColorMode("custom");
        setExtractedColors(null);
        setPicking(null);
    }

    // Logo colours are only available while the organization logo is present.
    // If it's removed, its extracted colours are stale — drop them and fall back
    // to custom so the campaign never keeps colours from a photo that's gone.
    useEffect(() => {
        if (!isOrg || profileUrl) return;
        if (extractedColors) setExtractedColors(null);
        if (colorMode === "logo") setColorMode("custom");
    }, [isOrg, profileUrl, colorMode, extractedColors, setColorMode, setExtractedColors]);

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">

            {/* ── Card 1 — Upload photos ───────────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-upload.svg"
                title="Upload your photos"
                description={
                    isOrg
                        ? "These images will be the first thing your donors see. Choose great photos to showcase your campaign!"
                        : "Pick great photos to showcase your campaign. This will be the first thing your supporters see."
                }
                askBuddyText="Ask FundBuddy for additional context."
                askBuddySuggestionsHeading="Hey there buddy, here's how to pick winning photos!"
                askBuddySuggestions={[
                    "Use bright, high-resolution photos of real people.",
                    "Your cover photo is the first thing supporters see — make it count.",
                    "Add a few gallery shots to help tell your story.",
                ]}
            >
                <div className="space-y-6 sm:space-y-7">
                    {/* Profile / logo */}
                    <div>
                        <FieldLabel
                            info={
                                isOrg
                                    ? "Your organization's logo or profile photo. It appears next to your name across your campaign page, so use a clear, square image."
                                    : "The photo supporters will recognize you by — your profile picture or logo. It appears next to your name across your campaign page."
                            }
                        >
                            {isOrg ? "Organization Logo / Profile Photo" : "Profile Picture / Logo"}
                            <span className="text-red-400 ml-0.5">*</span>
                        </FieldLabel>
                        <UploadBox
                            url={profileUrl}
                            type="profile"
                            onUploaded={(url) => {
                                setProfileUrl(url);
                                clearFE("profile");
                                // Always refresh the logo box's colours from the new logo.
                                applyLogoColors(url);
                            }}
                            onRemoved={() => setProfileUrl(null)}
                            className={`w-[112px] h-[112px] sm:w-[117px] sm:h-[117px]${fieldErrors.profile ? " ring-2 ring-red-400 rounded-xl" : ""}`}
                            uploadingPhoto={uploadingPhoto}
                            uploadPhoto={uploadPhoto}
                        />
                        {fieldErrors.profile && <p data-field-error className="text-xs text-red-500 mt-1.5">{fieldErrors.profile}</p>}
                    </div>

                    {/* Campaign photo + gallery */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="sm:flex-[360] min-w-0">
                            <FieldLabel info="Your cover photo — the large banner at the top of your campaign page. Pick a bright, high-quality shot that captures your cause.">
                                Campaign Photos<span className="text-red-400 ml-0.5">*</span>
                            </FieldLabel>
                            <UploadBox
                                url={heroUrl}
                                type="hero"
                                onUploaded={(url) => { setHeroUrl(url); clearFE("hero"); }}
                                onRemoved={() => setHeroUrl(null)}
                                className={`h-[200px] sm:h-[250px]${fieldErrors.hero ? " ring-2 ring-red-400 rounded-xl" : ""}`}
                                uploadingPhoto={uploadingPhoto}
                                uploadPhoto={uploadPhoto}
                            />
                            {fieldErrors.hero && <p data-field-error className="text-xs text-red-500 mt-1.5">{fieldErrors.hero}</p>}
                        </div>
                        <div className="sm:flex-[308] min-w-0">
                            <FieldLabel info="Extra photos shown in a gallery on your campaign page. Add a few to help tell your story and build trust with supporters.">
                                Gallery Photos
                            </FieldLabel>
                            <div className="grid grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <UploadBox
                                        key={i}
                                        url={galleryUrls[i] || null}
                                        type="gallery"
                                        uploadKey={`gallery-${i}`}
                                        onUploaded={(url) => setGalleryUrls((prev) => { const n = toGallerySlots(prev); n[i] = url; return n; })}
                                        onRemoved={() => setGalleryUrls((prev) => { const n = toGallerySlots(prev); n[i] = ""; return n; })}
                                        className="h-[104px] sm:h-[117px]"
                                        uploadingPhoto={uploadingPhoto}
                                        uploadPhoto={uploadPhoto}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-[11px] sm:text-[12px] text-[#aeb5bd]">
                        Supports .JPG and .PNG format. Max. size 5MB each.
                    </p>
                </div>
            </QuestionCard>

            {/* ── Card 2 — Choose colours ──────────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-palette.svg"
                title={isOrg ? "Choose your colors" : "Choose your campaign's colors"}
                titleInfoTip={isOrg ? undefined : "These colors style your campaign page — buttons, highlights and accents all use them. Match your brand or pick whatever feels right."}
                description={
                    isOrg
                        ? "Choose the colors from your logo, or custom colors for your campaign homepage."
                        : "Make your campaign feel like home with your campaign's official colors."
                }
                askBuddyText="Ask FundBuddy for additional context."
                askBuddySuggestionsHeading="Hey there buddy, a quick tip on colors!"
                askBuddySuggestions={[
                    "Pull colors straight from your logo for an instant brand match.",
                    "Stick to two strong colors so your page stays clean.",
                    "High contrast keeps your call-to-action easy to spot.",
                ]}
            >
                <div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {isOrg && (
                            <ColorBox
                                label="Your Logo Colors"
                                selected={mode === "logo"}
                                disabled={!profileUrl}
                                disabledHint="Add your logo above to use its colors"
                                onSelect={() => {
                                    if (!profileUrl) return;
                                    setColorMode("logo");
                                    if (!extractedColors) applyLogoColors(profileUrl);
                                }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <Swatch key={i} color={extractedColors ? extractedColors[i] : "#ffffff"} showHex={!!extractedColors} />
                                ))}
                            </ColorBox>
                        )}

                        <ColorBox
                            label="Custom Colors"
                            info={isOrg ? undefined : "Tap a swatch to pick your own colors for your campaign page."}
                            selected={mode === "custom"}
                            showSelectedLabel={isOrg}
                            onSelect={() => setColorMode("custom")}
                        >
                            {[0, 1, 2].map((i) => (
                                <Swatch
                                    key={i}
                                    color={customColors[i]}
                                    editable={mode === "custom"}
                                    swatchRef={customRefs[i]}
                                    onClick={() => { setColorMode("custom"); setPicking(i as 0 | 1 | 2); }}
                                />
                            ))}
                        </ColorBox>
                    </div>

                    <button
                        type="button"
                        onClick={resetColors}
                        className="block ml-auto mt-3 text-[13px] sm:text-[14px] font-semibold text-[#0268c0] underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                        Reset to default
                    </button>
                </div>
            </QuestionCard>

            {picking !== null && (
                <ColorPickerPopover
                    anchorRef={customRefs[picking]}
                    value={customColors[picking]}
                    onChange={(hex) => setCustomColor(picking, hex)}
                    onClose={() => setPicking(null)}
                />
            )}

            {/* ── Card 3 — Background theme ────────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-background.svg"
                title="Select a background theme"
                description="Make your page unique with one of these backgrounds."
                askBuddyText="Ask FundBuddy for additional context."
                askBuddySuggestionsHeading="Hey there buddy, about backgrounds!"
                askBuddySuggestions={[
                    "Pick a theme that matches your cause or sport.",
                    "Choose \"Your Logo Here\" for a clean, branded look.",
                    "You can change the background anytime before launch.",
                ]}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {THEMES.map((t) => {
                        const selected = bgTheme === t.value;
                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setBgTheme(t.value)}
                                className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    border: selected ? "2px solid #0268c0" : "2px solid #d4dee7",
                                    boxShadow: selected ? "0px 12px 28px -12px rgba(2,104,192,0.45)" : undefined,
                                }}
                            >
                                {/* Pattern / branded preview — fixed height + a neutral
                                placeholder so the card never collapses or flashes empty
                                while the theme image loads. */}
                                <div className="relative h-[110px] sm:h-[130px] min-h-[110px] sm:min-h-[130px] bg-[#eaeef3]">
                                    {t.img ? (
                                        <FadeInImg src={t.img} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: "#003060" }}>
                                            <span className="px-2 text-center font-black text-white text-[12px] sm:text-[13px] leading-tight uppercase tracking-wide">
                                                {campaignName ?? "Your Name Here"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Label bar */}
                                <div className="flex items-center justify-between gap-1.5 px-3 h-[42px] sm:h-[50px] bg-white">
                                    <span className={`text-[12px] sm:text-[14px] font-medium truncate ${selected ? "text-[#0268c0]" : "text-[#57728d]"}`}>
                                        {t.label}
                                    </span>
                                    {selected ? (
                                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#0268c0] shrink-0">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border-2 border-[#d4dee7] shrink-0" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </QuestionCard>

            {/* ── Card 4 — Campaign preview ────────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-eye.svg"
                title="Preview your Campaign page"
                description="Preview your campaign page based on the selections you've made before proceeding to the next step!"
            >
                <CampaignPreview
                    slug={slug}
                    campaignName={campaignName}
                    accentColor={accentColor}
                    secondaryColor={secondaryColor}
                    bgTheme={bgTheme}
                    profileUrl={profileUrl}
                    heroUrl={heroUrl}
                    galleryUrls={galleryUrls}
                />
            </QuestionCard>
        </div>
    );
}

/* ── Campaign preview mock + overlay link ─────────────────────────────── */
function CampaignPreview({
    slug, campaignName, accentColor, secondaryColor, bgTheme, profileUrl, heroUrl, galleryUrls,
}: {
    slug: string;
    campaignName: string | null;
    accentColor: string;
    secondaryColor: string;
    bgTheme: string;
    profileUrl: string | null;
    heroUrl: string | null;
    galleryUrls: string[];
}) {
    const gallery = galleryUrls.filter(Boolean).slice(0, 4);
    return (
        <div className="relative rounded-2xl overflow-hidden border border-[#d4dee7] shadow-sm">
            {/* Header band */}
            <div className="relative px-4 py-4 sm:px-6 sm:py-5" style={{ background: accentColor }}>
                {THEME_TILES[bgTheme] && (
                    /* Tile the seamless extracted pattern at its native motif size
                       (the swatch images have a baked border and don't tile). */
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-15"
                        style={{
                            backgroundImage: `url('${THEME_TILES[bgTheme].src}')`,
                            backgroundRepeat: "repeat",
                            backgroundSize: THEME_TILES[bgTheme].size,
                        }}
                    />
                )}
                <div className="relative flex items-center gap-3">
                    {profileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileUrl} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-white/70 shadow" />
                    ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/25 border-2 border-white/40" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-[15px] sm:text-[15px] leading-tight drop-shadow truncate">
                            {campaignName ?? "Your Campaign Name Here"}
                        </p>
                        <p className="text-white/70 text-[10px] sm:text-[12px]">Campaign page preview</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                            <span key={i} className="w-5 h-5 rounded-full bg-white/25" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Photo collage */}
            <div className="bg-white p-2 sm:p-3">
                <div className="grid grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2 h-[150px] sm:h-[190px]">
                    <div className="col-span-2 row-span-2 rounded-lg overflow-hidden" style={{ background: secondaryColor }}>
                        {heroUrl && <FadeInImg src={heroUrl} />}
                    </div>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-[#eaeef3]">
                            {gallery[i] && <FadeInImg src={gallery[i]} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Centred preview link */}
            <div className="absolute inset-0 flex items-center justify-center">
                <a
                    href={`/campaigns/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] sm:text-[14px] font-bold text-[#0268c0] shadow-[0px_12px_28px_-8px_rgba(0,48,96,0.45)] transition-transform hover:scale-[1.03] active:scale-95"
                >
                    <Image src="/assets/campaigns/question-eye.svg" width={20} height={16} alt="" className="w-5 h-4" />
                    Preview your Campaign page
                </a>
            </div>
        </div>
    );
}
