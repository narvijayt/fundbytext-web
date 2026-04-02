"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function NewCampaignButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    function handleClick() {
        setLoading(true);
        timerRef.current = setTimeout(() => router.push("/campaigns/create"), 850);
    }

    const overlay = (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <svg style={{ width: 40, height: 40, color: "#f97316" }} className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#4b5563" }}>Setting up your campaign…</p>
        </div>
    );

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white text-sm font-bold rounded-lg transition-colors"
            >
                {loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                ) : (
                    <span className="text-base leading-none">+</span>
                )}
                {loading ? "Loading…" : "Create Campaign"}
            </button>

            {mounted && loading && createPortal(overlay, document.body)}
        </>
    );
}
