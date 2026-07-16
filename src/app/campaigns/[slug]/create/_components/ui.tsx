"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

/* ── Page background — shared gradient + drifting "Vector" wallpaper ──
   Used behind every step of the campaign-creation flow (both the public
   /campaigns/create step 1 and the [slug]/create wizard) so the whole
   journey feels continuous. */
export const PAGE_GRADIENT =
    "linear-gradient(180deg, rgba(33,150,253,1) 0%, rgba(174,217,254,1) 55%, rgba(255,255,255,1) 100%)";

const VECTOR_TILE_SIZE = 170;
const VECTOR_TEXTURE_URL =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${VECTOR_TILE_SIZE}' height='${VECTOR_TILE_SIZE}'%3E` +
    `%3Cg transform='translate(16,12)'%3E%3Cpath d='m23.28 76.64l18.97-6.62 9.55-34.07-12.37-35.43-29.27 10.22c-8.19 2.86-12.49 11.93-9.58 20.25l7.1 20.36 10.96-3.83-4.98-14.26c-0.67-1.95 0.33-4.08 2.25-4.75l22.79-7.96 2 5.73-19.75 6.89 2.4 6.86 17.5-6.11 1.82 5.23-17.46 6.09-1.9 31.39z' fill='%23003060'/%3E%3C/g%3E` +
    `%3Cg transform='translate(96,90)'%3E%3Cpath d='M27.9717 0L9.09569 6.86879L0 41.0623L12.8348 76.3241L41.9651 65.7237C50.1204 62.752 54.2958 53.6262 51.279 45.3431L43.9061 25.0827L32.9973 29.0551L38.1658 43.2516C38.8655 45.1926 37.895 47.3292 35.9765 48.0289L13.3012 56.282L11.2248 50.5868L30.8757 43.4321L28.3855 36.601L10.969 42.9431L9.08063 37.7445L26.4595 31.4174L27.9491 0.00752493L27.9717 0Z' fill='%23003060'/%3E%3C/g%3E` +
    `%3C/svg%3E`;

/* Drifting vector wallpaper — dense repeating texture over the gradient,
   stays behind cards, logo, header, progress bar & footer (render it as the
   first child of a `relative isolate` wrapper, give chrome bars `relative z-40`).

   The drift is a transform (GPU-composited) animation, NOT a background-position
   one: browsers throttle/skip non-composited paint animations in production, so
   the old `driftLeft` drifted locally but froze once deployed — the same bug the
   footer watermark already hit. The inner layer is one tile wider than the outer
   and translates left by exactly that tile, so the loop is seamless; the outer
   clips it (the wizard shells are `relative isolate` with no overflow-hidden of
   their own, so the clipping has to live here or the extra tile would spill and
   add a horizontal scrollbar). */
const VECTOR_MASK = "linear-gradient(180deg, #000 0%, #000 50%, transparent 95%)";

