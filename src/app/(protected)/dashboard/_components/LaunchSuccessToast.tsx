"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LaunchSuccessToast() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (searchParams.get("launched") === "1") {
            setVisible(true);
            router.replace("/dashboard", { scroll: false });
            const t = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(t);
        }
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-green-600 text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-lg animate-fade-in max-w-xs">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>🎉 Campaign launched successfully!</span>
        </div>
    );
}
