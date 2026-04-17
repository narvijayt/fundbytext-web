"use client";

import { useState } from "react";
import CreateUserModal from "./CreateUserModal";

export default function CreateUserButton() {
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0268c0] hover:bg-[#0268c0]/90 text-white text-sm font-semibold rounded-xl transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create User
            </button>

            {open && <CreateUserModal onClose={() => setOpen(false)} onSaved={handleSaved} />}

            {toast && (
                <div className="fixed bottom-6 right-6 z-100 flex items-center gap-3 bg-green-600 text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-lg max-w-xs">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>User created successfully.</span>
                </div>
            )}
        </>
    );
}
