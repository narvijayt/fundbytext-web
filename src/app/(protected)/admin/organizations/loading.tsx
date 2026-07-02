import { Sk } from "@/app/(protected)/_components/Skeleton";

// Admin Organizations skeleton — title, table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <div>
                <Sk className="h-7 w-52" />
                <Sk className="mt-2 h-4 w-20" />
            </div>
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
                        {Array.from({ length: 6 }).map((_, c) => (
                            <Sk key={c} className={`h-4 ${c === 0 ? "w-32" : "flex-1"}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
