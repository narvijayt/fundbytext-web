import { Sk } from "@/app/(protected)/_components/Skeleton";

// Campaign detail skeleton — mirrors the header, view tabs, progress card and the
// chart + side-column layout while the (data-heavy) page streams in. Renders inside
// the dashboard <main>, so the sidebar stays fixed and visible.
export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5">
                    <Sk className="h-5 w-24 rounded-full" />
                    <Sk className="h-8 w-72 max-w-full" />
                    <Sk className="h-4 w-52" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Sk className="h-9 w-28 rounded-lg" />
                    <Sk className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* View toggle tabs */}
            <Sk className="h-10 w-56 rounded-xl" />

            {/* Progress / stats card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Sk className="h-5 w-40" />
                    <Sk className="h-5 w-24" />
                </div>
                <Sk className="h-3 w-full rounded-full" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Sk className="h-7 w-20" />
                            <Sk className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart + side column */}
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-6">
                    <Sk className="h-64 w-full rounded-2xl" />
                    <Sk className="h-72 w-full rounded-2xl" />
                </div>
                <div className="w-80 shrink-0 space-y-4 hidden lg:block">
                    <Sk className="h-48 w-full rounded-2xl" />
                    <Sk className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );
}
