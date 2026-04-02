"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SidebarUserMenu({
    firstName,
    lastName,
    photoUrl,
}: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
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
                        </div>
                        <svg className="ml-auto w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        <Link
                            href="/dashboard/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Profile
                        </Link>
                        <Link
                            href="/dashboard/change-password"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Change Password
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log Out
                        </button>
                    </div>
                </div>
            )}

            {/* Trigger */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden shrink-0">
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
                        <span className="text-sm font-bold text-blue-700">{initial}</span>
                    )}
                </div>
                <span className="text-sm font-medium text-white truncate">
                    {firstName} {lastName[0]}.
                </span>
                <svg className="ml-auto w-4 h-4 text-white/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );
}
