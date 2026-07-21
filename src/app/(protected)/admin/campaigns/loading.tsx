import { Sk } from "@/app/(protected)/_components/Skeleton";

/* Admin Campaigns skeleton — mirrors the real page: heading row (title + the
   default-video button), the total line, search / status tabs / sort, then the
   CARD grid. It used to draw a table (blue header row + 9 rows), which was left
   behind when the listing moved to cards: the placeholder flashed a table and
   then snapped into a grid. */

function CardSk() {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white">
            {/* hero band */}
            <Sk className="h-[200px] rounded-none" />
            <div className="flex flex-col gap-3 px-4 pt-4 pb-5">
                <Sk className="h-5 w-20 rounded-full" />          {/* status badge */}
                <Sk className="h-4 w-3/4" />                      {/* title */}
                <Sk className="h-3 w-1/2" />                      {/* organizer */}
                <Sk className="mt-2 h-2.5 w-full rounded-full" /> {/* progress bar */}
                <div className="flex gap-3">
                    <Sk className="h-3 w-16" />
                    <Sk className="h-3 w-16" />
                </div>
                <Sk className="mt-2 h-9 w-full rounded-xl" />     {/* view button */}
            </div>
        </div>
    );
}

export default function Loading() {
    return (
        <div>
            {/* Heading row — title left, default-video button right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Sk className="h-7 w-44" />
                <Sk className="h-10 w-40 rounded-xl" />
            </div>

            <Sk className="mt-1.5 h-3.5 w-20" />

            {/* Search · status tabs · sort */}
            <div className="mb-5 mt-6 flex flex-wrap items-center gap-3">
                <Sk className="h-10 min-w-[220px] flex-1 rounded-xl md:max-w-xs" />
                <Sk className="h-10 w-[320px] max-w-full rounded-xl" />
                <Sk className="h-10 w-36 rounded-xl" />
            </div>

            {/* Card grid — same columns as the listing */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <CardSk key={i} />)}
            </div>

            {/* Footer: page size + pager */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <Sk className="h-8 w-36 rounded-lg" />
                    <Sk className="h-3.5 w-28" />
                </div>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-9 w-9 rounded-lg" />)}
                </div>
            </div>
        </div>
    );
}
