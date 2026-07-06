"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* The clickable FundBuddy mascot next to a statistic label. Clicking it opens a
   blue-gradient info popover (the same "Ask FundBuddy" look used in the campaign
   creation wizard), portal'd into <body> so the card's overflow can't clip it.
   Positioned below the mascot, flipped above when there's no room, closed on
   outside-click / Escape. */
export default function StatBuddyTip({ label, tip, src = "/assets/dashboard/fundbuddy.svg" }: { label: string; tip: string; src?: string }) {
    const btnRef   = useRef<HTMLButtonElement>(null);
    const popRef   = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    // Track the mascot's viewport rect while open.
    useLayoutEffect(() => {
        if (!open) return;
        function update() { const b = btnRef.current; if (b) setRect(b.getBoundingClientRect()); }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open]);

    // Place the popover: below by default, flipped above if it would overflow the
    // viewport bottom. Caret tracks the mascot's horizontal centre. Style mutated
    // directly (not via state) to avoid a flash before positioning.
    useLayoutEffect(() => {
        const el = popRef.current;
        if (!open || !rect || !el) return;
        const margin = 12, gap = 10, w = el.offsetWidth, h = el.offsetHeight;
        let left = rect.left + rect.width / 2 - w / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
        const below = rect.bottom + gap;
        const flip  = below + h > window.innerHeight - margin && rect.top - gap - h > margin;
        const top   = flip ? rect.top - gap - h : below;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.visibility = "visible";
        const caret = caretRef.current;
        if (caret) {
            caret.style.left = `${Math.max(14, Math.min(rect.left + rect.width / 2 - left, w - 14))}px`;
            // Caret sits on the edge nearest the mascot, coloured to match that edge
            // of the gradient (top #005BAC / bottom #0278DE).
            if (flip) { caret.style.top = "auto"; caret.style.bottom = "-5px"; caret.style.background = "#0278DE"; }
            else      { caret.style.bottom = "auto"; caret.style.top = "-5px"; caret.style.background = "#005BAC"; }
        }
    });

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            const b = btnRef.current, el = popRef.current;
            if (el && !el.contains(e.target as Node) && b && !b.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((o) => !o);
                    // After a mouse click, drop focus so Space scrolls the page instead
                    // of re-toggling. e.detail === 0 = keyboard activation → keep focus.
                    if (e.detail !== 0) e.currentTarget.blur();
                }}
                aria-label={`About ${label}`}
                aria-expanded={open}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" aria-hidden="true" className="h-7 w-auto" />
            </button>

            {open && typeof document !== "undefined" && rect && createPortal(
                <div
                    ref={popRef}
                    role="tooltip"
                    className="fixed z-[220] w-[290px] max-w-[calc(100vw-24px)]"
                    style={{
                        top: 0, left: 0, visibility: "hidden", borderRadius: 14, padding: "16px 18px",
                        background: "linear-gradient(0deg, #0278DE 0%, #005BAC 100%)",
                        boxShadow: "0px 12px 12px 0px rgba(0,91,172,0.25), 0px 24px 32px 0px rgba(20,65,109,0.26)",
                    }}
                >
                    <span
                        ref={caretRef}
                        aria-hidden
                        className="absolute h-[10px] w-[10px]"
                        style={{ left: 0, top: -5, transform: "translateX(-50%) rotate(45deg)", background: "#005BAC" }}
                    />
                    <p className="text-[13px] font-medium text-white" style={{ lineHeight: "1.5" }}>{tip}</p>
                </div>,
                document.body,
            )}
        </>
    );
}
