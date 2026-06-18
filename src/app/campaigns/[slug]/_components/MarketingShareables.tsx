"use client";

import Image from "next/image";
import { useState } from "react";
import MarketingShare from "./MarketingShare";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

/* Download / share button pinned to the top-right of a shareable. Downloads the
   underlying image where there is one (gallery photo / QR). */
function ShareableButton({ href }: { href?: string }) {
    return (
        <a
            href={href ?? "#"}
            download={href ? "" : undefined}
            target={href ? "_blank" : undefined}
            rel="noreferrer"
            aria-label="Download shareable"
            className="absolute right-[16px] top-[16px] backdrop-blur-[10px] bg-[rgba(255,255,255,0.5)] overflow-hidden rounded-full size-[56px] transition-transform hover:scale-105"
            style={{ boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.4)" }}
        >
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[24px]">
                <Image src={`${A}/icons/upload.svg`} alt="" width={24} height={24} className="block max-w-none size-full" />
            </span>
        </a>
    );
}

export default function MarketingShareables({
    slug, galleryUrls, heroUrl, theme,
}: {
    slug: string;
    galleryUrls: string[];
    heroUrl: string | null;
    theme: MarketingTheme;
}) {
    const [hintOpen, setHintOpen] = useState(true);
    const photos = galleryUrls.filter(Boolean);
    const videoThumb = heroUrl ?? photos[0] ?? null;
    const graphicA = photos[0] ?? heroUrl ?? null;
    const graphicB = photos[1] ?? photos[0] ?? heroUrl ?? null;

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
                {/* Video placeholder (no campaign video — static placeholder per design) */}
                <div className="bg-[#e8eaee] h-[320px] md:h-[550px] overflow-hidden relative rounded-[24px] w-full">
                    {videoThumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={videoThumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-black/20" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] md:w-[254px] md:h-[254px]">
                        <Image src={`${A}/shareables/play-button.svg`} alt="Play video" width={254} height={254} className="block max-w-none size-full" />
                    </span>
                </div>

                {/* Shareable graphics + QR */}
                <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap gap-[24px] items-center w-full">
                    <div className="bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:w-[320px] md:shrink-0">
                        {graphicA && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={graphicA} alt="Shareable graphic" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <ShareableButton href={graphicA ?? undefined} />
                    </div>
                    <div className="bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:flex-1 md:min-w-0">
                        {graphicB && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={graphicB} alt="Shareable graphic" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <ShareableButton href={graphicB ?? undefined} />
                    </div>
                    <div className="bg-white h-[400px] overflow-hidden relative rounded-[24px] w-full xl:w-[320px] xl:flex-none xl:shrink-0 border border-[#eff4f9] flex items-center justify-center">
                        <span className="w-[264px] h-[264px] flex items-center justify-center">
                            <Image src={`${A}/shareables/qr-code.svg`} alt="Campaign QR code" width={264} height={264} className="block max-w-none size-full" />
                        </span>
                        <ShareableButton href={`${A}/shareables/qr-code.svg`} />
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
                                Download any of the shareables above and post them to spread the word about your campaign!
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
