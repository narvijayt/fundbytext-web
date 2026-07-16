"use client";

import { useEffect, useState } from "react";

/**
 * Types `text` out on mount with a blinking caret after it — the same effect as
 * the How It Works hero headline, generalised for a single line (e.g. the contact
 * page's "Want to Chat"). Inherits the surrounding font/size/colour, so drop it
 * inside whatever heading it belongs to.
 *
 * SSR, no-JS and reduced-motion all get the finished string; the typing is the
 * enhancement layered on top, and the full text stays in the accessibility tree.
 */
export default function TypingText({ text, speed = 75, caretClassName = "font-light text-[#f47435]" }: {
    text: string;
    speed?: number;
    caretClassName?: string;
}) {
    // null = "not typing" → render the finished text (what the server sends).
    const [typed, setTyped] = useState<number | null>(null);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let i = 0;
        let tick: ReturnType<typeof setInterval>;
        // Rewind to 0 a frame later so the finished text is painted first, then
        // types in — a sync setState in an effect would cascade renders.
        const raf = requestAnimationFrame(() => {
            setTyped(0);
            tick = setInterval(() => {
                i += 1;
                setTyped(i);
                if (i >= text.length) clearInterval(tick);
            }, speed);
        });
        return () => { cancelAnimationFrame(raf); clearInterval(tick); };
    }, [text, speed]);

    const shown = text.slice(0, typed ?? text.length);

    return (
        <>
            {/* Full string for screen readers and search; the per-character state
                is decoration. */}
            <span className="sr-only">{text}</span>
            <span aria-hidden>
                {shown}
                <span className={`caret-blink ${caretClassName}`}>|</span>
            </span>
        </>
    );
}
