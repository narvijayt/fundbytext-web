"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function OrgFilters() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [query,  setQuery]  = useState(searchParams.get("q")      ?? "");
    const [filter, setFilter] = useState(searchParams.get("filter") ?? "all");
    const [sort,   setSort]   = useState(searchParams.get("sort")   ?? "newest");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pushUrl = useCallback(
        (q: string, f: string, s: string) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f !== "all")    params.set("filter", f);
            if (s !== "newest") params.set("sort", s);
            // reset to page 1 whenever filters change
            const qs = params.toString();
            router.push(`/admin/organizations${qs ? `?${qs}` : ""}`);
        },
        [router],
    );

    // Live search — debounced 300 ms
    const handleQuery = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => pushUrl(value, filter, sort), 300);
    };

    const handleFilter = (value: string) => {
        setFilter(value);
        pushUrl(query, value, sort);
    };

    const handleSort = (value: string) => {
        setSort(value);
        pushUrl(query, filter, value);
    };

    // Keep local state in sync when the user hits back/forward
    useEffect(() => {
        setQuery(searchParams.get("q")      ?? "");
        setFilter(searchParams.get("filter") ?? "all");
        setSort(searchParams.get("sort")    ?? "newest");
    }, [searchParams]);

    // Cleanup debounce on unmount
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const selectCls = "rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20";

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:max-w-72">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                </svg>
                <input
                    value={query}
                    onChange={(e) => handleQuery(e.target.value)}
                    placeholder="Search by name or creator…"
                    className="w-full rounded-xl border border-[#e7e9eb] bg-white py-2.5 pl-10 pr-9 text-sm text-[#003060] placeholder:text-[#9aa7b8] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                />
                {query && (
                    <button
                        onClick={() => handleQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9aa7b8] transition-colors hover:text-[#003060]"
                        aria-label="Clear search"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filter */}
            <select
                value={filter}
                onChange={(e) => handleFilter(e.target.value)}
                className={selectCls}
            >
                <option value="all">All Organizations</option>
                <option value="has_active">Has Active Campaigns</option>
                <option value="no_campaigns">No Campaigns</option>
            </select>

            {/* Sort */}
            <select
                value={sort}
                onChange={(e) => handleSort(e.target.value)}
                className={selectCls}
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_campaigns">Most Campaigns</option>
            </select>
        </div>
    );
}
