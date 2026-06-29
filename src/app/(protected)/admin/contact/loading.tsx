import { Sk, SkTable } from "@/app/(protected)/_components/Skeleton";

// Admin Contact Submissions skeleton — title, tabs, table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <Sk className="h-8 w-60" />
            <Sk className="h-9 w-52 rounded-lg" />
            <SkTable cols={5} rows={9} />
        </div>
    );
}
