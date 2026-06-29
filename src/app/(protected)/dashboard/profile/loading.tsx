import { Sk } from "@/app/(protected)/_components/Skeleton";

// Profile page skeleton.
export default function Loading() {
    return (
        <div className="max-w-2xl space-y-6">
            <Sk className="h-8 w-48" />
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Sk className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Sk className="h-5 w-40" />
                        <Sk className="h-4 w-56" />
                    </div>
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Sk className="h-4 w-28" />
                        <Sk className="h-11 w-full rounded-lg" />
                    </div>
                ))}
                <Sk className="h-11 w-36 rounded-lg" />
            </div>
        </div>
    );
}
