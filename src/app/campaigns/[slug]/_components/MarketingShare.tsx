"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SHARE_EVENT } from "./HelpSpreadModal";

const A = "/assets/marketing";

/* ── Round share-button row — matches the static design's ShareButtons, but
   every button is wired: copy link, Facebook, Messenger, WhatsApp, and a
   native-share "More". `variant` keeps the two looks from the design:
   "dark" (translucent black, on the hero band) and "orange" (solid). */
export default function MarketingShare({ slug, variant }: { slug: string; variant: "dark" | "orange" }) {
    const [url, setUrl] = useState(`/campaigns/${slug}`);
    const [copied, setCopied] = useState(false);
    useEffect(() => { setUrl(`${window.location.origin}/campaigns/${slug}`); }, [slug]);

    const circle =
        variant === "dark"
            ? "backdrop-blur-[10px] bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.45)]"
            : "bg-[#f47435] hover:opacity-90";
    const gap = variant === "dark" ? "gap-[4px]" : "gap-[6px]";
    const messengerSrc = variant === "dark" ? `${A}/icons/messenger.svg` : `${A}/icons/messenger-orange.svg`;

    const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch { /* ignore */ }
    };
    // "More" opens the full Help-Spread-the-Word modal (all networks + copy + download).
    const more = () => window.dispatchEvent(new CustomEvent(SHARE_EVENT));
    const messenger = () => {
        // Messenger deep link (mobile app) — falls back to the FB share dialog on desktop.
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        open(isMobile ? `fb-messenger://share?link=${encodeURIComponent(url)}` : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    };

    const btnCls = `${circle} relative overflow-hidden rounded-full size-[40px] shrink-0 transition-colors`;

    return (
        <div className={`flex ${gap} items-start`}>
            {/* Copy Link */}
            <button type="button" onClick={copy} aria-label={copied ? "Link copied" : "Copy link"} className={btnCls}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[16px]">
                    {copied ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-full"><path d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <Image src={`${A}/icons/link.svg`} alt="" width={18} height={18} className="block max-w-none size-full" />
                    )}
                </span>
            </button>
            {/* Facebook */}
            <button type="button" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)} aria-label="Share on Facebook" className={btnCls}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[28px]">
                    <span className="absolute left-[36.47%] right-[36.46%] top-1/4 bottom-1/4">
                        <Image src={`${A}/icons/facebook.svg`} alt="" width={8} height={14} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                </span>
            </button>
            {/* Messenger (icon ships with its own circle) */}
            <button type="button" onClick={messenger} aria-label="Share on Messenger" className="relative size-[40px] shrink-0 transition-opacity hover:opacity-90">
                <Image src={messengerSrc} alt="" width={40} height={40} className="absolute inset-0 block max-w-none size-full" />
            </button>
            {/* WhatsApp */}
            <button type="button" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(url)}`)} aria-label="Share on WhatsApp" className={btnCls}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[32px]">
                    <span className="absolute left-1/4 right-[25.04%] top-[23%] bottom-[27%]">
                        <Image src={`${A}/icons/whatsapp-outline.svg`} alt="" width={16} height={16} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                    <span className="absolute inset-[36.53%_37.82%_41.31%_38.23%]">
                        <Image src={`${A}/icons/whatsapp-glyph.svg`} alt="" width={8} height={8} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                </span>
            </button>
            {/* More (native share) */}
            <button type="button" onClick={more} aria-label="More share options" className={btnCls}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[13px] h-[3px]">
                    <Image src={`${A}/icons/menu-dots.svg`} alt="" width={13} height={3} className="absolute inset-0 block max-w-none size-full" />
                </span>
            </button>
        </div>
    );
}
