import { Sk, SkTable } from "@/app/(protected)/_components/Skeleton";

// Admin Organizations skeleton — title, table.
export default function Loading() {
    return (
        <div className="space-y-5">
            <Sk className="h-8 w-52" />
            <SkTable cols={6} rows={9} />
        </div>
    );
}