export function VectorWallpaper() {
    return (
        <div
            className="absolute inset-0 -z-10 overflow-hidden opacity-[0.16] pointer-events-none"
            style={{ WebkitMaskImage: VECTOR_MASK, maskImage: VECTOR_MASK }}
        >
            <div
                className="footer-drift absolute inset-y-0 left-0"
                /* --fd is set inline, not via an arbitrary Tailwind class: a class
                   built from a template literal can't be statically detected, so it
                   would be purged from the production CSS. */
                style={{
                    "--fd": `-${VECTOR_TILE_SIZE}px`,
                    right: -VECTOR_TILE_SIZE,
                    backgroundImage: `url("${VECTOR_TEXTURE_URL}")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: `${VECTOR_TILE_SIZE}px ${VECTOR_TILE_SIZE}px`,
                    backfaceVisibility: "hidden",
                } as React.CSSProperties}
            />
        </div>
    );
}

/* ── StepBanner ────────────────────────────────────────────────────────
   The "Campaign Details / On your mark get set… Go!" plaque + ribbon shown
   above each step. Built entirely in CSS (gradients, shadows, a clip-path
   ribbon) so each step shows its own title/subtitle as real text — matching
   the marketing campaign page's plaque/ribbon treatment, and replacing the
   old baked-in header-title.png that could only ever say "Campaign Details". */
function BannerDot({ className }: { className?: string }) {
    return (
        <span className={`relative shrink-0 rounded-full ${className}`} style={{ background: "#0278de" }}>
            <span className="absolute inset-0 rounded-full" style={{ boxShadow: "inset 0px 3.5px 0px 0px #003060" }} />
        </span>
    );
}

export function StepBanner({ title, subtitle }: { title: string; subtitle: string }) {
    const plaqueRef = useRef<HTMLDivElement>(null);
    const subRef = useRef<HTMLParagraphElement>(null);
    // The ribbon must always be wider than the plaque (its notched tips flare
    // out past the plaque's edges) AND wide enough to hold the subtitle. Both
    // the plaque (sized to the title) and the subtitle vary, so derive the
    // ribbon width from a measurement of each rather than a fixed value.
    const [ribbonW, setRibbonW] = useState<number | null>(null);
    useEffect(() => {
        function update() {
            const pl = plaqueRef.current, sub = subRef.current;
            if (!pl || !sub) return;
            const isSm = window.matchMedia("(min-width: 640px)").matches;
            const flare = isSm ? 88 : 52;   // total width added beyond the plaque (both tips)
            const subPad = isSm ? 150 : 96;  // room for dots + gaps + notch + side padding
            setRibbonW(Math.round(Math.max(pl.offsetWidth + flare, sub.offsetWidth + subPad)));
        }
        update();
        const ro = new ResizeObserver(update);
        if (plaqueRef.current) ro.observe(plaqueRef.current);
        if (subRef.current) ro.observe(subRef.current);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [title, subtitle]);

    return (
        <div className="flex flex-col items-center select-none">
            {/* Plaque (outer frame + inner panel) */}
            <div
                ref={plaqueRef}
                className="relative flex justify-center overflow-hidden rounded-t-[22px] sm:rounded-t-[32px] px-[13px] pt-[13px] sm:px-[18px] sm:pt-[18px]"
                style={{
                    background: "linear-gradient(180deg, #0278de 0%, #0d8dfd 66.111%)",
                    boxShadow: "0px 22px 24px -10px rgba(0,48,96,0.3)",
                }}
            >
                <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0px 5px 4px -3px rgba(174,217,254,0.7)" }} />
                <div
                    className="relative flex items-center justify-center rounded-t-[14px] sm:rounded-t-[19px] px-[26px] pt-[22px] pb-[12px] sm:px-[44px] sm:pt-[30px] sm:pb-[16px]"
                    style={{
                        background: "linear-gradient(180deg, #0278de 17.803%, #0d8dfd 71.97%)",
                        boxShadow: "0px 0px 30px 0px rgba(0,48,96,0.4)",
                    }}
                >
                    <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0px -4px 8px 0px rgba(0,48,96,0.1), inset 0px 4px 8px -3px rgba(174,217,254,0.7)" }} />
                    <h2
                        className="relative font-black text-white text-center whitespace-nowrap leading-none text-[20px] sm:text-[27px]"
                        style={{ textShadow: "0px 0px 16px #005bac, 0px 0px 4px #005bac", letterSpacing: "-1.2px" }}
                    >
                        {title}
                    </h2>
                </div>
            </div>

            {/* Ribbon (notched banner via clip-path) — width derived from the
            plaque/subtitle so its tips always flare out beyond the plaque. */}
            <div
                className="relative -mt-px flex items-center justify-center h-[30px] w-[270px] sm:h-[50px] sm:w-[470px]"
                style={{ width: ribbonW ?? undefined }}
            >
                <div
                    aria-hidden
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: "polygon(0 0, 100% 0, 94.35% 50%, 100% 100%, 0 100%, 5.65% 50%)", background: "#004f95" }}
                >
                    <span
                        className="absolute inset-0"
                        style={{ backgroundImage: "repeating-linear-gradient(115deg, transparent 0 7px, rgba(0,0,0,0.07) 7px 8px)" }}
                    />
                </div>
                <div className="relative flex items-center justify-center gap-[8px] sm:gap-[12px] px-[32px]">
                    <BannerDot className="size-[6px] sm:size-[9px]" />
                    <p ref={subRef} className="font-bold text-white text-center whitespace-nowrap text-[11px] sm:text-[14px]" style={{ lineHeight: 1.25 }}>
                        {subtitle}
                    </p>
                    <BannerDot className="size-[6px] sm:size-[9px]" />
                </div>
            </div>
        </div>
    );
}

const focusGradientCls =
    "focus:outline-none focus:border-transparent focus:[background-image:linear-gradient(#fff,#fff),linear-gradient(95.84deg,#0278DE_40.72%,#AED9FE_50%,#0278DE_59.28%)] focus:[background-origin:border-box] focus:[background-clip:padding-box,border-box]";

export const inputCls =
    `w-full border-[2px] border-gray-200 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-[14px] sm:text-[15px] font-medium leading-[140%] tracking-normal bg-white text-[rgba(0,48,96,1)] ${focusGradientCls} placeholder:text-[rgba(126,138,150,1)]`;
export const inputErrCls =
    `w-full border-[2px] border-red-400 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-[14px] sm:text-[15px] font-medium leading-[140%] tracking-normal bg-white text-[rgba(0,48,96,1)] ${focusGradientCls} placeholder:text-[rgba(126,138,150,1)]`;

export function SectionTitle({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <h2 className={`text-base font-bold text-gray-900 ${className}`}>{children}</h2>
    );
}

/* ── AskBuddyPopover ───────────────────────────────────────────────────
   The blue FundBuddy suggestions panel. Rendered into document.body via a
   portal so it floats OVER the card (escaping the card's overflow-hidden /
   stacking context) instead of growing it. Positioned just below the
   ask-buddy row, but flipped above it when there isn't room before the
   fixed bottom nav — so it's never hidden at the bottom of the page. */
function AskBuddyPopover({
    anchorRef,
    heading,
    suggestions,
    onClose,
}: {
    anchorRef: React.RefObject<HTMLDivElement | null>;
    heading?: string;
    suggestions: string[];
    onClose: () => void;
}) {
    const popRef = useRef<HTMLDivElement>(null);
    const tailRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);

    // Track the anchor's viewport rect (re-measure on scroll/resize).
    useLayoutEffect(() => {
        function update() {
            const a = anchorRef.current;
            if (!a) return;
            const r = a.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, bottom: r.bottom });
        }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [anchorRef]);

    // Measure the rendered panel and place it (below by default, flipped above
    // when it would collide with the fixed bottom nav). Mutating style here —
    // rather than via state — avoids an extra render/flicker.
    useLayoutEffect(() => {
        const el = popRef.current;
        if (!rect || !el) return;
        const margin = 12;
        const bottomBar = 92; // fixed footer height + breathing room
        const mascotW = 30;   // row mascot width
        const sideGap = 4;    // panel sits just right of the mascot; the tail bridges the rest
        const popH = el.offsetHeight;
        const mascotCenterY = (rect.top + rect.bottom) / 2;
        const tailOffset = 26;  // tail's distance from the panel top (clears the rounded corner)
        // Panel sits to the RIGHT of the row mascot and runs to the row's right edge.
        const left = rect.left + mascotW + sideGap;
        const width = Math.max(0, rect.width - mascotW - sideGap);
        // Raise the panel so the tail (at tailOffset) lines up with the mascot's
        // centre; clamp so it stays on screen and clear of the fixed footer.
        const maxTop = window.innerHeight - bottomBar - margin - popH;
        const top = Math.max(margin, Math.min(mascotCenterY - tailOffset - 8, maxTop));
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.width = `${width}px`;
        el.style.visibility = "visible";
        // Tail on the LEFT edge, centred on the mascot. Mutated here rather than
        // via state to avoid a setState-in-effect cascade.
        const tail = tailRef.current;
        if (tail) {
            const ty = Math.min(Math.max(mascotCenterY - top - 8, 18), popH - 30);
            tail.style.top = `${ty}px`;
        }
    });

    // Close on outside click / Escape.
    useEffect(() => {
        function onDown(e: MouseEvent) {
            const a = anchorRef.current, el = popRef.current;
            if (el && !el.contains(e.target as Node) && a && !a.contains(e.target as Node)) onClose();
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [anchorRef, onClose]);

    if (typeof document === "undefined" || !rect) return null;

    return createPortal(
        <div
            ref={popRef}
            className="fixed z-[200] flex flex-col"
            style={{
                top: rect.top,
                left: rect.left + 34,
                width: rect.width - 34,
                visibility: "hidden",
                gap: "16px",
                borderRadius: "15px",
                padding: "24px 32px",
                background: "linear-gradient(0deg, #0278DE 0%, #005BAC 100%)",
                boxShadow: "0px 12px 12px 0px rgba(0,91,172,0.25), 0px 32px 40px 0px rgba(20,65,109,0.26)",
            }}
        >
            {/* Tail on the LEFT edge, pointing at the row mascot. Its vertical
            position is set in the effect to track the mascot's centre. */}
            <div
                ref={tailRef}
                className="absolute -left-[8px] top-[16px] w-0 h-0"
                style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "8px solid #005BAC" }}
            />
            <h4 className="font-black text-[15px] sm:text-[18px] text-white" style={{ lineHeight: "125%", letterSpacing: 0 }}>
                {heading}
            </h4>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
                {suggestions.map((s) => (
                    <li key={s} className="font-medium text-[14px] sm:text-[15px] text-white" style={{ lineHeight: "140%", letterSpacing: 0 }}>
                        {s}
                    </li>
                ))}
            </ul>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-[12px] bg-white font-bold text-[14px] transition-transform hover:scale-[1.03] active:scale-95"
                    style={{
                        paddingTop: "12px",
                        paddingRight: "14px",
                        paddingBottom: "11.7px",
                        paddingLeft: "14px",
                        lineHeight: "100%",
                        color: "rgba(2,104,192,1)",
                        boxShadow: "0px 12px 36px -8px rgba(255,255,255,0.74)",
                    }}
                >
                    Thanks!
                </button>
            </div>
        </div>,
        document.body
    );
}

/* ── QuestionCard ──────────────────────────────────────────────────────
   Shared "question card" shell used across the create-campaign flows
   (both the public /campaigns/create step 1 and the [slug]/create wizard). */
/* ── InfoDot ───────────────────────────────────────────────────────────
   Small grey "?" circle used as a tooltip affordance next to titles and
   field labels (matches the Figma ⓘ marks). */
export function InfoDot({ className = "" }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#c4cbd2] text-white ${className}`}
            style={{ width: 14, height: 14, fontSize: 9, fontWeight: 800, lineHeight: 1 }}
        >
            ?
        </span>
    );
}

/* ── Loader ────────────────────────────────────────────────────────────
   The shared 12-segment spinner (exported from Figma). Used for every loading
   state — photo uploads, auto-save, the Next/Launch buttons, etc. `light`
   swaps in the white variant for dark backgrounds (the blue one vanishes). */
export function Loader({ className = "w-10 h-10", light = false }: { className?: string; light?: boolean }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={light ? "/assets/campaigns/loader-spinner-light.svg" : "/assets/campaigns/loader-spinner.svg"}
            alt=""
            role="status"
            aria-label="Loading"
            className={className}
            style={{ animation: "loaderSpin 1s steps(12) infinite" }}
        />
    );
}

