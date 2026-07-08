"use client";

import { useEffect, useState } from "react";
import { SAMPLE_VIDEO } from "./MarketingShareables";

const M = "/assets/marketing";
const SHARE = "/assets/campaigns/share";

export const SHARE_EVENT = "fbt:open-share";

/* Exact Figma brand icons (18×18, Streamline set) exported from the design. */
const ICONS: Record<string, string> = {
    facebook:  `${SHARE}/facebook.svg`,
    twitter:   `${SHARE}/twitter.svg`,
    instagram: `${SHARE}/instagram.svg`,
    linkedin:  `${SHARE}/linkedin.svg`,
    messenger: `${SHARE}/messenger.svg`,
    whatsapp:  `${SHARE}/whatsapp.svg`,
};

type Props = {
    isOpen:       boolean;
    onClose:      () => void;
    slug:         string;
    campaignName: string;
    heroUrl:      string | null;
    accent:       string;
    patternImage?: string | null;
    patternSize?:  string;
    patternCover?: boolean;
    videoUrl?:    string | null;
    videoPoster?: string | null;
};

export default function HelpSpreadModal({ isOpen, onClose, slug, campaignName, heroUrl, accent, patternImage = null, patternSize = "", patternCover = false, videoUrl = null, videoPoster = null }: Props) {
    const pat = patternImage ?? `${M}/leaderboard/bg-pattern.png`;
    const [url, setUrl] = useState(`/campaigns/${slug}`);
    const [copied, setCopied] = useState(false);
    const [playing, setPlaying] = useState(false);
    const videoSrc = videoUrl?.trim() || SAMPLE_VIDEO;
    const poster   = videoPoster ?? heroUrl;
    useEffect(() => { setUrl(`${window.location.origin}/campaigns/${slug}`); }, [slug]);
    useEffect(() => { document.body.style.overflow = isOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isOpen]);
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    // Enter/exit animation. Mount on open (and keep mounted through the exit
    // transition on close); flip `shown` only after the mount has painted so the
    // enter transition actually plays.
    const [render, setRender] = useState(isOpen);
    const [shown,  setShown]  = useState(false);
    useEffect(() => {
        if (isOpen) { setRender(true); return; }
        setShown(false);
        setPlaying(false);
        const t = setTimeout(() => setRender(false), 200);
        return () => clearTimeout(t);
    }, [isOpen]);
    useEffect(() => {
        if (!render || !isOpen) return;
        const raf = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(raf);
    }, [render, isOpen]);

    if (!render) return null;

    const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
    };
    const e    = encodeURIComponent(url);
    const text = encodeURIComponent(`Support ${campaignName}`);
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Download the campaign's shareable image (e.g. to post on Instagram). The
    // blob URL is cross-origin, so `download` on a plain <a> is ignored — fetch
    // the bytes and trigger a real download instead.
    const download = async () => {
        if (!heroUrl) return;
        try {
            const res  = await fetch(heroUrl);
            const blob = await res.blob();
            const obj  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = obj;
            a.download = `${slug}.${(blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg")}`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(obj);
        } catch { open(heroUrl); }
    };

    const NETWORKS: { key: string; label: string; onClick: () => void }[] = [
        { key: "facebook",  label: "Facebook",  onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${e}`) },
        { key: "twitter",   label: "Twitter",   onClick: () => open(`https://twitter.com/intent/tweet?url=${e}&text=${text}`) },
        // Instagram has no web share intent → copy the link and open Instagram to paste it.
        { key: "instagram", label: "Instagram", onClick: () => { copy(); open(isMobile ? "instagram://app" : "https://www.instagram.com"); } },
        { key: "linkedin",  label: "LinkedIn",  onClick: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${e}`) },
        // Messenger deep link on mobile; the Facebook share dialog on desktop.
        { key: "messenger", label: "Messenger", onClick: () => open(isMobile ? `fb-messenger://share?link=${e}` : `https://www.facebook.com/sharer/sharer.php?u=${e}`) },
        { key: "whatsapp",  label: "Whatsapp",  onClick: () => open(`https://wa.me/?text=${text}%20${e}`) },
    ];

    // Social / Download pill — transparent, 1px #dde0e3, 12px radius, 48px tall, 16px #003060 label.
    const pill = "flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#dde0e3] bg-white text-[16px] font-medium tracking-[0.15px] text-[#003060] transition-colors hover:bg-[#f6f8fa]";

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-3 transition-opacity duration-200 ease-out motion-reduce:transition-none sm:p-6 ${shown ? "opacity-100" : "opacity-0"}`} style={{ background: "rgba(0,30,60,0.55)", backdropFilter: "blur(3px)" }} onClick={onClose}>
            <div className={`relative flex max-h-[92vh] w-full max-w-[612px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)] transition-all duration-200 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`} onClick={(ev) => ev.stopPropagation()}>
              {/* Inner scroll area — keeps the scrollbar inside the rounded corners.
                  Thin, and inherits the app-wide scrollbar colour from globals.css
                  (scrollbar-width isn't inherited, so it's set explicitly here). */}
              <div className="modal-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Blue band — accent gradient + centred color-dodge halo + the campaign's
                    selected theme pattern as a watermark (same treatment as the donation
                    success modal); the video overlaps its lower portion. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden sm:h-[347px]"
                    style={{
                        backgroundImage: `radial-gradient(58% 72% at 50% 16%, rgba(160,210,255,0.6), rgba(160,210,255,0) 62%), linear-gradient(160deg, ${accent} 0%, ${accent} 52%, color-mix(in srgb, ${accent} 74%, #000) 120%)`,
                        backgroundBlendMode: "color-dodge, normal",
                    }}
                >
                    <div
                        className={`absolute inset-0 ${patternCover ? "opacity-[0.16]" : "opacity-[0.12]"}`}
                        style={{
                            backgroundImage: `url('${pat}')`,
                            backgroundRepeat: patternCover ? "no-repeat" : "repeat",
                            backgroundSize: patternImage ? patternSize : "cover",
                            backgroundPosition: patternCover ? "center" : undefined,
                        }}
                    />
                </div>

                {/* Close — 24px bare white X, 16px inset */}
                <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex size-6 items-center justify-center text-white transition-opacity hover:opacity-70">
                    <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Content flows over the band */}
                <div className="relative">
                    {/* Header text + copy-link (inside the band) */}
                    <div className="px-6 pt-8 sm:px-10 sm:pt-10">
                        <h2 className="text-[22px] font-black leading-[1.15] text-white sm:text-[32px]">Help Spread the Word</h2>
                        <p className="mt-2.5 text-[14px] font-medium leading-[1.4] text-white/90 sm:mt-3.5 sm:text-[18px]">Download this resource and share with your friends directly and on social media!</p>

                        {/* Copy-link pill: white field + solid orange button, joined, 12px outer radius */}
                        <div className="mt-4 flex h-[46px] overflow-hidden rounded-[12px] border border-[#dde0e3] bg-white sm:mt-5 sm:h-[50px]">
                            <span className="min-w-0 flex-1 self-center truncate px-4 text-[14px] text-[#aeb5bd] sm:px-5 sm:text-[18px]">{url}</span>
                            <button type="button" onClick={copy} className="flex shrink-0 items-center gap-2 bg-[#f47435] px-4 text-[14px] font-medium tracking-[0.15px] text-white transition hover:brightness-105 sm:px-5 sm:text-[16px]">
                                <svg className="size-[18px]" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9.675V12.825C12 15.45 10.95 16.5 8.325 16.5H5.175C2.55 16.5 1.5 15.45 1.5 12.825V9.675C1.5 7.05 2.55 6 5.175 6H8.325C10.95 6 12 7.05 12 9.675Z" /><path d="M16.5 5.175V8.325C16.5 10.95 15.45 12 12.825 12H12V9.675C12 7.05 10.95 6 8.325 6H6V5.175C6 2.55 7.05 1.5 9.675 1.5H12.825C15.45 1.5 16.5 2.55 16.5 5.175Z" /></svg>
                                <span className="whitespace-nowrap">{copied ? "Copied!" : "Copy Link"}</span>
                            </button>
                        </div>
                    </div>

                    {/* 16:9 campaign video — poster + play button, swapped for a real
                        player on click (mirrors the Spread-the-Word video tile). */}
                    <div className="px-6 sm:px-10">
                        <div className="relative mt-5 aspect-[532/292] w-full overflow-hidden rounded-[12px] bg-[#e8eaee] shadow-[0px_20px_20px_-14px_rgba(0,0,0,0.2),0px_20px_40px_-16px_rgba(0,0,0,0.2)] sm:mt-8">
                            {playing ? (
                                // eslint-disable-next-line jsx-a11y/media-has-caption
                                <video src={videoSrc} poster={poster ?? undefined} controls autoPlay playsInline className="absolute inset-0 size-full bg-black object-cover" />
                            ) : (
                                <button type="button" onClick={() => setPlaying(true)} aria-label="Play campaign video" className="absolute inset-0 size-full cursor-pointer">
                                    {poster && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={poster} alt={campaignName} className="absolute inset-0 size-full object-cover" />
                                    )}
                                    <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-[0_8px_44px_rgba(0,48,96,0.45)] backdrop-blur-[8px] transition-transform hover:scale-105 sm:size-[72px]">
                                        <svg className="ml-1 size-6 text-[#0278de] sm:size-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Social grid — 2-up on mobile, 3-up from sm; 16px gaps; Download spans full width */}
                    <div className="grid grid-cols-2 gap-4 px-6 pb-6 pt-5 sm:grid-cols-3 sm:px-10 sm:pb-10 sm:pt-8">
                        {NETWORKS.map((n) => (
                            <button key={n.key} type="button" onClick={n.onClick} className={pill}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ICONS[n.key]} alt="" className="size-[18px] shrink-0" />{n.label}
                            </button>
                        ))}
                        <button type="button" onClick={download} disabled={!heroUrl} className={`${pill} col-span-2 gap-3 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`${SHARE}/download.svg`} alt="" className="size-[18px] shrink-0" />
                            Download
                        </button>
                    </div>
                </div>
              </div>
            </div>
        </div>
    );
}
