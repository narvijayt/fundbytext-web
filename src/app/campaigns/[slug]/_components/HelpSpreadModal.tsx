"use client";

import { useEffect, useState } from "react";

const M = "/assets/marketing";

export const SHARE_EVENT = "fbt:open-share";

/* Brand glyphs (inline, brand-coloured) — 18×18 per the Figma pill spec. */
const ICONS: Record<string, React.ReactNode> = {
    facebook:  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#1877F2"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" /></svg>,
    twitter:   <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    instagram: <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#E1306C"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-2.4.11-3.5 1.23-3.61 3.61-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.11 2.38 1.21 3.5 3.61 3.61 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c2.4-.11 3.5-1.23 3.61-3.61.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.11-2.38-1.21-3.5-3.61-3.61-1.24-.06-1.61-.07-4.76-.07zm0 4.05a4.17 4.17 0 100 8.34 4.17 4.17 0 000-8.34zm0 6.88a2.7 2.7 0 110-5.41 2.7 2.7 0 010 5.41zm5.31-7.06a.97.97 0 11-1.94 0 .97.97 0 011.94 0z" /></svg>,
    linkedin:  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#0A66C2"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg>,
    messenger: <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#0084FF"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.4 3.14 7.13.16.14.26.34.27.56l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.53-.04.91.25 1.88.38 2.8.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46l-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 00-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75a.6.6 0 00.72 0l3.16-2.4c.42-.32.97.18.69.63z" /></svg>,
    whatsapp:  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.99.58 3.84 1.59 5.4L2 22l4.77-1.56A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.47 14.38c-.23.64-1.34 1.23-1.84 1.28-.49.05-.95.23-3.2-.67-2.7-1.06-4.4-3.84-4.53-4.02-.13-.18-1.08-1.43-1.08-2.73s.68-1.94.92-2.2c.24-.27.53-.33.7-.33.18 0 .35 0 .5.01.16.01.38-.06.59.45.23.55.77 1.9.84 2.04.07.13.11.29.02.47-.09.18-.13.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.28-.12.54.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.42.11.58-.07.16-.18.66-.77.84-1.04.18-.27.35-.22.59-.13.24.09 1.52.72 1.78.85.27.13.44.2.5.31.07.11.07.62-.16 1.26z" /></svg>,
};

type Props = {
    isOpen:       boolean;
    onClose:      () => void;
    slug:         string;
    campaignName: string;
    heroUrl:      string | null;
    accent:       string;
};

export default function HelpSpreadModal({ isOpen, onClose, slug, campaignName, heroUrl, accent }: Props) {
    const [url, setUrl] = useState(`/campaigns/${slug}`);
    const [copied, setCopied] = useState(false);
    useEffect(() => { setUrl(`${window.location.origin}/campaigns/${slug}`); }, [slug]);
    useEffect(() => { document.body.style.overflow = isOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isOpen]);
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    if (!isOpen) return null;

    const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
    };
    const e = encodeURIComponent(url);

    const NETWORKS: { key: string; label: string; onClick: () => void }[] = [
        { key: "facebook",  label: "Facebook",  onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${e}`) },
        { key: "twitter",   label: "Twitter",   onClick: () => open(`https://twitter.com/intent/tweet?url=${e}`) },
        { key: "instagram", label: "Instagram", onClick: copy }, // Instagram has no web share URL → copy link to paste
        { key: "linkedin",  label: "LinkedIn",  onClick: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${e}`) },
        { key: "messenger", label: "Messenger", onClick: () => open(`https://www.facebook.com/dialog/send?app_id=140586622674265&link=${e}&redirect_uri=${e}`) },
        { key: "whatsapp",  label: "Whatsapp",  onClick: () => open(`https://wa.me/?text=${e}`) },
    ];

    // Social / Download pill — transparent, 1px #dde0e3, 12px radius, 48px tall, 16px #003060 label.
    const pill = "flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#dde0e3] bg-white text-[16px] font-medium tracking-[0.15px] text-[#003060] transition-colors hover:bg-[#f6f8fa]";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" style={{ background: "rgba(0,30,60,0.55)", backdropFilter: "blur(3px)" }} onClick={onClose}>
            <div className="relative flex max-h-[92vh] w-full max-w-[612px] flex-col overflow-y-auto overflow-x-hidden rounded-[20px] bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)]" onClick={(ev) => ev.stopPropagation()}>
                {/* Blue band — fixed-height background; the video overlaps its lower portion */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden sm:h-[347px]" style={{ background: `linear-gradient(150deg, ${accent} 0%, ${accent} 60%, color-mix(in srgb, ${accent} 78%, #000) 140%)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${M}/leaderboard/bg-pattern.png`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
                </div>

                {/* Close — 24px bare white X, 16px inset */}
                <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex size-6 items-center justify-center text-white transition-opacity hover:opacity-70">
                    <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Content flows over the band */}
                <div className="relative">
                    {/* Header text + copy-link (inside the band) */}
                    <div className="px-6 pt-8 sm:px-10 sm:pt-10">
                        <h2 className="text-[24px] font-black leading-[1.15] text-white sm:text-[32px]">Help Spread the Word</h2>
                        <p className="mt-3 text-[14px] font-medium leading-[1.4] text-white/90 sm:mt-4 sm:text-[18px]">Download this resource and share it with your friends directly and on social media!</p>

                        {/* Copy-link pill: white field + solid orange button, joined, 12px outer radius */}
                        <div className="mt-4 flex h-[46px] overflow-hidden rounded-[12px] border border-[#dde0e3] bg-white sm:mt-5 sm:h-[50px]">
                            <span className="min-w-0 flex-1 self-center truncate px-4 text-[15px] text-[#aeb5bd] sm:px-5 sm:text-[18px]">{url}</span>
                            <button type="button" onClick={copy} className="flex shrink-0 items-center gap-2 bg-[#f47435] px-4 text-[15px] font-medium tracking-[0.15px] text-white transition hover:brightness-105 sm:px-5 sm:text-[16px]">
                                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                <span className="whitespace-nowrap">{copied ? "Copied!" : "Copy Link"}</span>
                            </button>
                        </div>
                    </div>

                    {/* 16:9 video preview — overlaps the band's lower portion (no scrim) */}
                    <div className="px-6 sm:px-10">
                        <div className="relative mt-5 aspect-[532/292] w-full overflow-hidden rounded-[12px] bg-[#e8eaee] shadow-[0px_20px_20px_-14px_rgba(0,0,0,0.2),0px_20px_40px_-16px_rgba(0,0,0,0.2)] sm:mt-8">
                            {heroUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={heroUrl} alt={campaignName} className="size-full object-cover" />
                            )}
                            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-[0_8px_44px_rgba(0,48,96,0.45)] backdrop-blur-[8px] sm:size-[72px]">
                                <svg className="ml-1 size-6 text-[#0278de] sm:size-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </span>
                        </div>
                    </div>

                    {/* Social grid — 2-up on mobile, 3-up from sm; 16px gaps; Download spans full width */}
                    <div className="grid grid-cols-2 gap-4 px-6 pb-6 pt-5 sm:grid-cols-3 sm:px-10 sm:pb-10 sm:pt-8">
                        {NETWORKS.map((n) => (
                            <button key={n.key} type="button" onClick={n.onClick} className={pill}>
                                {ICONS[n.key]}{n.label}
                            </button>
                        ))}
                        <a href={heroUrl ?? "#"} download target="_blank" rel="noreferrer" className={`${pill} col-span-2 gap-3 sm:col-span-3`}>
                            <svg className="size-[18px] shrink-0 text-[#003060]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
                            Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
