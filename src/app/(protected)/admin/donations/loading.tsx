import { Sk } from "@/app/(protected)/_components/Skeleton";

// Admin Donations skeleton — title + export, filter, wide table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                    <Sk className="h-7 w-44" />
                    <Sk className="h-4 w-28" />
                </div>
                <Sk className="h-10 w-32 rounded-xl" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Sk className="h-10 w-64 rounded-xl" />
                <Sk className="h-10 w-56 rounded-xl" />
                <Sk className="h-10 w-36 rounded-xl" />
            </div>
            {/* Table card — blue header + shimmering rows */}
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="flex items-center gap-4 bg-[#0268c0] px-5 py-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`h-3.5 animate-pulse rounded-md bg-white/30 ${i === 0 ? "w-32" : "flex-1"}`} />
                    ))}
                </div>
                {Array.from({ length: 10 }).map((_, r) => (
                    <div key={r} className="flex items-center gap-4 border-b border-[#eef1f4] px-5 py-4 last:border-0">
                        {Array.from({ length: 7 }).map((_, c) => (
                            <Sk key={c} className={`h-4 ${c === 0 ? "w-32" : "flex-1"}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
