"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function UserCampaignFilters({ userId }: { userId: string }) {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("cq")    ?? "");
    const [filter, setFilter] = useState(searchParams.get("cf")  ?? "all");
    const [sort,   setSort]   = useState(searchParams.get("csort") ?? "newest");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pushUrl = useCallback(
        (q: string, f: string, s: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (q) { params.set("cq", q); } else { params.delete("cq"); }
            if (f !== "all")    { params.set("cf", f); }    else { params.delete("cf"); }
            if (s !== "newest") { params.set("csort", s); } else { params.delete("csort"); }
            params.delete("cp"); // reset campaign page on filter change
            router.push(`/admin/users/${userId}?${params.toString()}`);
        },
        [router, userId, searchParams],
    );

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

    useEffect(() => {
        setQuery(searchParams.get("cq")      ?? "");
        setFilter(searchParams.get("cf")     ?? "all");
        setSort(searchParams.get("csort")    ?? "newest");
    }, [searchParams]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    return (
        <div className="px-6 py-3 border-b border-gray-50 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                    value={query}
                    onChange={(e) => handleQuery(e.target.value)}
                    placeholder="Search campaigns…"
                    className="w-48 pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors"
                />
                {query && (
                    <button
                        onClick={() => handleQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        aria-label="Clear"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Status / Role filter */}
            <select
                value={filter}
                onChange={(e) => handleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors text-gray-600"
            >
                <option value="all">All</option>
                <optgroup label="Status">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                </optgroup>
                <optgroup label="Role">
                    <option value="organizer">Organizer</option>
                    <option value="participant">Participant</option>
                </optgroup>
            </select>

            {/* Sort */}
            <select
                value={sort}
                onChange={(e) => handleSort(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors text-gray-600"
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_raised">Most Raised</option>
            </select>
        </div>
    );
}
