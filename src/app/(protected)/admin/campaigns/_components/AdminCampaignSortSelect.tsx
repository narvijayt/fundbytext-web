"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AdminCampaignSortSelect({ defaultValue }: { defaultValue: string }) {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value && e.target.value !== "newest") {
            params.set("sort", e.target.value);
        } else {
            params.delete("sort");
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <select
            defaultValue={defaultValue}
            onChange={handleChange}
            className="rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
        >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most_raised">Most raised</option>
            <option value="most_donations">Most donations</option>
        </select>
    );
}
