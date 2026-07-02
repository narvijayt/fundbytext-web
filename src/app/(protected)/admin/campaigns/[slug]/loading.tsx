// Admin campaign-detail skeleton — header, KPI strip, progress, chart/feed, tables.
const CARD = "rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]";
const P = "animate-pulse rounded bg-gray-200";

function TableCardSkeleton() {
    return (
        <div className={`overflow-hidden ${CARD}`}>
            <div className="flex items-center gap-4 bg-[#0268c0] px-5 py-3.5">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-3 rounded bg-white/30 ${i === 0 ? "w-24" : "flex-1"}`} />)}
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
                <div key={r} className="flex items-center gap-4 border-b border-[#eef1f4] px-5 py-4 last:border-0">
                    {Array.from({ length: 6 }).map((_, c) => <div key={c} className={`h-3.5 ${P} ${c === 0 ? "w-28" : "flex-1"}`} />)}
                </div>
            ))}
        </div>
    );
}

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className={`h-4 w-32 ${P}`} />

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2.5"><div className={`h-8 w-64 ${P}`} /><div className={`h-6 w-16 rounded-full ${P}`} /></div>
                    <div className={`h-3.5 w-80 ${P}`} />
                </div>
                <div className="flex gap-2"><div className={`h-10 w-28 rounded-xl ${P}`} /><div className={`h-10 w-24 rounded-xl ${P}`} /></div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`space-y-2 p-5 ${CARD}`}><div className={`h-3 w-20 ${P}`} /><div className={`h-7 w-24 ${P}`} /></div>
                ))}
            </div>

            {/* Progress */}
            <div className={`h-28 ${CARD}`} />

            {/* Chart + feed */}
            <div className="flex flex-col gap-6 lg:flex-row">
                <div className={`h-72 flex-1 ${CARD}`} />
                <div className={`h-72 w-full lg:w-80 ${CARD}`} />
            </div>

            {/* Tables */}
            <TableCardSkeleton />
            <TableCardSkeleton />
        </div>
    );
}
