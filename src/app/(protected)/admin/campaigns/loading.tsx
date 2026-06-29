import { Sk, SkTable } from "@/app/(protected)/_components/Skeleton";

// Admin Campaigns skeleton — title, search/filter, table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <Sk className="h-8 w-40" />
            <div className="flex items-center gap-3 flex-wrap">
                <Sk className="h-9 w-64 rounded-lg" />
                <Sk className="h-9 w-48 rounded-lg" />
            </div>
            <SkTable cols={6} rows={9} />
        </div>
    );
}
