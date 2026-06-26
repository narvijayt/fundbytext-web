"use client";

import Link from "next/link";
import { useState } from "react";


const A_NAV_MENU   = "/figma/nav-menu.svg";
const A_NAV_SEARCH = "/figma/nav-search.svg";
const A_NAV_USER   = "/figma/nav-user.svg";
const A_LOGO_MAIN  = "/logo-main.svg";

export default function NavBar({ user }: { user: { id: string } | null }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <nav className="sticky top-0 z-50 drop-shadow-[0_4px_15px_rgba(0,91,172,0.08)]">
                {/* ── Mobile Nav ── */}
                <div className="flex lg:hidden items-center justify-between px-4 py-4">
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 active:bg-white/20"
                    >
                        <img alt="" src={A_NAV_MENU} width={22} height={15} style={{ display: "block" }} />
                        <span className="font-black text-white text-xs tracking-[1px] uppercase">Menu</span>
                    </button>

                    <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                        <img alt="FundByText" src={A_LOGO_MAIN} height={22} style={{ height: 22, width: "auto", display: "block" }} />
                    </Link>

                    {user ? (
                        <Link href="/dashboard"
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20">
                            <img alt="" src={A_NAV_USER} width={14} height={14} style={{ display: "block" }} />
                            <span className="font-black text-white text-[10px] tracking-[1px] uppercase whitespace-nowrap">Dashboard</span>
                        </Link>
                    ) : (
                        <Link href="/campaigns/create"
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20">
                            <span className="font-black text-white text-[10px] tracking-[1px] uppercase whitespace-nowrap">Start</span>
                        </Link>
                    )}
                </div>

                {/* ── Desktop Nav ── */}
                <div className="hidden lg:flex items-center justify-between px-10 xl:px-16 py-5 relative">
                    {/* Left */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl backdrop-blur-[40px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors shrink-0">
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

            {/* ── Mobile Menu Overlay ── */}
            {menuOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#003060" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
                        <img alt="FundByText" src={A_LOGO_MAIN} height={28} style={{ height: 28, width: "auto", display: "block" }} />
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="flex-1 overflow-y-auto px-5 py-4">
                        <ul>
                            {[
                                { href: "/",              label: "Home" },
                                { href: "/how-it-works",  label: "How It Works" },
                                { href: "#",              label: "Browse Campaigns" },
                                { href: "#",              label: "FAQs" },
                                { href: "#",              label: "Resources" },
                                { href: "/about",         label: "About Us" },
                                { href: "#",              label: "Help & Support" },
                            ].map(item => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center py-4 border-b border-white/10 text-white font-black text-xl"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* CTAs */}
                    <div className="px-5 pb-10 pt-4 flex flex-col gap-3 shrink-0">
                        {user ? (
                            <Link href="/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center w-full py-4 rounded-[20px] text-white font-black text-sm tracking-[1px] uppercase"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/campaigns/create"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-center w-full py-4 rounded-[20px] text-white font-black text-sm tracking-[1px] uppercase"
                                    style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                    Get Started for Free
                                </Link>
                                <Link href="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-center w-full py-4 rounded-[20px] text-white/70 font-black text-sm tracking-[1px] uppercase border border-white/20">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
