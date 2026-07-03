// Admin org-detail skeleton — profile card + campaigns table card.
const CARD = "overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]";
const P = "animate-pulse rounded bg-gray-200";

export default function Loading() {
    return (
        <div className="space-y-5">
            <div className={`h-4 w-40 ${P}`} />
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* Profile card */}
                <div className={CARD}>
                    <div className="flex flex-col items-center border-b border-[#eef1f4] bg-linear-to-b from-[#f2f8ff] to-white px-6 pb-6 pt-8">
                        <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-200" />
                        <div className="mt-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-3 border-b border-[#eef1f4] px-5 py-4">
                        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
                        <div className="space-y-1.5"><div className="h-3.5 w-28 animate-pulse rounded bg-gray-200" /><div className="h-3 w-36 animate-pulse rounded bg-gray-200" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-[#eef1f4] px-5 py-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5"><div className="h-2.5 w-12 animate-pulse rounded bg-gray-200" /><div className="h-4 w-10 animate-pulse rounded bg-gray-200" /></div>
                        ))}
                    </div>
                    <div className="space-y-3 px-5 py-4">
                        <div className="h-3.5 w-40 animate-pulse rounded bg-gray-200" />
                        <div className="h-3.5 w-36 animate-pulse rounded bg-gray-200" />
                    </div>
                </div>

                {/* Campaigns table card */}
                <div className={`min-w-0 ${CARD}`}>
                    <div className="border-b border-[#eef1f4] px-5 py-4"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
                    <div className="flex items-center gap-2 border-b border-[#eef1f4] px-5 py-3">
                        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
                        <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-4 bg-[#0268c0] px-5 py-3">
                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`h-3 rounded bg-white/30 ${i === 0 ? "w-24" : "flex-1"}`} />)}
                    </div>
                    {Array.from({ length: 5 }).map((_, r) => (
                        <div key={r} className="flex items-center gap-4 border-b border-[#eef1f4] px-5 py-4 last:border-0">
                            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-gray-200" />
                            {Array.from({ length: 4 }).map((_, c) => <div key={c} className={`h-3.5 ${P} ${c === 3 ? "w-10" : "flex-1"}`} />)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
