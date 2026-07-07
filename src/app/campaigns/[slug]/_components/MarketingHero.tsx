"use client";

import Image from "next/image";
import Link from "next/link";
import { DONATE_EVENT } from "./DonateNavButton";
import MarketingShare from "./MarketingShare";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

type Photo = string | null;

/* ── Hero — campaign logo, title, share buttons & photo grid over the brand band.
   Themed: the band uses the campaign's accent→secondary gradient with the chosen
   background-theme pattern overlaid (matching the Step-3 preview). */
export default function MarketingHero({
    slug, title, logoUrl, heroUrl, galleryUrls, isOrganizer, theme, canDonate,
}: {
    slug: string;
    title: string;
    logoUrl: Photo;
    heroUrl: Photo;
    galleryUrls: string[];
    isOrganizer: boolean;
    theme: MarketingTheme;
    canDonate: boolean;
}) {
    const photos: Photo[] = [galleryUrls[0] ?? null, galleryUrls[1] ?? null, galleryUrls[2] ?? null, galleryUrls[3] ?? null];

    return (
        <div className="relative">
            {/* Brand band — accent→secondary gradient + theme pattern overlay */}
            <div
                className="absolute inset-x-0 top-0 h-[498px] md:h-[635px] overflow-hidden"
                style={{ background: `linear-gradient(157deg, ${theme.accent} 0%, ${theme.secondary} 100%)` }}
            >
                {theme.themeImage && (
                    /* Tile the pattern at its native motif size (the same size shown in
                       the theme picker) instead of stretching one copy to cover the band —
                       stretching blew the motif up several times larger than intended. */
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-[0.12]"
                        style={{
                            backgroundImage: `url('${theme.themeImage}')`,
                            backgroundRepeat: "repeat",
                            backgroundSize: theme.themeSize,
                        }}
                    />
                )}
                {/* Right-side glow — a lighter tint of the accent (not a white halo),
                    matching the Figma hero which brightens toward the right edge. */}
                <span aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(75% 95% at 100% 38%, color-mix(in oklch, ${theme.accent} 58%, white) 0%, transparent 62%)` }} />
            </div>

            <div className="relative max-w-[1152px] mx-auto px-[16px] md:px-[24px] xl:px-0">
                {/* Nav */}
                <div
                    className="flex items-center justify-between overflow-hidden px-[16px] py-[16px] md:px-[24px] md:py-[20px] rounded-b-[20px] bg-[#f9f9fc]"
                    style={{ boxShadow: "0px 4px 30px 0px rgba(0,91,172,0.08)" }}
                >
                    <Link href="/">
                        <Image src={`${A}/nav/logo.svg`} alt="FundbyText" width={199} height={39} className="w-[153px] h-[30px] md:w-[198.9px] md:h-[39px] shrink-0" />
                    </Link>
                    <div className="flex flex-1 gap-[12px] items-center justify-end min-w-0">
                        <button
                            type="button"
                            onClick={() => { if (canDonate) window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId: null } })); }}
                            className="hidden xl:flex gap-[8px] items-center justify-center pb-[18px] pt-[16px] px-[20px] rounded-[12px] shrink-0 transition-opacity hover:opacity-90 disabled:opacity-40"
                            style={{ background: "#f47435" }}
                            disabled={!canDonate}
                        >
                            <span className="font-black text-[12px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">donate to this campaign</span>
                        </button>
                        <Link href="/campaigns/create" aria-label="Get started" className="relative overflow-hidden rounded-[4px] size-[30px] md:size-[48px] shrink-0">
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[8px] left-[calc(50%+5px)] -translate-x-1/2" />
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[18px] top-[14px] left-1/2 -translate-x-1/2" />
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[20px] left-[calc(50%-5px)] -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[12.4px] left-[calc(50%+8px)] -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[28px] top-[22.4px] left-1/2 -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[32.4px] left-[calc(50%-8px)] -translate-x-1/2" />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col gap-[32px] pt-[42px] md:pt-[72px] xl:pt-[92px]">
                    <div className="relative flex flex-col md:gap-[32px] w-full">
                        {/* Logo + title + edit */}
                        <div className="flex flex-col items-center md:flex-row md:items-stretch md:gap-[24px] w-full xl:pr-[294px]">
                            <div className="bg-white overflow-hidden relative rounded-[16px] shrink-0 size-[104px]">
                                {logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <Image src={`${A}/hero/org-logo.svg`} alt="" width={76} height={63} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[76.12px] h-[63.23px]" />
                                )}
                            </div>
                            <div className="flex flex-col items-center md:flex-1 md:flex-row md:items-center md:justify-between min-w-0">
                                <div className="md:h-[104px] flex items-center py-2 md:py-0">
                                    <h1
                                        className="font-black text-[32px] xl:text-[40px] text-white tracking-[-1px] text-center md:text-left w-full md:max-w-[500px]"
                                        style={{ lineHeight: 1.1, textShadow: "0px 32px 40px rgba(2,104,192,0.16), 0px 12px 12px rgba(0,48,96,0.04)" }}
                                    >
                                        {title}
                                    </h1>
                                </div>
                                {isOrganizer && (
                                    <Link
                                        href={`/campaigns/${slug}/edit`}
                                        className="bg-[#f47435] flex gap-[12px] items-center px-[12px] py-[6px] rounded-[6px] shrink-0 md:self-end xl:self-center transition-opacity hover:opacity-90 mt-2 md:mt-0"
                                    >
                                        <Image src={`${A}/icons/edit.svg`} alt="" width={20} height={20} className="size-[20px]" />
                                        <span className="font-medium text-[14px] text-white leading-none">EDIT</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                        {/* Share block */}
                        <div className="flex flex-col gap-[16px] items-center justify-center p-[4px] mt-[12px] md:mt-0 xl:absolute xl:right-0 xl:top-0 xl:mt-0 xl:h-[104px] xl:w-[270px] xl:items-end">
                            <p className="font-black text-[12px] text-white text-center tracking-[1px] uppercase leading-none whitespace-nowrap">Help us spread the word!</p>
                            <MarketingShare slug={slug} variant="dark" />
                        </div>
                    </div>

                    {/* Photo grid */}
                    <div className="flex flex-col xl:flex-row gap-[24px] items-start w-full xl:h-[464px]">
                        <div className="bg-[#e7e9eb] h-[282px] md:h-[330px] xl:h-full overflow-hidden relative rounded-[16px] shrink-0 w-full xl:w-[662px]">
                            {heroUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={heroUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex flex-1 flex-col gap-[24px] w-full xl:h-full items-start justify-center min-w-0">
                            {[[0, 1], [2, 3]].map((row, ri) => (
                                <div key={ri} className="flex xl:flex-1 gap-[24px] items-start min-h-0 w-full">
                                    {row.map((idx) => (
                                        <div key={idx} className="bg-[#e7e9eb] flex-1 h-[129px] md:h-[153px] xl:h-full min-w-0 overflow-hidden relative rounded-[16px]">
                                            {photos[idx] && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={photos[idx]!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
