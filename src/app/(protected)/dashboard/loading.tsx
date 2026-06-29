import { Sk } from "@/app/(protected)/_components/Skeleton";

// Dashboard home skeleton — mirrors the title, status tabs and campaign-card grid.
export default function Loading() {
    return (
        <div>
            <div className="mb-6">
                <Sk className="h-8 w-64" />
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Sk className="h-9 w-20 rounded-full" />
                <Sk className="h-9 w-16 rounded-full" />
                <Sk className="h-9 w-20 rounded-full" />
                <Sk className="h-9 w-24 rounded-full" />
            </div>

            {/* Campaign card grid */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                        <Sk className="h-44 w-full rounded-none" />
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Sk className="h-5 w-20 rounded-full" />
                                <Sk className="h-4 w-12" />
                            </div>
                            <Sk className="h-6 w-3/4" />
                            <Sk className="h-2.5 w-full rounded-full" />
                            <div className="flex items-center justify-between">
                                <Sk className="h-4 w-16" />
                                <Sk className="h-4 w-14" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