/* ── InfoTooltip ───────────────────────────────────────────────────────
   The grey "?" dot, now clickable: it opens a blue gradient popover (same
   look as the Ask-FundBuddy suggestions panel) explaining the field. The
   popover is portal'd into document.body so the card's overflow-hidden
   can't clip it, and flips above the dot when there's no room below. */
export function InfoTooltip({ tip, className = "" }: { tip: string; className?: string }) {
    const dotRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        if (!open) return;
        function update() {
            const d = dotRef.current;
            if (d) setRect(d.getBoundingClientRect());
        }
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
        const margin = 12, gap = 10, footerH = 88, w = el.offsetWidth, h = el.offsetHeight;
        let left = rect.left + rect.width / 2 - w / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
        // Always sit below the dot — never flip above. If the WHOLE popover no
        // longer fits before the fixed bottom bar, hide it cleanly rather than
        // showing a clipped/cut-off fragment over the content.
        const top = rect.bottom + gap;
        const fits = top + h <= window.innerHeight - footerH;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.visibility = fits ? "visible" : "hidden";
        const caret = caretRef.current;
        if (caret) {
            caret.style.left = `${Math.max(14, Math.min(rect.left + rect.width / 2 - left, w - 14))}px`;
        }
    });

    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            const d = dotRef.current, el = popRef.current;
            if (el && !el.contains(e.target as Node) && d && !d.contains(e.target as Node)) setOpen(false);
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
                ref={dotRef}
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((o) => !o);
                    // After a mouse click, drop focus so pressing Space scrolls the
                    // page instead of re-activating this button (which would close
                    // the popover). e.detail === 0 means a keyboard activation —
                    // keep focus there so keyboard users can still toggle/close it.
                    if (e.detail !== 0) e.currentTarget.blur();
                }}
                aria-label="More information"
                className={`pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full text-white transition-colors ${open ? "bg-[#0268c0]" : "bg-[#c4cbd2] hover:bg-[#0268c0]"} ${className}`}
                style={{ width: 14, height: 14, fontSize: 9, fontWeight: 800, lineHeight: 1 }}
            >
                ?
            </button>
            {open && typeof document !== "undefined" && rect && createPortal(
                <div
                    ref={popRef}
                    className="fixed z-[220] max-w-[280px]"
                    style={{
                        top: 0, left: 0, visibility: "hidden", borderRadius: 14, padding: "14px 18px",
                        background: "linear-gradient(0deg, #0278DE 0%, #005BAC 100%)",
                        boxShadow: "0px 12px 12px 0px rgba(0,91,172,0.25), 0px 24px 32px 0px rgba(20,65,109,0.26)",
                    }}
                >
                    <span
                        ref={caretRef}
                        aria-hidden
                        className="absolute w-[10px] h-[10px]"
                        style={{ left: 0, top: -5, transform: "translateX(-50%) rotate(45deg)", background: "#005BAC" }}
                    />
                    <p className="font-medium text-[13px] sm:text-[14px] text-white" style={{ lineHeight: "150%" }}>{tip}</p>
                </div>,
                document.body,
            )}
        </>
    );
}

