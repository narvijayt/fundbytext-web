"use client";

import { useEffect, useRef, useState } from "react";

const A_UNDERLINE = "/figma/how-it-works/headline-underline.svg";

const GRADIENT = "linear-gradient(138deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)";

// The word after "Effortless Fundraising for" cycles through the kinds of people
// who fundraise here. "Sports Teams" leads because that's what the Figma shows.
const WORDS = ["Sports Teams", "Schools", "Churches", "Nonprofits", "Clubs"];
const LONGEST = WORDS.reduce((a, b) => (b.length > a.length ? b : a), "");

// Typing rhythm (ms).
const TYPE = 90;
const DELETE = 45;
const HOLD = 1400;

function Ink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    // The gradient rides on each text span rather than the <h1>: the rotating word
    // is positioned (to anchor the underline), and a positioned child paints after
    // its ancestor's background-clip:text has been clipped — so inking per-span is
    // what keeps the words from turning transparent.
    return (
        <span className={`bg-clip-text text-transparent ${className}`} style={{ backgroundImage: GRADIENT }}>
            {children}
        </span>
    );
}

/**
 * Hero headline: "Effortless Fundraising for <word>", where <word> types itself
 * out, holds, deletes, and moves to the next — with the Figma's orange caret and
 * a green marker underline that tracks the current word. Reduced motion and the
 * server render both show the first word, fully typed.
 *
 * The rotating slot reserves the widest word's width (an invisible sizer) so the
 * line never reflows as the word changes; the visible word is centered over it and
 * the underline sits under just the letters that are currently shown.
 */
export default function HeroRotatingHeadline() {
    const [text, setText] = useState(WORDS[0]);
    const [animate, setAnimate] = useState(false);

    // Refs drive the loop so the interval callback never goes stale.
    const wordRef = useRef(0);
    const charRef = useRef(WORDS[0].length);
    const deletingRef = useRef(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let timer: ReturnType<typeof setTimeout>;
        // Deferred a frame — a synchronous setState inside an effect cascades renders.
        const raf = requestAnimationFrame(() => setAnimate(true));
        const tick = () => {
            const word = WORDS[wordRef.current];
            if (!deletingRef.current) {
                charRef.current += 1;
                setText(word.slice(0, charRef.current));
                if (charRef.current >= word.length) {
                    deletingRef.current = true;
                    timer = setTimeout(tick, HOLD);
                    return;
                }
                timer = setTimeout(tick, TYPE);
            } else {
                charRef.current -= 1;
                setText(word.slice(0, Math.max(0, charRef.current)));
                if (charRef.current <= 0) {
                    deletingRef.current = false;
                    wordRef.current = (wordRef.current + 1) % WORDS.length;
                }
                timer = setTimeout(tick, charRef.current <= 0 ? TYPE : DELETE);
            }
        };
        // Kick off by deleting the first (server-rendered) word.
        deletingRef.current = true;
        timer = setTimeout(tick, HOLD);
        return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    }, []);

    return (
        <h1 className="font-black text-[30px] sm:text-[36px] md:text-[42px] lg:text-[48px] xl:text-[56px] 2xl:text-[64px] leading-[1.15] tracking-[-1px] text-center pb-[0.08em] w-full">
            <Ink>Effortless Fundraising for </Ink>
            {/* Rotating slot — sizer reserves the widest word so the line can't jump. */}
            <span className="relative inline-block align-bottom">
                <span className="invisible whitespace-nowrap" aria-hidden>{LONGEST}</span>
                {/* justify-start, not -center: the sizer reserves the widest word's
                    width, and centring a shorter word in it opened a gap after "for"
                    ("for      Churches"). Left-aligning keeps the word flush to "for";
                    the reserved slack sits (invisibly) after the caret. */}
                <span className="absolute inset-0 flex items-end justify-start whitespace-nowrap">
                    <span className="relative">
                        <Ink>{text || " "}</Ink>
                        {animate && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt="" src={A_UNDERLINE}
                                className="pointer-events-none absolute left-0 top-full w-full h-[0.22em] mt-[0.02em] rotate-[1deg] max-w-none" />
                        )}
                    </span>
                    {/* Orange caret — sets its own colour, so it paints over the gradient. */}
                    <span className="caret-blink font-normal text-[#f47435]" aria-hidden>|</span>
                </span>
            </span>
        </h1>
    );
}
