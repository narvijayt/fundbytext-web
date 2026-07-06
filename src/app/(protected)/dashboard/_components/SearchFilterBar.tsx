"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORTS: { value: string; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "raised", label: "Most raised" },
];

export default function SearchFilterBar() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [value, setValue] = useState(params.get("q") ?? "");
    const [menuOpen, setMenuOpen] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const sort = params.get("sort") ?? "newest";

    function update(mut: (sp: URLSearchParams) => void) {
        const sp = new URLSearchParams(Array.from(params.entries()));
        sp.delete("page");
        mut(sp);
        router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    }
    function onSearch(v: string) {
        setValue(v);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => update((sp) => (v ? sp.set("q", v) : sp.delete("q"))), 350);
    }

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[280px]">
                {/* Vuesax "search-normal" — exact Figma icon (node 5455:27068) */}
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#aeb5bd]" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8.625" cy="8.625" r="7.125" /><path d="M16.5 16.5L15 15" />
                </svg>
                <input
                    value={value}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search campaign"
                    className="w-full rounded-xl border border-[#e7e9eb] bg-white py-3 pl-10 pr-3 text-[14px] text-[#003060] placeholder:text-[#7e8a96] focus:border-[#0268c0] focus:outline-none"
                />
            </div>

            <div ref={menuRef} className="relative ml-auto">
                <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-[10px] border border-[#dde0e3] bg-white px-4 py-2.5 text-[14px] font-medium text-[#003060] transition-colors hover:border-[#0268c0]"
                >
                    <svg className="h-[18px] w-[18px] text-[#003060]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h9.4" /><path d="M17.6 8H21" /><circle cx="15" cy="8" r="2.6" />
                        <path d="M3 16h5.4" /><path d="M13.6 16H21" /><circle cx="11" cy="16" r="2.6" />
                    </svg>
                    Filter
                </button>
                {menuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#e7e9eb] bg-white py-1.5 shadow-[0px_16px_32px_-8px_rgba(0,48,96,0.2)]">
                        {SORTS.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => { setMenuOpen(false); update((sp) => (s.value === "newest" ? sp.delete("sort") : sp.set("sort", s.value))); }}
                                className={`flex w-full items-center justify-between px-4 py-2 text-left text-[14px] font-medium transition-colors hover:bg-[#f4f8f9] ${sort === s.value ? "text-[#0268c0]" : "text-[#003060]"}`}
                            >
                                {s.label}
                                {sort === s.value && (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
