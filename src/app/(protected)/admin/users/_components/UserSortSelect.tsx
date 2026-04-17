"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
    { value: "newest",         label: "Newest First" },
    { value: "oldest",         label: "Oldest First" },
    { value: "a_z",            label: "A → Z" },
    { value: "most_campaigns", label: "Most Campaigns" },
] as const;

export default function UserSortSelect({ defaultValue }: { defaultValue: string }) {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "newest") {
            params.delete("sort");
        } else {
            params.set("sort", value);
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <select
            defaultValue={defaultValue}
            onChange={(e) => handleChange(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20 focus:border-[#0268c0] transition-colors text-gray-600"
        >
            {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}
