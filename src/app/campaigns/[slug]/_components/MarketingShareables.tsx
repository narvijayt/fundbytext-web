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
export const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

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
                    <ContextOverlay text="The campaign's cover video — press play to watch." />
                </button>
            )}
        </div>
    );
}

/* Context caption revealed on hover — the FundBuddy hint tells users to hover a
   tile to learn what it's for. */
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

/* On-brand fill (accent→secondary gradient + theme pattern) used behind the QR
   when there's no spare photo. */
function BrandedBg({ theme }: { theme: MarketingTheme }) {
    return (
        <>
            <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(157deg, ${theme.accent} 0%, ${theme.secondary} 100%)` }} />
            {theme.themeImage && (
                <span
                    aria-hidden
                    className={`absolute inset-0 ${theme.themeCover ? "opacity-[0.16]" : "opacity-[0.12]"}`}
                    style={{ backgroundImage: `url('${theme.themeImage}')`, backgroundRepeat: theme.themeCover ? "no-repeat" : "repeat", backgroundSize: theme.themeSize, backgroundPosition: "center" }}
                />
            )}
        </>
    );
}

export default function MarketingShareables({
    slug, galleryUrls, heroUrl, videoUrl = null, videoThumbnail = null, theme,
}: {
    slug: string;
    galleryUrls: string[];
    heroUrl: string | null;
    videoUrl?: string | null;
    videoThumbnail?: string | null;
    theme: MarketingTheme;
}) {
    const [hintOpen, setHintOpen] = useState(true);
    const photos = galleryUrls.filter(Boolean);
    const videoSrc = videoUrl?.trim() || SAMPLE_VIDEO;
    // Poster: an explicit thumbnail wins, else fall back to the hero / first photo.
    const videoThumb = videoThumbnail?.trim() || heroUrl || photos[0] || null;
    // Only real gallery photos become standalone tiles — the hero already shows as
    // the video poster, so nothing is repeated when a campaign has few/no photos.
    const photoCards = photos.slice(0, 2);
    // A spare gallery photo sits behind the QR; with none, it uses a branded panel.
    const qrPhoto = photos[2] ?? null;
    // Speech-bubble tail colour — the branded gradient is accent-leaning at the
    // bubble's left edge (where the tail attaches), so match that.
    const arrowColor = `color-mix(in srgb, ${theme.accent} 82%, ${theme.secondary})`;

    // QR encodes this campaign's public URL — resolved on the client from the origin.
    const [campaignUrl, setCampaignUrl] = useState(`/campaigns/${slug}`);
    useEffect(() => { setCampaignUrl(`${window.location.origin}/campaigns/${slug}`); }, [slug]);

    return (
        <div className="flex flex-col gap-[40px] items-center justify-center pb-[40px] md:pb-[75px] pt-[40px] md:pt-[80px] xl:pt-[112px] px-[16px] md:px-[24px] xl:px-0">
            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center md:flex-row md:justify-center px-[8px]">
                <h2 className="md:flex-1 font-black text-[32px] xl:text-[38px] 2xl:text-[46px] tracking-[-1.5px] leading-none text-center md:text-left" style={{ color: theme.secondary }}>
                    Spread the Word
                </h2>
                <div className="flex items-start justify-end p-[4px] shrink-0">
                    <MarketingShare slug={slug} variant="orange" />
                </div>
            </div>

            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center justify-center">
                {/* Campaign video */}
                <VideoTile src={videoSrc} poster={videoThumb} />

                {photoCards.length > 0 ? (
                    /* Campaign photos (gallery only) + the QR code. Only real photos are
                       tiles; the QR uses a spare photo or a branded panel behind it. */
                    <div className="flex w-full flex-col flex-wrap items-stretch justify-center gap-[24px] md:flex-row">
                        {photoCards.map((p, i) => (
                            <div key={i} className="group relative h-[400px] w-full overflow-hidden rounded-[24px] bg-[#e8eaee] md:min-w-[280px] md:flex-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p} alt="Campaign photo" className="absolute inset-0 h-full w-full object-cover" />
                                <ContextOverlay text={i === 0 ? "A photo from this campaign." : "Another photo from this campaign."} />
                            </div>
                        ))}
                        <div className="group relative h-[400px] w-full overflow-hidden rounded-[24px] bg-[#e8eaee] md:w-[340px] md:shrink-0">
                            {qrPhoto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={qrPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                                <BrandedBg theme={theme} />
                            )}
                            {/* White card holding a blue QR for this campaign's URL (matches Figma). */}
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-[24px] bg-white p-[26px] shadow-[0px_16px_40px_-8px_rgba(0,48,96,0.25)]">
                                <QRCodeSVG value={campaignUrl} size={188} level="M" fgColor={theme.accent} bgColor="#ffffff" title="Scan to open the campaign page" />
                            </span>
                            <ContextOverlay text="Scan this code to open the campaign page — or share the link to spread the word." />
                        </div>
                    </div>
                ) : (
                    /* No gallery photos — a wide branded QR banner keeps the section
                       balanced under the full-width video instead of a lonely card. */
                    <div className="relative w-full overflow-hidden rounded-[24px]">
                        <BrandedBg theme={theme} />
                        <div className="relative flex flex-col items-center justify-center gap-[28px] p-[32px] text-center md:flex-row md:gap-[44px] md:p-[44px] md:text-left">
                            <span className="flex shrink-0 items-center justify-center rounded-[22px] bg-white p-[22px] shadow-[0px_16px_40px_-8px_rgba(0,48,96,0.25)]">
                                <QRCodeSVG value={campaignUrl} size={168} level="M" fgColor={theme.accent} bgColor="#ffffff" title="Scan to open the campaign page" />
                            </span>
                            <div className="max-w-[440px]">
                                <h3 className="font-black text-white text-[24px] md:text-[28px]" style={{ lineHeight: 1.15 }}>Scan to open this campaign</h3>
                                <p className="mt-[10px] font-medium text-white/80 text-[15px] md:text-[16px]" style={{ lineHeight: 1.5 }}>
                                    Point a phone camera at the code &mdash; or share the campaign link &mdash; to help spread the word.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FundBuddy hint — full-width dismissible tip (just resized smaller). */}
            {hintOpen && (
                <div className="w-full max-w-[1152px] flex items-center justify-center">
                    <div className="hidden md:block h-[116px] w-[88px] relative shrink-0 overflow-hidden">
                        <span className="absolute inset-[7.81%_3.93%_4.69%_4.13%]">
                            <Image src={`${A}/shareables/fundbuddy-large.svg`} alt="" width={132} height={166} className="absolute inset-0 block max-w-none size-full" />
                        </span>
                    </div>
                    <Image src={`${A}/shareables/fundbuddy-small.svg`} alt="" width={63} height={80} className="md:hidden h-[62px] w-[49px] shrink-0 self-center" />
                    <div className="relative flex-1 min-w-0">
                        <div
                            className="relative ml-[16px] overflow-hidden rounded-[14px] xl:max-w-[952px]"
                            style={{ boxShadow: "0px 16px 30px -8px rgba(20,65,109,0.28)" }}
                        >
                            {/* Branded gradient fill (matches the QR panel's colour, no pattern). */}
                            <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(157deg, ${theme.accent} 0%, ${theme.secondary} 100%)` }} />
                            <div className="relative flex flex-col gap-[12px] items-end px-[18px] md:px-[24px] py-[14px] md:py-[16px]">
                                <p className="font-medium text-[13px] md:text-[15px] text-white w-full" style={{ lineHeight: 1.4 }}>
                                    Hover over any tile above to see what it&rsquo;s for &mdash; then use the share buttons or QR code to spread the word!
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setHintOpen(false)}
                                    className="bg-white flex items-center justify-center overflow-hidden pb-[8px] pt-[7px] px-[13px] rounded-[10px] transition-transform hover:scale-105"
                                    style={{ boxShadow: "0px 8px 24px -8px rgba(255,255,255,0.7)" }}
                                >
                                    <span className="font-bold text-[13px] leading-none whitespace-nowrap" style={{ color: theme.accent }}>Got it!</span>
                                </button>
                            </div>
                        </div>
                        {/* Speech-bubble tail — a clean CSS triangle, vertically centred on
                            the bubble so it never spills over the top edge. */}
                        <span
                            aria-hidden
                            className="absolute left-[2px] top-1/2 h-0 w-0 -translate-y-1/2"
                            style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: `15px solid ${arrowColor}` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