export function QuestionCard({
    title,
    icon = "/assets/campaigns/question-flag.svg",
    titleInfoTip,
    description,
    askBuddyText,
    askBuddySuggestionsHeading,
    askBuddySuggestions,
    children,
}: {
    /* Optional — when omitted the centred title/icon/description header is
       skipped and the card opens straight into its content (Step 4 uses this). */
    title?: string;
    /* Title flag/icon — defaults to the blue question flag; some cards
       (Share your story, Campaign duration) use their own icon. */
    icon?: string;
    /* When set, render a clickable "?" dot after the title that opens a
       blue tooltip popover with this text. */
    titleInfoTip?: string;
    description?: string;
    askBuddyText?: string;
    askBuddySuggestionsHeading?: string;
    askBuddySuggestions?: string[];
    children: React.ReactNode;
}) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const hasSuggestions = !!askBuddySuggestions?.length;
    const askRowRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0px 32px 40px -16px rgba(2,104,192,0.3), 0px 12px 12px -8px rgba(2,104,192,0.06)" }}
        >
            <div className="px-6 sm:px-14 pt-8 sm:pt-14 pb-8 sm:pb-16 flex flex-col">
                {title && (
                    <div className="text-center mb-[32px] sm:mb-[48px]">
                        <div className="flex items-center justify-center gap-1.5 mb-[16px]">
                            <Image src={icon} width={24} height={24} alt="" />
                            <h3
                                className="font-black text-[17px] sm:text-[22px]"
                                style={{ lineHeight: "125%", letterSpacing: 0, color: "rgba(2,104,192,1)" }}
                            >
                                {title}
                            </h3>
                            {titleInfoTip && <InfoTooltip tip={titleInfoTip} className="self-center" />}
                        </div>
                        {description && (
                            <p
                                className="text-[14px] sm:text-[17px] leading-[140%]"
                                style={{ letterSpacing: 0, color: "rgba(0,48,96,1)" }}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                )}
                {children}
                {askBuddyText && !hasSuggestions && (
                    <div className="flex items-end gap-[16px] mt-[24px]">
                        <Image
                            src="/assets/campaigns/ask-buddy.svg"
                            width={64}
                            height={80}
                            alt=""
                            className="shrink-0 w-7.5 h-10 sm:w-[61.8px] sm:h-20"
                        />
                        <p
                            className="flex-1 text-xs sm:text-[15px]"
                            style={{
                                fontFamily: "var(--font-sans)",
                                fontWeight: 400,
                                lineHeight: "140%",
                                letterSpacing: 0,
                                color: "rgba(0,48,96,1)",
                                borderRadius: "16px",
                                paddingTop: "18px",
                                paddingRight: "24px",
                                paddingBottom: "18px",
                                paddingLeft: "16px",
                                border: "2px solid rgba(221,224,227,1)",
                            }}
                        >
                            {askBuddyText}
                        </p>
                    </div>
                )}
                {askBuddyText && hasSuggestions && (
                    <>
                        {/* Always-visible row — mascot + prompt + "Ask FundBuddy" button. */}
                        <div ref={askRowRef} className="flex items-center gap-[16px] mt-[24px]">
                            <Image
                                src="/assets/campaigns/ask-buddy.svg"
                                width={30}
                                height={40}
                                alt=""
                                className="shrink-0 w-[30px] h-[40px]"
                            />
                            <p
                                className="flex-1 text-[12px] sm:text-[14px]"
                                style={{
                                    fontFamily: "var(--font-sans)",
                                    fontWeight: 500,
                                    lineHeight: "130%",
                                    letterSpacing: 0,
                                    color: "rgba(143,152,163,1)",
                                }}
                            >
                                {renderAskBuddyText(askBuddyText, () => setShowSuggestions(true))}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowSuggestions((s) => !s)}
                                className="shrink-0 rounded-[12px] font-bold text-[14px] text-white transition-transform hover:scale-[1.03] active:scale-95"
                                style={{
                                    paddingTop: "12px",
                                    paddingRight: "14px",
                                    paddingBottom: "11.7px",
                                    paddingLeft: "14px",
                                    lineHeight: "100%",
                                    background: "linear-gradient(0deg, #FF8C53 0%, #F47435 100%)",
                                    boxShadow: "0px 12px 36px -8px rgba(244,116,53,0.48)",
                                }}
                            >
                                <span className="sm:hidden">Ask me</span>
                                <span className="hidden sm:inline">Ask FundBuddy</span>
                            </button>
                        </div>
                        {/* Suggestions — absolute overlay floating OVER the card (rendered
                        in a portal so the card's overflow-hidden can't clip it), flipped
                        above the row when near the page bottom so it's never hidden. */}
                        {showSuggestions && (
                            <AskBuddyPopover
                                anchorRef={askRowRef}
                                heading={askBuddySuggestionsHeading}
                                suggestions={askBuddySuggestions!}
                                onClose={() => setShowSuggestions(false)}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* Splits askBuddyText on the word "FundBuddy" and renders it bold + underlined,
   matching the FundBuddy brand styling in the ask-buddy bar. */
function renderAskBuddyText(text: string, onAsk?: () => void) {
    const parts = text.split("FundBuddy");
    return parts.map((part, i) => (
        <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
                onAsk ? (
                    <button
                        type="button"
                        onClick={onAsk}
                        className="cursor-pointer underline transition-opacity hover:opacity-70"
                        style={{ fontWeight: 900, color: "inherit" }}
                    >
                        FundBuddy
                    </button>
                ) : (
                    <strong style={{ fontWeight: 900, textDecoration: "underline" }}>FundBuddy</strong>
                )
            )}
        </React.Fragment>
    ));
}

export function Field({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {hint && <p className="text-xs sm:text-sm text-gray-400 mb-1.5">{hint}</p>}
            {children}
            {error && <p data-field-error className="text-xs sm:text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
}

/* ── Stepper ───────────────────────────────────────────────────────────
   Big centered value flanked by blue −/+ buttons (Step 2 funding amount,
   donors per participant). The value is freely editable; while focused it
   shows the raw number, and when blurred it's formatted (e.g. "$5,000"). */
export function Stepper({
    value,
    onChange,
    step = 1,
    min = 0,
    prefix = "",
    placeholder = "0",
    fractionDigits = 0,
    disabled = false,
}: {
    value: string;
    onChange: (v: string) => void;
    step?: number;
    min?: number;
    prefix?: string;
    placeholder?: string;
    fractionDigits?: number;
    disabled?: boolean;
}) {
    const [focused, setFocused] = useState(false);
    const num = Number(value) || 0;
    const display = focused
        ? value
        : value !== ""
            ? `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`
            : "";
    const set = (n: number) => onChange(String(Math.max(min, n)));
    const btn =
        "shrink-0 flex items-center justify-center rounded-xl size-10 bg-[#0268c0] text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:active:scale-100";

    return (
        <div className="flex items-center justify-center gap-3 sm:gap-5 w-full">
            <button type="button" disabled={disabled} onClick={() => set(num - step)} className={btn} aria-label="Decrease">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 12h12" /></svg>
            </button>
            <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                value={display}
                placeholder={`${prefix}${placeholder}`}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
                className="min-w-0 flex-1 bg-transparent text-center text-[20px] sm:text-[24px] font-bold leading-none text-[rgba(0,48,96,1)] focus:outline-none placeholder:text-[rgba(174,181,189,1)] disabled:opacity-50"
            />
            <button type="button" disabled={disabled} onClick={() => set(num + step)} className={btn} aria-label="Increase">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg>
            </button>
        </div>
    );
}

/* ── Step card shell ──────────────────────────────────────────────────── */
export function StepCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

/* ── Card question header ────────────────────────────────────────────── */
export function CardHeader({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="text-center px-6 pt-6 pb-4">
            <div className="flex justify-center mb-2 text-blue-600">{icon}</div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {description && (
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{description}</p>
            )}
        </div>
    );
}

/* ── FundBuddy AI helper bar ─────────────────────────────────────────── */
export function FundBuddyBar({
    text,
    onAsk,
}: {
    text: string;
    onAsk?: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border-t border-orange-100">
            <FundBuddyIcon className="w-9 h-9 shrink-0" />
            <p className="text-[9.9px] text-gray-600 flex-1 leading-relaxed">{text}</p>
            {onAsk && (
                <button
                    type="button"
                    onClick={onAsk}
                    className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[9.9px] font-semibold rounded-full transition-colors"
                >
                    Ask FundBuddy
                </button>
            )}
        </div>
    );
}

/* ── FundBuddy mascot SVG ────────────────────────────────────────────── */
export function FundBuddyIcon({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
            {/* Head */}
            <circle cx="24" cy="16" r="11" fill="#F97316" />
            {/* Face highlight */}
            <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
            {/* Eyes */}
            <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
            <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
            <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
            <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
            {/* Eye shine */}
            <circle cx="21.5" cy="14.4" r="0.5" fill="white" />
            <circle cx="28.5" cy="14.4" r="0.5" fill="white" />
            {/* Smile */}
            <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Tail */}
            <path d="M16 36 Q10 40 6 37 Q10 42 18 38" fill="#F97316" />
            {/* Belly */}
            <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
        </svg>
    );
}

/* ── Step bubble (progress bar) ──────────────────────────────────────── */
export function StepBubble({
    num,
    label,
    icon,
    status,
    clickable,
    onClick,
    isLast,
}: {
    num: number;
    label: string;
    icon?: React.ReactNode;
    status: "done" | "current" | "pending";
    clickable?: boolean;
    onClick?: () => void;
    isLast?: boolean;
}) {
    const circleBase = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all";
    const circleColor =
        status === "done" ? `${circleBase} bg-green-500 text-white` :
            status === "current" ? `${circleBase} bg-blue-700 text-white ring-4 ring-blue-100` :
                `${circleBase} bg-gray-200 text-gray-400`;
    const labelColor =
        status === "current" ? "text-blue-700 font-bold" :
            status === "done" ? "text-green-600 font-semibold" :
                "text-gray-400";

    const inner = (
        <div className="flex flex-col items-center">
            {/* Icon above bubble */}
            <div className={`mb-1 h-6 flex items-end justify-center ${status === "pending" ? "opacity-30" : "opacity-100"}`}>
                {icon}
            </div>
            <div className={circleColor}>
                {status === "done" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <span>{num === 0 ? "" : num}</span>
                )}
            </div>
            <span className={`text-[8.1px] mt-1 uppercase tracking-wider whitespace-nowrap ${labelColor}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="flex items-center">
            {clickable ? (
                <button type="button" onClick={onClick} className="group focus:outline-none">
                    {inner}
                </button>
            ) : (
                inner
            )}
            {!isLast && (
                <div className={`w-8 sm:w-14 h-0.5 mb-7 mx-1 shrink-0 ${status === "done" ? "bg-green-400" :
                    status === "current" ? "bg-blue-200" :
                        "bg-gray-200"
                    }`} />
            )}
        </div>
    );
}

/* ── Thin card divider ───────────────────────────────────────────────── */
export function CardDivider() {
    return <div className="h-px bg-gray-100 mx-5" />;
}

/* ── Locked field display ────────────────────────────────────────────── */
export function LockedField({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <label className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">
                {label}
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="normal-case font-normal text-gray-400">locked</span>
            </label>
            <div className="w-full border-[2px] border-gray-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 lg:py-4 text-sm sm:text-[15px] bg-gray-50 text-gray-500 cursor-not-allowed select-none">
                {value}
            </div>
        </div>
    );
}

/* ── AlertDialog — centered "message + action" modal used for surfacing
   errors (and other notices) across the campaign-creation flow. Pass an
   optional `action` to render a primary action button (e.g. "Log In")
   alongside the dismiss button; otherwise it shows a single "OK" button. ── */
export function AlertDialog({
    message,
    title,
    onClose,
    variant = "error",
    action,
    dismissLabel = "Dismiss",
}: {
    message: string;
    title?: string;
    onClose: () => void;
    variant?: "error" | "info";
    action?: { label: string; onClick: () => void };
    dismissLabel?: string;
}) {
    const isInfo = variant === "info";
    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-4"
            onClick={onClose}
        >
            <div
                role="alertdialog"
                className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-[0px_24px_48px_-12px_rgba(0,48,96,0.35)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isInfo ? "bg-blue-50" : "bg-red-50"}`}>
                    {isInfo ? (
                        <svg className="h-6 w-6 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                        </svg>
                    )}
                </div>
                {title && <p className="mb-1 text-base font-bold text-[rgba(0,48,96,1)]">{title}</p>}
                <p className="text-[15px] leading-relaxed text-[rgba(0,48,96,1)]">{message}</p>

                {action ? (
                    <div className="mt-6 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={action.onClick}
                            autoFocus
                            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                            style={{ background: "rgba(2,104,192,1)" }}
                        >
                            {action.label}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl py-3 text-sm font-semibold text-[rgba(2,104,192,1)] hover:bg-[rgba(2,104,192,0.06)] transition-colors"
                        >
                            {dismissLabel}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onClose}
                        autoFocus
                        className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                        style={{ background: "rgba(2,104,192,1)" }}
                    >
                        OK
                    </button>
                )}
            </div>
        </div>
    );
}
