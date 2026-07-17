"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FilterKey } from "../_data";

/** The id the results are anchored to, so searching can bring them into view. */
export const RESULTS_ID = "campaign-results";

/**
 * Hero search. Submitting used to be a plain GET, which reloaded the whole page;
 * it now navigates client-side, so the hero/tabs stay put and only the grid swaps
 * to its skeleton while the new query runs.
 *
 * The results sit below the hero fold, so a search would otherwise appear to do
 * nothing — we scroll them into view on submit. The skeleton is already occupying
 * that space by then, so there's something to scroll to immediately.
 *
 * The <form> keeps its GET action as a no-JS fallback; with JS the submit handler
 * takes over and prevents the navigation.
 */
export default function CampaignSearch({ filter, initialQ }: {
    filter: FilterKey; initialQ: string;
}) {
    const router = useRouter();
    const [value, setValue] = useState(initialQ);

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (filter !== "all") params.set("filter", filter);
        const q = value.trim();
        if (q) params.set("q", q);
        const qs = params.toString();

        router.push(qs ? `/campaigns?${qs}` : "/campaigns", { scroll: false });
        document.getElementById(RESULTS_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <form method="GET" action="/campaigns" onSubmit={onSubmit} className="w-full max-w-[560px]">
            {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
            <div className="flex items-center gap-2 rounded-[16px] border border-[#d4dee7] bg-white p-2 pl-4 shadow-[0_12px_28px_-12px_rgba(0,91,172,0.4)] focus-within:border-[#0268c0]">
                <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                </svg>
                <input
                    name="q"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Search campaigns or organizations…"
                    aria-label="Search campaigns or organizations"
                    className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none"
                />
                <button type="submit"
                    className="relative shrink-0 overflow-hidden rounded-[12px] px-5 py-3 text-white font-black text-xs tracking-[1px] uppercase transition-transform hover:scale-105"
                    style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                    <span className="relative z-10">Search</span>
                    <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                </button>
            </div>
        </form>
    );
}
