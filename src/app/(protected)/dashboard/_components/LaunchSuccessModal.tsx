"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const GREEN = "linear-gradient(76.24deg, #26BA58 1.19%, #34D56A 98.81%)";

/* Shown once after a campaign is launched (?launched=1) — a celebratory
   confirmation in place of a toast. */
export default function LaunchSuccessModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [open, setOpen]   = useState(false);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (searchParams.get("launched") === "1") {
            setOpen(true);
            router.replace("/dashboard", { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() { setShown(false); window.setTimeout(() => setOpen(false), 200); }

    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm overflow-hidden rounded-[20px] bg-white p-7 text-center shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)] transition-all duration-200 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
            >
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0px_16px_28px_-12px_rgba(38,186,88,0.6)]" style={{ background: GREEN }}>
                    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <h2 className="text-[22px] font-black text-[#003060]">Campaign launched! 🎉</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5b6b7c]">Your campaign is now live and ready to receive donations — share it far and wide!</p>
                <button
                    type="button"
                    onClick={close}
                    className="mt-6 w-full rounded-[12px] py-3 text-[14px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
                    style={{ background: GREEN }}
                >
                    Awesome!
                </button>
            </div>
        </div>
    );
}
