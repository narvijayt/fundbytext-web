"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import SidebarUserMenu from "./SidebarUserMenu";
import SidebarCampaignsDropdown from "./SidebarCampaignsDropdown";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

const GRADIENT = "linear-gradient(to bottom, #0268c0 0%, #ffffff 28%, #ffffff 100%)";

type Campaign = { slug: string; name: string | null; campaign_type: string; coverImageUrl: string | null; isOrganizer: boolean; isParticipant: boolean };

export type SidebarData = {
    campaigns: Campaign[];
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    orgName: string | null;
    role: string | null;
    isAdmin: boolean;
    unreadContacts: number;
};

// ── Icons — Dashboard/My-Campaigns are the exact Figma (vuesax) paths ─────────
const HomeIcon = (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="none" stroke="currentColor">
        <path strokeWidth={1.5} d="M7.78549 3.02344C8.7217 2.29929 10.2277 2.21939 11.2679 2.81152L11.4701 2.93848L16.2699 6.29688C16.607 6.5329 16.9451 6.93633 17.1996 7.42383C17.454 7.9113 17.5921 8.41941 17.5921 8.83301V14.4824C17.5921 16.1932 16.2023 17.583 14.4915 17.583H5.50815C3.79971 17.5828 2.40864 16.1873 2.40854 14.4746V8.72461C2.40854 8.34295 2.5327 7.86044 2.76498 7.38867C2.99704 6.91749 3.30541 6.5211 3.61166 6.28223L7.78647 3.02441L7.78549 3.02344ZM10.0003 11.124C9.24459 11.124 8.62555 11.7433 8.62534 12.499V14.999C8.62534 15.7549 9.24446 16.374 10.0003 16.374C10.7562 16.374 11.3753 15.7549 11.3753 14.999V12.499C11.3751 11.7905 10.8308 11.2025 10.14 11.1318L10.0003 11.124Z" />
    </svg>
);
const FlagIcon = (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.2916 1.66602V18.3327" />
        <path d="M4.2916 3.33398H13.6249C15.8749 3.33398 16.3749 4.58398 14.7916 6.16732L13.7916 7.16732C13.1249 7.83398 13.1249 8.91732 13.7916 9.50065L14.7916 10.5007C16.3749 12.084 15.7916 13.334 13.6249 13.334H4.2916" />
    </svg>
);
function AdminIcon({ d }: { d: string }) {
    return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} /></svg>;
}
const ADMIN = [
    { href: "/admin", label: "Overview", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { href: "/admin/users", label: "Users", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { href: "/admin/campaigns", label: "Campaigns", d: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
    { href: "/admin/donations", label: "Donations", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/admin/organizations", label: "Organizations", d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { href: "/admin/contact", label: "Contact", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

function NavLink({ href, icon, label, compact, badge, onNavigate }: {
    href: string; icon: ReactNode; label: string; compact?: boolean; badge?: number; onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const active = href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
    const color = active ? "text-[#005bac]" : "text-[#003060]";
    return (
        <Link
            href={href}
            onClick={onNavigate}
            title={compact ? label : undefined}
            className={`flex items-center rounded-xl transition-colors hover:bg-[#0268c0]/8 ${color} ${
                compact ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2"
            }`}
        >
            <span className="shrink-0">{icon}</span>
            {!compact && <span className="flex-1 text-[15px] font-medium leading-none">{label}</span>}
            {!compact && badge ? (
                <span className="min-w-[18px] rounded-full bg-[#f47435] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{badge}</span>
            ) : null}
        </Link>
    );
}

function NewCampaign({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
    const router = useRouter();
    function go() { onNavigate?.(); router.push("/campaigns/create"); }
    if (compact) {
        return (
            <button onClick={go} aria-label="New Campaign" title="New Campaign" className="flex h-11 w-11 items-center justify-center rounded-[14px] text-white" style={{ background: "linear-gradient(180deg,#ff8c53 0%,#f47435 100%)" }}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
        );
    }
    return (
        <button onClick={go} className="flex w-full items-center overflow-hidden rounded-[14px] pr-0.5 text-white" style={{ background: "linear-gradient(180deg,#ff8c53 0%,#f47435 100%)" }}>
            <span className="flex-1 py-2.5 text-center text-[14px] font-medium leading-[1.4]">New Campaign</span>
            <span className="flex h-11 w-11 items-center justify-center border-l border-white/[0.12]">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
        </button>
    );
}

// ── Full content (lg aside + mobile drawer) ──────────────────────────────────
function FullContent({ data, onNavigate, desktop, onEditProfile, onChangePassword }: { data: SidebarData; onNavigate?: () => void; desktop?: boolean; onEditProfile: () => void; onChangePassword: () => void }) {
    return (
        <>
            {/* Browser: centered + slightly smaller. Mobile drawer: left-aligned. */}
            <div className={`mb-6 px-5 pt-6 ${desktop ? "flex justify-center" : ""}`}>
                <Link href="/dashboard" onClick={onNavigate} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/dashboard/sidebar-logo.svg" alt="FundbyText" className={`w-auto ${desktop ? "h-8" : "h-9"}`} />
                </Link>
            </div>
            <div className="mb-6 px-5"><NewCampaign onNavigate={onNavigate} /></div>
            <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <NavLink href="/dashboard" icon={HomeIcon} label="Dashboard" onNavigate={onNavigate} />
                <div className="border-t border-gray-100" />
                <SidebarCampaignsDropdown campaigns={data.campaigns} />
                {data.isAdmin && (
                    <>
                        <div className="border-t border-gray-100" />
                        <div className="space-y-1">
                            {ADMIN.map((a) => (
                                <NavLink key={a.href} href={a.href} icon={<AdminIcon d={a.d} />} label={a.label} onNavigate={onNavigate} badge={a.href === "/admin/contact" ? data.unreadContacts : undefined} />
                            ))}
                        </div>
                    </>
                )}
            </nav>
            <div className="px-5 pb-5 pt-4">
                <SidebarUserMenu firstName={data.firstName} lastName={data.lastName} photoUrl={data.photoUrl} orgName={data.orgName} role={data.role} onEditProfile={onEditProfile} onChangePassword={onChangePassword} />
            </div>
        </>
    );
}

// ── Icon rail (tablet) — collapsed; logo F, +, icons, avatar, and an expand (→)
// button that opens the full sidebar as an overlay (so the campaign dropdown fits).
function RailContent({ data, onExpand, onEditProfile }: { data: SidebarData; onExpand: () => void; onEditProfile: () => void }) {
    const initial = (data.firstName?.[0] ?? "?").toUpperCase();
    return (
        <>
            <Link href="/dashboard" className="mb-6 mt-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/campaigns/app-logo.svg" alt="FundbyText" className="h-9 w-auto" />
            </Link>
            <div className="mb-6 flex justify-center"><NewCampaign compact /></div>
            <nav className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <NavLink href="/dashboard" icon={HomeIcon} label="Dashboard" compact />
                <button onClick={onExpand} title="My Campaigns" aria-label="My Campaigns" className="flex h-11 w-11 items-center justify-center rounded-xl text-[#003060] transition-colors hover:bg-[#0268c0]/8">
                    {FlagIcon}
                </button>
                {data.isAdmin && (
                    <>
                        <div className="my-2 h-px w-8 bg-gray-200" />
                        {ADMIN.map((a) => <NavLink key={a.href} href={a.href} icon={<AdminIcon d={a.d} />} label={a.label} compact />)}
                    </>
                )}
            </nav>
            <div className="flex flex-col items-center gap-3 py-5">
                <button onClick={onEditProfile} title={`${data.firstName} ${data.lastName}`} aria-label="Edit profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#aed9fe] text-[16px] font-bold text-[#0268c0]">
                    {data.photoUrl ? <Image src={data.photoUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : initial}
                </button>
                <button onClick={onExpand} aria-label="Expand sidebar" title="Expand menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0268c0] text-white shadow-sm transition-transform hover:scale-105">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
            </div>
        </>
    );
}

// Live unread-contacts count: starts from the server value, updates instantly when
// the admin marks a submission read/unread (the contact table broadcasts the new
// count via an `admin:contacts-unread` event) and re-syncs on fresh server data.
function useLiveUnreadContacts(serverValue: number) {
    const [override, setOverride] = useState<number | null>(null);
    const [seenServer, setSeenServer] = useState(serverValue);
    // Drop the local override whenever the server provides a fresh count — the
    // recommended "adjust state during render" pattern (no effect, no cascade).
    if (serverValue !== seenServer) {
        setSeenServer(serverValue);
        setOverride(null);
    }
    useEffect(() => {
        function onEvt(e: Event) { setOverride((e as CustomEvent<number>).detail); }
        window.addEventListener("admin:contacts-unread", onEvt);
        return () => window.removeEventListener("admin:contacts-unread", onEvt);
    }, []);
    return override ?? serverValue;
}

// ── Responsive shell ─────────────────────────────────────────────────────────
export default function SidebarChrome({ data }: { data: SidebarData }) {
    const [open, setOpen] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const openEditProfile = () => { setOpen(false); setEditProfileOpen(true); };
    const openChangePassword = () => { setOpen(false); setChangePasswordOpen(true); };
    const liveData: SidebarData = { ...data, unreadContacts: useLiveUnreadContacts(data.unreadContacts) };
    const pathname = usePathname();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile drawer on route change
    useEffect(() => { setOpen(false); }, [pathname]);
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Browser (lg+): full sidebar */}
            <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen" style={{ background: GRADIENT }}>
                <FullContent data={liveData} desktop onEditProfile={openEditProfile} onChangePassword={openChangePassword} />
            </aside>

            {/* Tablet (md–lg): icon rail; the → button expands to the full sidebar */}
            <aside className="hidden md:flex lg:hidden w-[72px] shrink-0 flex-col h-screen" style={{ background: GRADIENT }}>
                <RailContent data={liveData} onExpand={() => setOpen(true)} onEditProfile={openEditProfile} />
            </aside>

            <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e9eb] bg-white px-4 md:hidden">
                {/* logo-main.svg has ~36px of baked-in left whitespace in its viewBox; pull it flush to the px-4 gutter (Figma: logo at x=16) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Link href="/dashboard" className="overflow-hidden"><img src="/logo-main.svg" alt="FundbyText" className="-ml-9 h-8 w-auto max-w-none" /></Link>
                <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#003060] hover:bg-[#0268c0]/8">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col shadow-2xl" style={{ background: GRADIENT }}>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-[#003060] hover:bg-[#0268c0]/8">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                        <FullContent data={liveData} onNavigate={() => setOpen(false)} onEditProfile={openEditProfile} onChangePassword={openChangePassword} />
                    </aside>
                </div>
            )}

            {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
            {changePasswordOpen && <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />}
        </>
    );
}
