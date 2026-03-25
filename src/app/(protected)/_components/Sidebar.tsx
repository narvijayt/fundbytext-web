import Image from "next/image";
import Link from "next/link";
import type { AuthUser } from "@/lib/session";
import SidebarUserMenu from "./SidebarUserMenu";

export default function Sidebar({ user }: { user: AuthUser }) {
    return (
        <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-gradient-to-b from-[#1a3a6b] to-[#0f2548] px-3 py-5">
            {/* Logo */}
            <div className="px-2 mb-6">
                <Link href="/dashboard">
                    <Image src="/logo.svg" alt="FundByText" width={140} height={42} priority />
                </Link>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 mb-6">
                <Link
                    href="/dashboard/organizations/new"
                    className="flex items-center justify-between w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    Create an Organization
                    <span className="text-lg leading-none">+</span>
                </Link>
                <Link
                    href="/dashboard/campaigns/new"
                    className="flex items-center justify-between w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    New Campaign
                    <span className="text-lg leading-none">+</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                <NavItem href="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
                <NavItem href="/dashboard/organizations" icon={<OrgIcon />} label="My Organizations" />
            </nav>

            {/* User menu */}
            <div className="border-t border-white/10 pt-3">
                <SidebarUserMenu
                    firstName={user.first_name}
                    lastName={user.last_name}
                    photoUrl={user.profile_photo_url}
                />
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
        >
            <span className="w-5 h-5 shrink-0">{icon}</span>
            {label}
        </Link>
    );
}

function DashboardIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function OrgIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}
