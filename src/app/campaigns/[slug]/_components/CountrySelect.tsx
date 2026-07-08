"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COUNTRIES, POPULAR_COUNT, countryFlag, countryName, type Country } from "./countries";

/* Searchable country picker matching the donate-modal field style. The list opens
   in a body-portal'd popover (so the modal's overflow can't clip it), supports
   type-to-filter + full keyboard navigation, and shows a few popular countries on
   top when there's no query. */
export default function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex h-[52px] w-full items-center gap-2.5 rounded-xl border border-[#d4dee7] bg-white px-4 text-[15px] font-medium text-[#003060] transition-colors focus:border-[#0278de] focus:outline-none"
            >
                <span className="text-[18px] leading-none" aria-hidden>{countryFlag(value)}</span>
                <span className="min-w-0 flex-1 truncate text-left">{countryName(value)}</span>
                <svg className={`size-4 shrink-0 text-[#aeb5bd] transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {open && <CountryPopover anchorRef={btnRef} value={value} onSelect={(c) => { onChange(c); setOpen(false); }} onClose={() => setOpen(false)} />}
        </>
    );
}

function CountryPopover({
    anchorRef, value, onSelect, onClose,
}: {
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    value: string;
    onSelect: (code: string) => void;
    onClose: () => void;
}) {
    const popRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const highlightedRef = useRef<HTMLButtonElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();
    const filtered: Country[] = q
        ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : COUNTRIES;
    const [highlight, setHighlight] = useState(() => Math.max(0, COUNTRIES.findIndex((c) => c.code === value)));

    // Track the anchor so the popover follows on scroll/resize.
    useLayoutEffect(() => {
        function update() { const a = anchorRef.current; if (a) setRect(a.getBoundingClientRect()); }
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
    }, [anchorRef]);

    // Position below the anchor, flipping above when there isn't room.
    useLayoutEffect(() => {
        const el = popRef.current;
        if (!rect || !el) return;
        const gap = 6, margin = 10, h = el.offsetHeight;
        const below = window.innerHeight - rect.bottom;
        const flipUp = below < h + gap + margin && rect.top - gap - margin > below;
        el.style.left = `${Math.max(margin, Math.min(rect.left, window.innerWidth - rect.width - margin))}px`;
        el.style.width = `${rect.width}px`;
        el.style.top = flipUp ? `${Math.max(margin, rect.top - gap - h)}px` : `${rect.bottom + gap}px`;
        el.style.visibility = "visible";
    });

    useEffect(() => { const id = requestAnimationFrame(() => inputRef.current?.focus()); return () => cancelAnimationFrame(id); }, []);
    useEffect(() => { highlightedRef.current?.scrollIntoView({ block: "nearest" }); }, [highlight]);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            const t = e.target as Node;
            if (popRef.current && !popRef.current.contains(t) && anchorRef.current && !anchorRef.current.contains(t)) onClose();
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [onClose, anchorRef]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={popRef}
            className="fixed z-[220] rounded-2xl border border-[#e7e9eb] bg-white p-2 shadow-[0px_20px_44px_-12px_rgba(0,48,96,0.3)]"
            style={{ top: 0, left: 0, visibility: "hidden" }}
        >
            {/* Search */}
            <div className="relative mb-2">
                <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aeb5bd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
                    onKeyDown={(e) => {
                        // Stop keys from bubbling to the modal's window-level handlers
                        // (Escape there would otherwise close the whole donate modal).
                        if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setHighlight((h) => Math.max(h - 1, 0)); }
                        else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const opt = filtered[highlight]; if (opt) onSelect(opt.code); }
                        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
                        else if (e.key === "Tab") { onClose(); }
                    }}
                    placeholder="Search country…"
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    className="h-10 w-full rounded-xl border border-[#d4dee7] bg-[#f8fafc] pl-9 pr-3 text-[14px] font-medium text-[#003060] outline-none transition-colors placeholder:font-normal placeholder:text-[#aeb5bd] focus:border-[#0268c0] focus:bg-white"
                />
            </div>
            {/* List */}
            <div className="max-h-[248px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                {filtered.length === 0 && <p className="px-2 py-5 text-center text-[13px] text-[#aeb5bd]">No countries found</p>}
                {filtered.map((c, i) => {
                    const sel = c.code === value;
                    const hot = i === highlight;
                    const showDivider = !q && i === POPULAR_COUNT;
                    return (
                        <div key={c.code}>
                            {showDivider && <div className="my-1 border-t border-[#eef1f6]" />}
                            <button
                                ref={hot ? highlightedRef : undefined}
                                type="button"
                                onMouseEnter={() => setHighlight(i)}
                                onClick={() => onSelect(c.code)}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] transition-colors ${hot ? "bg-[#eef5fc]" : ""}`}
                            >
                                <span className="text-[18px] leading-none" aria-hidden>{c.flag}</span>
                                <span className={`min-w-0 flex-1 truncate ${sel ? "font-bold text-[#0268c0]" : "font-medium text-[#003060]"}`}>{c.name}</span>
                                {sel && <svg className="size-4 shrink-0 text-[#0268c0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>,
        document.body,
    );
}
