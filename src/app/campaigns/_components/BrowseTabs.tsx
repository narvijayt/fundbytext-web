"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { FILTERS, type FilterKey } from "../_filters";
import CampaignsGridSkeleton from "./CampaignsGridSkeleton";
import { RESULTS_ID } from "./CampaignSearch";

/**
 * The filter tabs + the results slot beneath them.
 *
 * The tabs are still real <Link>s (so middle-click / open-in-new-tab / no-JS all
 * keep working), but the highlight and the skeleton can't wait for the server:
 * a <Link> navigation only re-renders once the RSC payload lands, so until then
 * the clicked tab stayed un-highlighted and the previous page's cards sat there —
 * the click read as ignored, then everything swapped at once.
 *
 * So we track the clicked filter optimistically. `active` moves on click, while
 * `filter` is the server's truth; any gap between them IS the pending state, which
 * is what puts the skeleton up instantly. When the payload arrives the two agree
 * again and the real results render. The server-side <Suspense> boundary that wraps
 * `children` then covers the rest of the wait, so the two skeletons hand over
 * seamlessly rather than flashing.
 */
export default function BrowseTabs({ filter, q, count, children }: {
    filter: FilterKey; q: string; count: ReactNode; children: ReactNode;
}) {
    const [active, setActive] = useState<FilterKey>(filter);

    // Re-sync when the server catches up (or on Back/Forward). Adjusting state during
    // render rather than in an effect — deriving state in an effect is exactly what
    // react-hooks/set-state-in-effect flags, and it's an error in this repo.
    const [prevFilter, setPrevFilter] = useState<FilterKey>(filter);
    if (filter !== prevFilter) {
        setPrevFilter(filter);
        setActive(filter);
    }

    const pending = active !== filter;

    function href(key: FilterKey) {
        const params = [key !== "all" ? `filter=${key}` : "", q ? `q=${encodeURIComponent(q)}` : ""].filter(Boolean).join("&");
        return params ? `/campaigns?${params}` : "/campaigns";
    }

    return (
        <>
            {/* Filter tabs — the dashboard's underline treatment (StatusTabs),
                minus Drafts, which are never public. */}
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-[#e7e9eb]">
                <div className="flex gap-5 overflow-x-auto overflow-y-hidden -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map(({ key, label }) => {
                        const isActive = active === key;
                        return (
                            <Link
                                key={key}
                                href={href(key)}
                                scroll={false}
                                prefetch
                                // Only go optimistic for a plain left-click. A modified click
                                // opens a new tab and never navigates THIS one, which would
                                // strand `active` out of step with `filter` — i.e. a skeleton
                                // that never resolves.
                                onClick={(e) => {
                                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                    setActive(key);
                                }}
                                aria-current={isActive ? "page" : undefined}
                                className={`relative shrink-0 whitespace-nowrap border-b-2 py-3 text-[12px] font-black uppercase leading-none tracking-[1px] transition-colors ${
                                    isActive ? "border-[#0268c0] text-[#0268c0]" : "border-transparent text-[#7e8a96] hover:text-[#003060]"
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
                <p className="hidden sm:block shrink-0 py-3 text-[12px] font-black uppercase tracking-[1px] text-[#aeb5bd]">
                    {pending ? <span className="opacity-0">0 campaigns</span> : count}
                </p>
            </div>

            {/* scroll-mt clears the results of the sticky header when the search
                scrolls them into view. */}
            <div id={RESULTS_ID} className="scroll-mt-24">
                {pending ? <CampaignsGridSkeleton /> : children}
            </div>
        </>
    );
}
