"use client";

import { useState } from "react";
import EditUserModal from "./EditUserModal";

interface Props {
    userId: string;
    isSelf: boolean;
    initial: {
        first_name: string;
        last_name:  string;
        email:      string;
        username:   string | null;
        phone:      string | null;
        role:       "user" | "admin";
        profile_photo_url: string | null;
        is_email_verified: boolean;
        is_phone_verified: boolean;
    };
}

export default function EditUserButton({ userId, isSelf, initial }: Props) {
    const [open,  setOpen]  = useState(false);
    const [toast, setToast] = useState(false);

    function handleSaved() {
        setToast(true);
        setTimeout(() => setToast(false), 4000);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7e9eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50"
            >
                <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit Profile
            </button>

            {open && (
                <EditUserModal
                    userId={userId}
                    isSelf={isSelf}
                    initial={initial}
                    onClose={() => setOpen(false)}
                    onSaved={handleSaved}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-100 flex items-center gap-3 bg-green-600 text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-lg max-w-xs">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>User updated successfully.</span>
                </div>
            )}
        </>
    );
}
