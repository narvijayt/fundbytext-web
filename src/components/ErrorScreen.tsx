import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

const LOGO   = "/assets/marketing/nav/logo.svg";
const MASCOT = "/assets/marketing/shareables/fundbuddy-large.svg";

const ORANGE = "#f47435";

/* Shared, on-brand screen for 404 / 403 (and similar) states. The playful
   code shows the mascot in place of the middle digit. */
export default function ErrorScreen({
    code,
    title,
    message,
    actions,
    accent = "#0268c0",
}: {
    code:      string;
    title:     string;
    message:   ReactNode;
    actions?:  ReactNode;
    accent?:   string;
}) {
    const digits = code.length === 3 ? [code[0], code[2]] : [code, ""];
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fc]">
            {/* soft brand glow */}
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px]" style={{ background: `radial-gradient(60% 60% at 50% -5%, ${accent}26 0%, transparent 72%)` }} />
            {/* faint dot grid, faded toward the edges */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: "radial-gradient(#cdd8e4 1.2px, transparent 1.2px)",
                    backgroundSize: "24px 24px",
                    WebkitMaskImage: "radial-gradient(72% 58% at 50% 34%, #000 0%, transparent 78%)",
                    maskImage: "radial-gradient(72% 58% at 50% 34%, #000 0%, transparent 78%)",
                    opacity: 0.6,
                }}
            />

            <header className="relative z-10 px-6 py-5 sm:px-10 sm:py-6">
                <Link href="/" aria-label="FundByText home" className="inline-flex">
                    <Image src={LOGO} alt="FundByText" width={170} height={33} className="h-[28px] w-auto sm:h-[32px]" priority />
                </Link>
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
                <div className="flex max-w-xl flex-col items-center text-center">
                    {/* Code with the mascot as the middle character */}
                    <div className="flex items-center justify-center gap-1 sm:gap-3">
                        <Digit accent={accent}>{digits[0]}</Digit>
                        <span className="w-[92px] sm:w-[132px]">
                            <Image src={MASCOT} alt="" width={132} height={166} className="h-auto w-full drop-shadow-[0px_18px_28px_rgba(20,65,109,0.18)]" />
                        </span>
                        <Digit accent={accent}>{digits[1]}</Digit>
                    </div>

                    <h1 className="mt-6 text-[26px] font-black tracking-[-0.6px] text-[#003060] sm:text-[34px]">{title}</h1>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5b6b7c] sm:text-[16px]">{message}</p>

                    <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                        {actions ?? (
                            <>
                                <PrimaryLink href="/">Back to home</PrimaryLink>
                                <SecondaryLink href="/campaigns/create">Start a campaign</SecondaryLink>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Digit({ children, accent }: { children: ReactNode; accent: string }) {
    if (!children) return null;
    return (
        <span
            className="bg-clip-text font-black leading-none tracking-[-6px] text-transparent text-[108px] sm:text-[150px]"
            style={{ backgroundImage: `linear-gradient(180deg, ${accent} 0%, #003060 100%)` }}
        >
            {children}
        </span>
    );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-bold text-white shadow-[0px_16px_28px_-12px_rgba(244,116,53,0.6)] transition-transform hover:scale-[1.02] active:scale-95 sm:w-auto"
            style={{ background: ORANGE }}
        >
            {children}
        </Link>
    );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#d9e2ec] bg-white px-6 py-3 text-[14px] font-bold text-[#003060] transition-colors hover:bg-[#f1f5f9] sm:w-auto"
        >
            {children}
        </Link>
    );
}
