import { Sk } from "@/app/(protected)/_components/Skeleton";

// Admin Overview skeleton — header, KPI cards, content panels.
export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Sk className="h-8 w-40" />
                <Sk className="h-4 w-64" />
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3 rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <div className="flex items-center justify-between">
                            <Sk className="h-3 w-20" />
                            <Sk className="h-8 w-8 rounded-lg" />
                        </div>
                        <Sk className="h-7 w-24" />
                        <Sk className="h-3 w-28" />
                    </div>
                ))}
            </div>

            {/* Content panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Sk className="h-80 rounded-2xl lg:col-span-2" />
                <Sk className="h-80 rounded-2xl" />
            </div>
        </div>
    );
}
