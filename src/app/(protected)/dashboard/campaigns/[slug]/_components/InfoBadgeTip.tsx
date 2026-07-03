"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Wraps a small badge and shows a blue-gradient info popup explaining it.
   Toggles on click/tap only (no hover); the popup is portal'd into <body> so
   the table's overflow can't clip it. Positioned below the badge, flipped
   above when there's no room; closes on outside click / Escape. */
export default function InfoBadgeTip({ tip, children, className = "" }: { tip: string; children: React.ReactNode; className?: string }) {
    const wrapRef  = useRef<HTMLSpanElement>(null);
    const popRef   = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        if (!open) return;
        function update() { const w = wrapRef.current; if (w) setRect(w.getBoundingClientRect()); }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open]);

    useLayoutEffect(() => {
        const el = popRef.current;
        if (!open || !rect || !el) return;
        const margin = 12, gap = 8, w = el.offsetWidth, h = el.offsetHeight;
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
            caret.style.left = `${Math.max(12, Math.min(rect.left + rect.width / 2 - left, w - 12))}px`;
            if (flip) { caret.style.top = "auto"; caret.style.bottom = "-4px"; caret.style.background = "#0278DE"; }
            else      { caret.style.bottom = "auto"; caret.style.top = "-4px"; caret.style.background = "#005BAC"; }
        }
    });

    // While open, close on outside click / Escape.
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            const w = wrapRef.current, el = popRef.current;
            if (el && !el.contains(e.target as Node) && w && !w.contains(e.target as Node)) setOpen(false);
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
        <span
            ref={wrapRef}
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            className={`inline-flex cursor-pointer ${className}`}
        >
            {children}
            {open && typeof document !== "undefined" && rect && createPortal(
                <div
                    ref={popRef}
                    role="tooltip"
                    className="pointer-events-none fixed z-[120] w-max max-w-[240px]"
                    style={{
                        top: 0, left: 0, visibility: "hidden", borderRadius: 12, padding: "10px 14px",
                        background: "linear-gradient(0deg, #0278DE 0%, #005BAC 100%)",
                        boxShadow: "0px 10px 24px -6px rgba(0,91,172,0.4)",
                    }}
                >
                    <span ref={caretRef} aria-hidden className="absolute h-[9px] w-[9px]" style={{ left: 0, top: -4, transform: "translateX(-50%) rotate(45deg)", background: "#005BAC" }} />
                    <p className="text-[12px] font-medium leading-snug text-white">{tip}</p>
                </div>,
                document.body,
            )}
        </span>
    );
}
