"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type State = "verifying" | "success" | "error";

// Same card chrome as the other (auth) cards (login / forgot / reset): 502px white
// rounded-[24px] panel with the soft blue-navy drop shadow, sitting on the shared
// hero backdrop the layout provides. Only the contents differ per state.
const CARD =
    "w-full max-w-[502px] bg-white border border-[#eaeef3] rounded-[24px] p-6 sm:p-10 lg:p-14 flex flex-col items-center text-center gap-6 sm:gap-7 shadow-[0_30px_60px_-20px_rgba(0,48,96,0.25)]";

export default function VerifyEmailClient() {
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";
    const [state, setState] = useState<State>("verifying");
    const [message, setMessage] = useState("");
    // Guard against React StrictMode double-invoke consuming the token twice.
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;
        const fail = (m: string) => { setState("error"); setMessage(m); };
        // The missing-link case dispatches on the next frame, not synchronously in
        // the effect — a sync setState here trips react-hooks/set-state-in-effect
        // (and cascades a render). The fetch branch's setState calls already run in
        // promise callbacks, so they're deferred and fine.
        if (!token || !email) {
            const raf = requestAnimationFrame(() => fail("This verification link is missing information."));
            return () => cancelAnimationFrame(raf);
        }
        fetch("/api/v1/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email }),
        })
            .then(async (r) => {
                const d = await r.json().catch(() => ({}));
                if (r.ok) { setState("success"); setMessage(d.message ?? "Your email address has been confirmed. You're all set."); }
                else { fail(d.error ?? "This verification link is invalid or has expired."); }
            })
            .catch(() => fail("Something went wrong. Please try again."));
    }, [token, email]);

    return (
        <div className={CARD}>
            {state === "verifying" && (
                <>
                    <StatusIcon tone="blue">
                        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                    </StatusIcon>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-black text-[#003060] text-[24px] sm:text-[30px] leading-[1.15] tracking-[-0.5px]">
                            Verifying your email…
                        </h1>
                        <p className="font-medium text-[#51607a] text-[14px] sm:text-[16px] leading-[1.5]">
                            This will only take a moment.
                        </p>
                    </div>
                </>
            )}

            {state === "success" && (
                <>
                    <StatusIcon tone="green">
                        <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    </StatusIcon>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-black text-[#003060] text-[24px] sm:text-[30px] leading-[1.15] tracking-[-0.5px]">
                            Email verified
                        </h1>
                        <p className="font-medium text-[#51607a] text-[14px] sm:text-[16px] leading-[1.5]">
                            {message}
                        </p>
                    </div>
                    {/* Orange primary — same button language as the auth forms' submit. */}
                    <Link
                        href="/dashboard"
                        className="w-full h-12 sm:h-14 flex items-center justify-center rounded-[16px] bg-[#f47435] text-white font-black text-[13px] sm:text-sm tracking-[1px] uppercase shadow-[0px_20px_20px_-14px_rgba(234,103,37,0.2),0px_20px_40px_-16px_rgba(244,116,53,0.2)] hover:brightness-105 transition"
                    >
                        Go to Dashboard
                    </Link>
                </>
            )}

            {state === "error" && (
                <>
                    <StatusIcon tone="red">
                        <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5M12 16.5h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    </StatusIcon>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-black text-[#003060] text-[24px] sm:text-[30px] leading-[1.15] tracking-[-0.5px]">
                            Verification failed
                        </h1>
                        <p className="font-medium text-[#51607a] text-[14px] sm:text-[16px] leading-[1.5]">
                            {message}
                        </p>
                        <p className="font-medium text-[#9aa7b8] text-[13px] sm:text-[14px] leading-[1.5]">
                            You can request a new link from the Edit Profile screen.
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="w-full h-12 sm:h-14 flex items-center justify-center rounded-[16px] border border-[#d4dee7] bg-white text-[#003060] font-black text-[13px] sm:text-sm tracking-[1px] uppercase hover:bg-[#f6f8fa] transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </>
            )}
        </div>
    );
}

// The status disc — a 64/72px gradient circle in the state's tone, echoing the
// FlagGlyph disc that heads the auth cards. Its child is the icon/spinner.
function StatusIcon({ tone, children }: { tone: "blue" | "green" | "red"; children: React.ReactNode }) {
    const gradient = {
        blue:  "linear-gradient(180deg,#2f9bf2,#0268c0)",
        green: "linear-gradient(180deg,#3ad06f,#28c45d)",
        red:   "linear-gradient(180deg,#ff6b6b,#e5484d)",
    }[tone];
    const glow = {
        blue:  "0px 18px 30px -12px rgba(2,104,192,0.5)",
        green: "0px 18px 30px -12px rgba(40,196,93,0.5)",
        red:   "0px 18px 30px -12px rgba(229,72,77,0.45)",
    }[tone];
    return (
        <span
            className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-full"
            style={{ backgroundImage: gradient, boxShadow: glow }}
        >
            {children}
        </span>
    );
}
