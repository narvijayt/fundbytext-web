"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AdminDonationSortSelect({ defaultValue }: { defaultValue: string }) {
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
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0268c0]/30 bg-white text-gray-700"
        >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
        </select>
    );
}
