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
    onEditProfile,
    onChangePassword,
}: {
    firstName: string;
    lastName:  string;
    photoUrl:  string | null;
    orgName:   string | null;
    role?:     string | null;
    onEditProfile: () => void;
    onChangePassword: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
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
        await fetch("/api/v1/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
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
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                            {orgName && (
                                <p className="text-xs text-gray-400 truncate">{orgName}</p>
                            )}
                        </div>
                        <svg className="ml-auto w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#005bac] hover:bg-gray-50 transition-colors"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/dashboard/menu-logout.svg" alt="" className="h-5 w-5" />
                            Log Out
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
                <svg className="w-4 h-4 text-[#0268c0]/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );
}
