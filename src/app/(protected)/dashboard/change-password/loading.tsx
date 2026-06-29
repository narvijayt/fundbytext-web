import { Sk } from "@/app/(protected)/_components/Skeleton";

// Change-password page skeleton.
export default function Loading() {
    return (
        <div className="max-w-md space-y-6">
            <Sk className="h-8 w-52" />
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Sk className="h-4 w-32" />
                        <Sk className="h-11 w-full rounded-lg" />
                    </div>
                ))}
                <Sk className="h-11 w-40 rounded-lg" />
            </div>
        </div>
    );
}
