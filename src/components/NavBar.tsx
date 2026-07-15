"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


const A_NAV_MENU   = "/figma/nav-menu.svg";
const A_NAV_SEARCH = "/figma/nav-search.svg";
const A_NAV_USER   = "/figma/nav-user.svg";
const A_LOGO_MAIN  = "/logo-main.svg";

const NAV_ITEMS = [
    { href: "/",             label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "#",             label: "Browse Campaigns" },
    { href: "#",             label: "FAQs" },
    { href: "#",             label: "Resources" },
    { href: "/about",        label: "About Us" },
    { href: "#",             label: "Help & Support" },
];

export default function NavBar({ user }: { user: { id: string } | null }) {
    const [menuOpen, setMenuOpen] = useState(false);
    // Slide/fade the drawer the same way the public campaign page's menu does:
    // mount first, then flip `menuShown` on the next frame so the transition runs.
    const [menuShown, setMenuShown] = useState(false);
    function closeMenu() { setMenuShown(false); window.setTimeout(() => setMenuOpen(false), 200); }
    useEffect(() => {
        if (!menuOpen) return;
        const raf = requestAnimationFrame(() => setMenuShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeMenu(); }
        window.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    }, [menuOpen]);

    return (
        <>
            <nav className="sticky top-0 z-50 drop-shadow-[0_4px_15px_rgba(0,91,172,0.08)]">
                {/* ── Mobile Nav (< md) ──
                    Figma "nav-top" (375×88): logo hard LEFT at 24px (166×32) and a
                    single 102×48 MENU pill hard RIGHT at 24px. There is deliberately
                    no third action — sign-in and the CTA live inside the menu overlay. */}
                <div className="flex md:hidden items-center justify-between px-6 py-5">
                    <Link href="/">
                        {/* Same mark as the desktop nav, at the Figma's mobile size:
                            the cropped logo is 163×32, so height 32 lands on the
                            166×32 box the design allots it. */}
                        <img alt="FundByText" src={A_LOGO_MAIN} style={{ height: 32, width: "auto", display: "block" }} />
                    </Link>

                    <button
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        className="flex h-12 items-center gap-2.5 px-3.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 active:bg-white/20"
                    >
                        <img alt="" src={A_NAV_MENU} width={22} height={15} style={{ display: "block" }} />
                        <span className="font-black text-white text-xs tracking-[1px] uppercase">Menu</span>
                    </button>
                </div>

                {/* ── Full Nav (md+) ──
                    The Figma tablet frame (768×88) already carries the full three-part
                    nav — Menu+Search / centred logo / Sign In + Start — so it starts at
                    md, not lg. Padding matches the Figma's 24px gutter at tablet. */}
                <div className="hidden md:flex items-center justify-between px-6 lg:px-10 xl:px-16 py-5 relative">
                    {/* Left */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={menuOpen}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors shrink-0"
                        >
                            <img alt="" src={A_NAV_MENU} width={22} height={15} style={{ display: "block" }} />
                            <span className="font-black text-white text-xs tracking-[1px] uppercase">Menu</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0">
                            <img alt="" src={A_NAV_SEARCH} width={16} height={16} style={{ display: "block" }} />
                            <span className="font-black text-white text-xs tracking-[1px] uppercase">Search</span>
                        </button>
                    </div>

                    {/* Center: Logo */}
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                        <img alt="FundByText" src={A_LOGO_MAIN} height={28} style={{ height: 28, width: "auto", display: "block" }} />
                    </Link>

                    {/* Right: Auth */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        {user ? (
                            <Link href="/dashboard"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors shrink-0">
                                <img alt="" src={A_NAV_USER} width={16} height={16} style={{ display: "block" }} />
                                <span className="font-black text-white text-xs tracking-[1px] uppercase whitespace-nowrap">My Dashboard</span>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0">
                                    <img alt="" src={A_NAV_USER} width={16} height={16} style={{ display: "block" }} />
                                    <span className="font-black text-white text-xs tracking-[1px] uppercase whitespace-nowrap">Sign In</span>
                                </Link>
                                <Link href="/campaigns/create"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors shrink-0">
                                    <span className="font-black text-white text-xs tracking-[1px] uppercase whitespace-nowrap">Start A Campaign</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Menu drawer (all sizes) ──
                Same construction as the public campaign page's menu (MarketingHero):
                a dimmed backdrop plus a 300px white panel sliding in from the right.
                The options are unchanged — only the presentation matches. */}
            {menuOpen && (
                <div className="fixed inset-0 z-[100]">
                    <div
                        className={`absolute inset-0 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-150 ease-out motion-reduce:transition-none ${menuShown ? "opacity-100" : "opacity-0"}`}
                        onClick={closeMenu}
                    />
                    <aside className={`absolute right-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${menuShown ? "translate-x-0" : "translate-x-full"}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#eef1f4] px-5 py-4 shrink-0">
                            <img alt="FundByText" src={A_LOGO_MAIN} style={{ height: 26, width: "auto", display: "block" }} />
                            <button
                                onClick={closeMenu}
                                aria-label="Close menu"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#003060] transition-colors hover:bg-gray-100"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </div>

                        {/* User */}
                        <div className="px-4 pt-4 shrink-0">
                            <Link
                                href={user ? "/dashboard" : "/login"}
                                onClick={closeMenu}
                                className="flex items-center gap-3 rounded-[12px] border border-[#eef1f4] bg-[#f4f8f9] px-4 py-3 transition-colors hover:bg-[#eef4f9]"
                            >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#eef1f4] bg-white">
                                    <svg className="h-4 w-4 text-[#0268c0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-black leading-tight text-[#003060]">
                                        {user ? "My Account" : "Sign In"}
                                    </span>
                                    <span className="truncate text-xs leading-tight text-[#7e8a96]">
                                        {user ? "Go to your dashboard" : "Access your campaigns"}
                                    </span>
                                </span>
                            </Link>
                        </div>

                        {/* Links */}
                        <nav className="modal-scroll flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-[15px] font-semibold text-[#003060] transition-colors hover:bg-[#f4f8f9]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* CTAs */}
                        <div className="flex shrink-0 flex-col gap-2 border-t border-[#eef1f4] p-4">
                            {user ? (
                                <Link href="/dashboard" onClick={closeMenu}
                                    className="flex w-full items-center justify-center rounded-[12px] py-3 text-[13px] font-black uppercase tracking-[1px] text-white transition-transform hover:scale-[1.02] active:scale-95"
                                    style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                    My Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/campaigns/create" onClick={closeMenu}
                                        className="flex w-full items-center justify-center rounded-[12px] py-3 text-[13px] font-black uppercase tracking-[1px] text-white transition-transform hover:scale-[1.02] active:scale-95"
                                        style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                        Get Started for Free
                                    </Link>
                                    <Link href="/login" onClick={closeMenu}
                                        className="flex w-full items-center justify-center rounded-[12px] border border-[#d4dee7] py-3 text-[13px] font-black uppercase tracking-[1px] text-[#003060] transition-colors hover:bg-[#f4f8f9]">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
