import { Sk, SkTable } from "@/app/(protected)/_components/Skeleton";

// Admin Donations skeleton — title + export, filter, wide table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <Sk className="h-8 w-44" />
                <Sk className="h-9 w-32 rounded-lg" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <Sk className="h-9 w-64 rounded-lg" />
                <Sk className="h-9 w-48 rounded-lg" />
            </div>
            <SkTable cols={7} rows={10} />
        </div>
    );
}
