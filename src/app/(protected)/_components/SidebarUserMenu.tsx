"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SidebarUserMenu({
    firstName,
    lastName,
    photoUrl,
    orgName,
    role,
    isAdmin,
    onEditProfile,
    onChangePassword,
}: {
    firstName: string;
    lastName:  string;
    photoUrl:  string | null;
    orgName:   string | null;
    role?:     string | null;
    isAdmin?:  boolean;
    onEditProfile: () => void;
    onChangePassword: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function handleLogout() {
        if (loggingOut) return;   // the request is already in flight
        setLoggingOut(true);
        try {
            await fetch("/api/v1/auth/logout", { method: "POST" });
        } catch {
            // The cookie may still be set, so don't pretend we're signed out —
            // hand the button back so it can be tried again.
            setLoggingOut(false);
            return;
        }
        router.push("/login");
        router.refresh();
        // Deliberately NOT clearing loggingOut: the button has to keep reading
        // "Signing out…" until the route actually changes, which is the whole
        // point. This component unmounts with the dashboard.
    }

    const initial = firstName[0]?.toUpperCase() ?? "?";
    const fullName = `${firstName} ${lastName}`;

    return (
        <div ref={ref} className="relative">
            {/* Dropdown */}
            {open && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                            {photoUrl && !imgError ? (
                                <Image
                                    src={photoUrl}
                                    alt={fullName}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-sm font-bold text-blue-600">{initial}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            {/* Name gets the full width; the badge sits on its own line
                                below so it can never squeeze/truncate the name. */}
                            <p className="truncate text-sm font-semibold text-gray-900">{fullName}</p>
                            {(isAdmin || orgName) && (
                                <div className="mt-0.5 flex items-center gap-1.5">
                                    {isAdmin && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eef4ff] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0268c0]">
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
                                            Admin
                                        </span>
                                    )}
                                    {orgName && (
                                        <p className="truncate text-xs text-gray-400">{orgName}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Collapse menu"
                            className="-mr-1 ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Menu items — Edit Profile + Log Out use the Figma vuesax icons;
                        Change Password keeps a matching blue lock (Figma has no icon for it). */}
                    <div className="py-1">
                        <button
                            onClick={() => { setOpen(false); onEditProfile(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#005bac] hover:bg-gray-50 transition-colors"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/dashboard/menu-edit.svg" alt="" className="h-5 w-5" />
                            Edit Profile
                        </button>
                        <button
                            onClick={() => { setOpen(false); onChangePassword(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#005bac] hover:bg-gray-50 transition-colors"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/dashboard/menu-lock.svg" alt="" className="h-5 w-5" />
                            Change Password
                        </button>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            aria-busy={loggingOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#005bac] hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
                        >
                            {loggingOut ? (
                                <svg aria-hidden className="h-5 w-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/dashboard/menu-logout.svg" alt="" className="h-5 w-5" />
                            )}
                            {loggingOut ? "Signing out…" : "Log Out"}
                        </button>
                    </div>
                </div>
            )}

            {/* Trigger */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#0268c0]/10 transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-blue-700 border border-blue-500/40 flex items-center justify-center overflow-hidden shrink-0">
                    {photoUrl && !imgError ? (
                        <Image
                            src={photoUrl}
                            alt={fullName}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="text-sm font-bold text-white">{initial}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-[#0268c0] truncate leading-tight">
                        {firstName} {lastName}.
                    </p>
                </div>
                <svg className={`w-4 h-4 text-[#0268c0]/50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );
}
