"use client";

import { useEffect, useState } from "react";

const A_UNDERLINE = "/figma/how-it-works/headline-underline.svg";

// The Figma draws the two lines already broken as "Fundraising" / "Made Simple"
// at every breakpoint, and the underline only ever sits under the second line —
// so the break is explicit here rather than left to wrapping. That also keeps the
// block exactly two lines tall from the very first frame, so the hero video below
// never jumps while the text is still arriving.
const LINE_1 = "Fundraising";
const LINE_2 = "Made Simple";
const TOTAL = LINE_1.length + LINE_2.length;

const GRADIENT = "linear-gradient(131deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)";

// The headline's gradient fill. It sits on each line rather than on the <h1>
// because line two has to be positioned (to anchor the underline), and a
// positioned child paints *after* its ancestor's background-clip:text background
// has already been clipped — so its glyphs would stay transparent with nothing
// behind them, and "Made Simple" would silently vanish while "Fundraising"
// rendered fine. Inking each line independently sidesteps that entirely.
function Ink({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
            {children}
        </span>
    );
}

function Caret() {
    // Figma parks an orange caret after the text — that's the design telling us the
    // headline types itself out. It sets its own colour, so it paints normally
    // rather than being clipped to the gradient.
    return <span className="caret-blink font-normal text-[#f47435]" aria-hidden>|</span>;
}

/**
 * The How It Works hero headline: types "Fundraising Made Simple" out on mount,
 * then draws the green marker stroke in under the second line.
 *
 * Sizes follow the two anchors the frames give us — 32px at 375 and 46px at 768 —
 * and carry on up to the 64px the 1920 board is drawn at, so a laptop isn't
 * shouted at.
 */
export default function TypedHeadline() {
    // null means "not typing" — it renders the finished headline, which is what
    // the server, a no-JS client, and anyone on reduced motion should all get.
    // Typing is the enhancement layered on top.
    const [typed, setTyped] = useState<number | null>(null);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        // Rewinding to 0 is deferred a frame rather than done synchronously here:
        // a sync setState in an effect cascades renders, and this costs nothing —
        // the finished headline is on screen for the one frame before it rewinds.
        let i = 0;
        let tick: ReturnType<typeof setInterval>;
        const raf = requestAnimationFrame(() => {
            setTyped(0);
            tick = setInterval(() => {
                i += 1;
                setTyped(i);
                if (i >= TOTAL) clearInterval(tick);
            }, 55);
        });
        return () => { cancelAnimationFrame(raf); clearInterval(tick); };
    }, []);

    const n = typed ?? TOTAL;
    const t1 = LINE_1.slice(0, Math.min(n, LINE_1.length));
    const t2 = n > LINE_1.length ? LINE_2.slice(0, n - LINE_1.length) : "";
    const onLine2 = n > LINE_1.length;
    const done = n >= TOTAL;

    return (
        <h1 className="font-black text-[32px] sm:text-[38px] md:text-[46px] lg:text-[50px] xl:text-[56px] 2xl:text-[64px] leading-[1.1] tracking-[-1px] text-center pb-[0.12em] w-full">
            {/* The full string stays readable to screen readers and to search — the
                per-character state is decoration. */}
            <span className="sr-only">{LINE_1} {LINE_2}</span>

            <span aria-hidden>
                <span className="block">
                    <Ink>{t1}</Ink>
                    {!onLine2 && <Caret />}
                </span>
                <span className="relative inline-block">
                    {/* The nbsp keeps the second line box alive before its first
                        character lands, so the headline is two lines tall throughout. */}
                    <Ink>{t2 || " "}</Ink>
                    {onLine2 && <Caret />}
                    {done && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={A_UNDERLINE}
                            className="underline-draw absolute left-0 top-full w-full h-[0.26em] mt-[0.05em] rotate-[1.2deg] max-w-none" />
                    )}
                </span>
            </span>
        </h1>
    );
}
