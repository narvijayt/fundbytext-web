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
        phone:      string | null;
        role:       "user" | "admin";
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
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
            >
                Edit
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
