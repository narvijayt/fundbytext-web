import { Sk } from "@/app/(protected)/_components/Skeleton";

// Admin Users skeleton — title, count + create, search/filter, blue-header table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <Sk className="h-7 w-32" />

            {/* count + create button */}
            <div className="flex items-center justify-between gap-3">
                <Sk className="h-3.5 w-20" />
                <Sk className="h-10 w-32 rounded-xl" />
            </div>

            {/* search / filter / sort */}
            <div className="flex flex-wrap items-center gap-3">
                <Sk className="h-10 w-64 rounded-xl" />
                <Sk className="h-10 w-72 rounded-xl" />
                <Sk className="h-10 w-40 rounded-xl" />
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                {/* Blue header row */}
                <div className="flex items-center gap-4 bg-[#0268c0] px-5 py-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`h-3.5 animate-pulse rounded-md bg-white/30 ${i === 0 ? "w-32" : "flex-1"}`} />
                    ))}
                </div>
                {/* Rows */}
                {Array.from({ length: 9 }).map((_, r) => (
                    <div key={r} className="flex items-center gap-4 border-b border-[#eef1f4] px-5 py-4 last:border-0">
                        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200" />
                        {Array.from({ length: 5 }).map((_, c) => (
                            <div key={c} className={`h-4 animate-pulse rounded-md bg-gray-200 ${c === 4 ? "w-10" : "flex-1"}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
