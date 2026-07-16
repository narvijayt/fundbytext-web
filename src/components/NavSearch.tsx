"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/app/api/v1/campaigns/search/route";

const A_NAV_SEARCH = "/figma/nav-search.svg";

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
    active:    { label: "Active",    bg: "#dcfce7", fg: "#15803d" },
    upcoming:  { label: "Upcoming",  bg: "#dbeafe", fg: "#1d4ed8" },
    completed: { label: "Completed", bg: "#ede9fe", fg: "#6d28d9" },
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/**
 * Header campaign search. The nav button opens a panel with a live-searching
 * input; results are public campaigns matched on name or organization. Enter (or
 * "See all results") hands off to /campaigns?q=, which does the same search with
 * filters and paging.
 */
export default function NavSearch() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Focus on open; close on Escape or an outside click.
    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => inputRef.current?.focus());
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
        function onDown(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);
        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [open]);

    // Debounced live search. `cancelled` guards against a slow response for an
    // earlier query landing on top of a newer one.
    useEffect(() => {
        const value = q.trim();
        if (value.length < 2) { setHits([]); setTotal(0); setLoading(false); return; }
        setLoading(true);
        let cancelled = false;
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/campaigns/search?q=${encodeURIComponent(value)}`);
                const json = await res.json().catch(() => ({}));
                if (cancelled) return;
                setHits(res.ok ? (json.results ?? []) : []);
                setTotal(res.ok ? (json.total ?? 0) : 0);
            } catch {
                if (!cancelled) { setHits([]); setTotal(0); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(t); };
    }, [q]);

    // Hand off to the browse page, which runs the same search with filters + paging.
    function seeAllResults() {
        const value = q.trim();
        if (!value) return;
        setOpen(false);
        router.push(`/campaigns?q=${encodeURIComponent(value)}`);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        seeAllResults();
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Search campaigns"
                aria-expanded={open}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={A_NAV_SEARCH} width={16} height={16} style={{ display: "block" }} />
                <span className="font-black text-white text-xs tracking-[1px] uppercase">Search</span>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="absolute left-0 top-[calc(100%+10px)] z-[80] w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_20px_48px_-12px_rgba(0,48,96,0.35)]"
                >
                    <form onSubmit={submit} className="flex items-center gap-2.5 border-b border-[#eef1f4] px-4 py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" src={A_NAV_SEARCH} width={16} height={16} className="shrink-0 opacity-60" />
                        <input
                            ref={inputRef}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search campaigns or organizations…"
                            aria-label="Search campaigns or organizations"
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none"
                        />
                        {q && (
                            <button type="button" onClick={() => setQ("")} aria-label="Clear search"
                                className="shrink-0 text-[#9aa7b8] transition-colors hover:text-[#003060]">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        )}
                    </form>

                    <div className="max-h-[320px] overflow-y-auto">
                        {q.trim().length < 2 ? (
                            <p className="px-4 py-6 text-center text-[13px] text-[#9aa7b8]">Type at least 2 characters to search.</p>
                        ) : loading ? (
                            <div className="space-y-2 p-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex animate-pulse items-center gap-3">
                                        <div className="h-11 w-11 shrink-0 rounded-lg bg-gray-200" />
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="h-3 w-2/3 rounded-full bg-gray-200" />
                                            <div className="h-2.5 w-1/3 rounded-full bg-gray-200" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hits.length === 0 ? (
                            <p className="px-4 py-6 text-center text-[13px] text-[#9aa7b8]">
                                No campaigns match <span className="font-semibold text-[#003060]">“{q.trim()}”</span>.
                            </p>
                        ) : (
                            <ul>
                                {hits.map((h) => {
                                    const st = STATUS_STYLE[h.status] ?? STATUS_STYLE.active;
                                    return (
                                        <li key={h.slug}>
                                            <Link href={`/campaigns/${h.slug}`} onClick={() => setOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#f4f8f9]">
                                                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#eaeef3]">
                                                    {h.heroUrl && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img alt="" src={h.heroUrl} className="h-full w-full object-cover" />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[14px] font-bold text-[#003060]">{h.name}</span>
                                                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7e8a96]">
                                                        <span className="rounded px-1.5 py-0.5 font-bold uppercase tracking-wide"
                                                            style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                                                        {h.org && <span className="truncate">{h.org}</span>}
                                                        {h.raised > 0 && <span className="shrink-0">· {fmt(h.raised)} raised</span>}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {total > 0 && (
                        <button type="button" onClick={seeAllResults}
                            className="flex w-full items-center justify-center gap-1.5 border-t border-[#eef1f4] px-4 py-3 text-[13px] font-bold text-[#0268c0] transition-colors hover:bg-[#f4f8f9]">
                            See all {total} result{total === 1 ? "" : "s"}
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
