"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import MarketingShare from "./MarketingShare";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

// Fallback demo clip — "Big Buck Bunny" (© Blender Foundation, CC-BY 3.0), the
// standard freely-licensed open sample video. Shown when a campaign hasn't set
// its own video (admins add one from the campaign's Controls panel); the clip
// loads only when the viewer presses play.
const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

/* The Spread-the-Word video tile: poster + play button, swapped for a real
   <video> player on click. */
function VideoTile({ src, poster }: { src: string; poster: string | null }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className="group bg-[#e8eaee] h-[320px] md:h-[550px] overflow-hidden relative rounded-[24px] w-full">
            {playing ? (
                <video
                    src={src}
                    poster={poster ?? undefined}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                />
            ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label="Play campaign video" className="absolute inset-0 h-full w-full cursor-pointer">
                    {poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-black/20" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] md:w-[254px] md:h-[254px] transition-transform group-hover:scale-105">
                        <Image src={`${A}/shareables/play-button.svg`} alt="" width={254} height={254} className="block max-w-none size-full" />
                    </span>
                    <ContextOverlay text="Play the campaign video, then share it to rally support." />
                </button>
            )}
        </div>
    );
}

/* Context caption revealed on hover — the FundBuddy hint tells users to hover a
   shareable to learn what it's for. */
function ContextOverlay({ text }: { text: string }) {
    return (
        <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end p-[16px] md:p-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ background: "linear-gradient(0deg, rgba(0,48,96,0.82) 0%, rgba(0,48,96,0) 100%)" }}
        >
            <span className="font-medium text-[14px] md:text-[15px] text-white" style={{ lineHeight: 1.35 }}>{text}</span>
        </span>
    );
}

export default function MarketingShareables({
    slug, galleryUrls, heroUrl, videoUrl = null, theme,
}: {
    slug: string;
    galleryUrls: string[];
    heroUrl: string | null;
    videoUrl?: string | null;
    theme: MarketingTheme;
}) {
    const [hintOpen, setHintOpen] = useState(true);
    const photos = galleryUrls.filter(Boolean);
    const videoSrc = videoUrl?.trim() || SAMPLE_VIDEO;
    const videoThumb = heroUrl ?? photos[0] ?? null;
    const graphicA = photos[0] ?? heroUrl ?? null;
    const graphicB = photos[1] ?? photos[0] ?? heroUrl ?? null;

    // QR encodes this campaign's public URL — resolved on the client from the origin.
    const [campaignUrl, setCampaignUrl] = useState(`/campaigns/${slug}`);
    useEffect(() => { setCampaignUrl(`${window.location.origin}/campaigns/${slug}`); }, [slug]);
    const qrBg = photos[2] ?? heroUrl ?? photos[0] ?? null;

    return (
        <div className="flex flex-col gap-[40px] items-center justify-center pb-[40px] md:pb-[75px] pt-[40px] md:pt-[80px] xl:pt-[112px] px-[16px] md:px-[24px] xl:px-0">
            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center md:flex-row md:justify-center px-[8px]">
                <h2 className="md:flex-1 font-black text-[32px] xl:text-[46px] tracking-[-1.5px] leading-none text-center md:text-left" style={{ color: theme.secondary }}>
                    Spread the Word
                </h2>
                <div className="flex items-start justify-end p-[4px] shrink-0">
                    <MarketingShare slug={slug} variant="orange" />
                </div>
            </div>

            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center justify-center">
                {/* Campaign video */}
                <VideoTile src={videoSrc} poster={videoThumb} />

                {/* Shareable graphics + QR */}
                <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap gap-[24px] items-center w-full">
                    <div className="group bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:w-[320px] md:shrink-0">
                        {graphicA && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={graphicA} alt="Shareable graphic" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <ContextOverlay text="A campaign photo — share it on social to spread the word." />
                    </div>
                    <div className="group bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:flex-1 md:min-w-0">
                        {graphicB && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={graphicB} alt="Shareable graphic" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <ContextOverlay text="Another campaign photo, ready to post anywhere." />
                    </div>
                    <div className="group bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full xl:w-[320px] xl:flex-none xl:shrink-0">
                        {qrBg && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        {/* White card holding a blue QR for this campaign's URL (matches Figma). */}
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-[24px] bg-white p-[26px] shadow-[0px_16px_40px_-8px_rgba(0,48,96,0.25)]">
                            <QRCodeSVG value={campaignUrl} size={188} level="M" fgColor={theme.accent} bgColor="#ffffff" title="Scan to open the campaign page" />
                        </span>
                        <ContextOverlay text="Scan this QR code to open the campaign's donation page." />
                    </div>
                </div>
            </div>

            {/* FundBuddy hint */}
            {hintOpen && (
                <div className="w-full max-w-[1152px] flex items-center justify-center">
                    <div className="hidden md:block h-[189px] w-[143px] relative shrink-0 overflow-hidden">
                        <span className="absolute inset-[7.81%_3.93%_4.69%_4.13%]">
                            <Image src={`${A}/shareables/fundbuddy-large.svg`} alt="" width={132} height={166} className="absolute inset-0 block max-w-none size-full" />
                        </span>
                    </div>
                    <Image src={`${A}/shareables/fundbuddy-small.svg`} alt="" width={63} height={80} className="md:hidden h-[80px] w-[63px] shrink-0 self-center" />
                    <div className="relative flex-1 min-w-0">
                        <div
                            className="ml-[16px] md:ml-[49px] flex flex-col gap-[24px] items-end px-[24px] md:px-[32px] py-[24px] rounded-[15px] xl:max-w-[952px]"
                            style={{
                                background: `linear-gradient(0deg, ${theme.accent} 0%, ${theme.secondary} 100%)`,
                                boxShadow: "0px 32px 40px 0px rgba(20,65,109,0.26), 0px 12px 12px 0px rgba(0,91,172,0.25)",
                            }}
                        >
                            <p className="font-normal text-[18px] md:text-[22px] text-white w-full" style={{ lineHeight: 1.25 }}>
                                Hover on any of the shareables above to get context about what they&rsquo;re for!
                            </p>
                            <button
                                type="button"
                                onClick={() => setHintOpen(false)}
                                className="bg-white flex items-center justify-center overflow-hidden pb-[13px] pt-[12px] px-[14px] rounded-[12px] transition-transform hover:scale-105"
                                style={{ boxShadow: "0px 12px 40px -8px rgba(255,255,255,0.74)" }}
                            >
                                <span className="font-bold text-[14px] leading-none whitespace-nowrap" style={{ color: theme.accent }}>Got it!</span>
                            </button>
                        </div>
                        <span className="absolute left-[-18px] md:left-0 top-[26px] md:top-[46px] w-[51px] h-[56px] flex items-center justify-center">
                            <Image src={`${A}/shareables/bubble-arrow.svg`} alt="" width={56} height={51} className="-rotate-90 w-[56px] h-[51px] max-w-none" />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
