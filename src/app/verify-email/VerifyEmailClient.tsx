"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type State = "verifying" | "success" | "error";

export default function VerifyEmailClient() {
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";
    const [state, setState] = useState<State>("verifying");
    const [message, setMessage] = useState("");
    // Guard against React 18 StrictMode double-invoke consuming the token twice.
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;
        if (!token || !email) { setState("error"); setMessage("This verification link is missing information."); return; }
        fetch("/api/v1/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email }),
        })
            .then(async (r) => {
                const d = await r.json().catch(() => ({}));
                if (r.ok) { setState("success"); setMessage(d.message ?? "Your email has been verified."); }
                else { setState("error"); setMessage(d.error ?? "This verification link is invalid or has expired."); }
            })
            .catch(() => { setState("error"); setMessage("Something went wrong. Please try again."); });
    }, [token, email]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#eaf0f7] p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(0,48,96,0.22)]">
                <div className="flex items-center justify-center bg-gradient-to-br from-[#0268c0] to-[#003060] py-7">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-main.svg" alt="FundbyText" className="h-7 w-auto" />
                </div>

                <div className="px-8 py-10 text-center">
                    {state === "verifying" && (
                        <>
                            <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-[3px] border-[#0268c0] border-t-transparent" />
                            <h1 className="text-[20px] font-black text-[#003060]">Verifying your email…</h1>
                            <p className="mt-2 text-[14px] text-[#7e8a96]">This will only take a moment.</p>
                        </>
                    )}

                    {state === "success" && (
                        <>
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#eafaf1]">
                                <svg className="h-7 w-7 text-[#28c45d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                            </div>
                            <h1 className="text-[20px] font-black text-[#003060]">Email verified</h1>
                            <p className="mt-2 text-[14px] leading-relaxed text-[#7e8a96]">{message}</p>
                            <Link href="/dashboard" className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#0268c0] px-6 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110">
                                Go to Dashboard
                            </Link>
                        </>
                    )}

                    {state === "error" && (
                        <>
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                            </div>
                            <h1 className="text-[20px] font-black text-[#003060]">Verification failed</h1>
                            <p className="mt-2 text-[14px] leading-relaxed text-[#7e8a96]">{message}</p>
                            <p className="mt-4 text-[13px] text-[#9aa7b8]">You can request a new link from the Edit Profile screen.</p>
                            <Link href="/dashboard" className="mt-6 inline-flex items-center justify-center rounded-[10px] border border-[#d4dee7] px-6 py-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50">
                                Back to Dashboard
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
