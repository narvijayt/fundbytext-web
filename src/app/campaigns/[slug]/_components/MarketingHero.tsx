"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
import { DONATE_EVENT } from "./DonateNavButton";
import MarketingShare from "./MarketingShare";
import type { MarketingTheme } from "./marketingTheme";

const A = "/assets/marketing";

type Photo = string | null;
type DonateNotice = { title: string; message: string } | null;

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: ReactNode }) {
    return (
        <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-[15px] font-semibold text-[#003060] transition-colors hover:bg-[#f4f8f9]">
            {children}
        </Link>
    );
}

/* ── Hero — campaign logo, title, share buttons & photo grid over the brand band.
   Themed: the band uses the campaign's accent→secondary gradient with the chosen
   background-theme pattern overlaid (matching the Step-3 preview). */
export default function MarketingHero({
    slug, title, logoUrl, heroUrl, galleryUrls, isOrganizer, theme, canDonate, donateNotice = null,
}: {
    slug: string;
    title: string;
    logoUrl: Photo;
    heroUrl: Photo;
    galleryUrls: string[];
    isOrganizer: boolean;
    theme: MarketingTheme;
    canDonate: boolean;
    donateNotice?: DonateNotice;
}) {
    const photos: Photo[] = [galleryUrls[0] ?? null, galleryUrls[1] ?? null, galleryUrls[2] ?? null, galleryUrls[3] ?? null];
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuShown, setMenuShown] = useState(false);
    const [noticeOpen, setNoticeOpen] = useState(false);
    const [noticeShown, setNoticeShown] = useState(false);

    function closeMenu() { setMenuShown(false); window.setTimeout(() => setMenuOpen(false), 200); }
    function closeNotice() { setNoticeShown(false); window.setTimeout(() => setNoticeOpen(false), 200); }

    // Animate the slide-in menu, lock body scroll, and close on Escape while open.
    useEffect(() => {
        if (!menuOpen) return;
        const raf = requestAnimationFrame(() => setMenuShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeMenu(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    }, [menuOpen]);

    // Same enter/exit animation for the donations-not-live notice.
    useEffect(() => {
        if (!noticeOpen) return;
        const raf = requestAnimationFrame(() => setNoticeShown(true));
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeNotice(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    }, [noticeOpen]);

    // Donate intent — open the real form when donations are live, else surface the
    // explanatory notice (draft / upcoming / completed / paused).
    function donate() {
        closeMenu();
        if (canDonate) window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { memberId: null } }));
        else setNoticeOpen(true);
    }

    return (
        <div className="relative">
            {/* Brand band — accent→secondary gradient + theme pattern overlay */}
            <div
                className="absolute inset-x-0 top-0 h-[498px] md:h-[635px] overflow-hidden"
                style={{ background: `linear-gradient(157deg, ${theme.accent} 0%, ${theme.secondary} 100%)` }}
            >
                {/* Layer order: background gradient → halo → pattern. The glow sits
                    UNDER the pattern so the motif stays visible over it (a lighter
                    tint of the accent, centred on the right edge per the Figma). */}
                <span aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(75% 95% at 100% 55%, color-mix(in oklch, ${theme.accent} 58%, white) 0%, transparent 62%)` }} />
                {theme.themeImage && (
                    /* Tile the pattern at its native motif size (the same size shown in
                       the theme picker) instead of stretching one copy to cover the band —
                       stretching blew the motif up several times larger than intended. */
                    <div
                        aria-hidden
                        className={`absolute inset-0 ${theme.themeCover ? "opacity-[0.18]" : "opacity-[0.12]"}`}
                        style={{
                            backgroundImage: `url('${theme.themeImage}')`,
                            backgroundRepeat: theme.themeCover ? "no-repeat" : "repeat",
                            backgroundSize: theme.themeSize,
                            backgroundPosition: "center",
                        }}
                    />
                )}
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
                            onClick={donate}
                            className="hidden xl:flex gap-[8px] items-center justify-center pb-[18px] pt-[16px] px-[20px] rounded-[12px] shrink-0 transition-transform hover:scale-[1.02] active:scale-95"
                            style={{ background: "#f47435" }}
                        >
                            <span className="font-black text-[12px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">donate to this campaign</span>
                        </button>
                        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="relative overflow-hidden rounded-[4px] size-[30px] md:size-[48px] shrink-0 transition-transform hover:scale-105 active:scale-95">
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[8px] left-[calc(50%+5px)] -translate-x-1/2" />
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[18px] top-[14px] left-1/2 -translate-x-1/2" />
                            <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[20px] left-[calc(50%-5px)] -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[12.4px] left-[calc(50%+8px)] -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[28px] top-[22.4px] left-1/2 -translate-x-1/2" />
                            <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[32.4px] left-[calc(50%-8px)] -translate-x-1/2" />
                        </button>
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
                                        className="font-black text-[32px] xl:text-[36px] 2xl:text-[40px] text-white tracking-[-1px] text-center md:text-left w-full md:max-w-[500px]"
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

            {/* Slide-in menu (hamburger) */}
            {menuOpen && (
                <div className="fixed inset-0 z-[95]">
                    <div className={`absolute inset-0 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-150 ease-out motion-reduce:transition-none ${menuShown ? "opacity-100" : "opacity-0"}`} onClick={closeMenu} />
                    <aside className={`absolute right-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${menuShown ? "translate-x-0" : "translate-x-full"}`}>
                        <div className="flex items-center justify-between border-b border-[#eef1f4] px-5 py-4">
                            <Image src={`${A}/nav/logo.svg`} alt="FundbyText" width={150} height={30} className="h-[26px] w-auto" />
                            <button type="button" onClick={closeMenu} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#003060] transition-colors hover:bg-gray-100">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>
                        <div className="modal-scroll flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                            <button type="button" onClick={donate} className="mb-2 flex items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-[13px] font-black uppercase tracking-[1px] text-white transition-transform hover:scale-[1.02] active:scale-95" style={{ background: "#f47435" }}>
                                Donate to this campaign
                            </button>
                            <MenuLink href={`/campaigns/${slug}`} onClick={closeMenu}>Campaign home</MenuLink>
                            <MenuLink href="/campaigns/create" onClick={closeMenu}>Start your own campaign</MenuLink>
                            <MenuLink href="/how-it-works" onClick={closeMenu}>How it works</MenuLink>
                            <MenuLink href="/about" onClick={closeMenu}>About</MenuLink>
                            <MenuLink href="/" onClick={closeMenu}>Home</MenuLink>
                        </div>
                        <div className="border-t border-[#eef1f4] px-5 py-4">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[1px] text-[#9aa7b8]">Share this campaign</p>
                            {/* Opening the full share modal closes the menu first so the modal isn't hidden behind it. */}
                            <MarketingShare slug={slug} variant="orange" onOpenModal={closeMenu} />
                        </div>
                    </aside>
                </div>
            )}

            {/* Donations-not-live notice (draft / upcoming / completed / paused) */}
            {noticeOpen && donateNotice && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${noticeShown ? "opacity-100" : "opacity-0"}`} onClick={closeNotice}>
                    <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-all duration-200 ease-out motion-reduce:transition-none ${noticeShown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}>
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${theme.accent} 14%, white)` }}>
                            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></svg>
                        </div>
                        <h2 className="text-[18px] font-bold text-[#003060]">{donateNotice.title}</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-[#7e8a96]">{donateNotice.message}</p>
                        <button type="button" onClick={closeNotice} className="mt-6 w-full rounded-[10px] py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110" style={{ background: theme.accent }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
