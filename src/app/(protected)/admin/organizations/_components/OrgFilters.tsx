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

    return (
        <div className="mb-5 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                    value={query}
                    onChange={(e) => handleQuery(e.target.value)}
                    placeholder="Search by name or creator…"
                    className="w-72 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors"
                />
                {query && (
                    <button
                        onClick={() => handleQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        aria-label="Clear search"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filter */}
            <select
                value={filter}
                onChange={(e) => handleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors text-gray-600"
            >
                <option value="all">All Organizations</option>
                <option value="has_active">Has Active Campaigns</option>
                <option value="no_campaigns">No Campaigns</option>
            </select>

            {/* Sort */}
            <select
                value={sort}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors text-gray-600"
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_campaigns">Most Campaigns</option>
            </select>
        </div>
    );
}
