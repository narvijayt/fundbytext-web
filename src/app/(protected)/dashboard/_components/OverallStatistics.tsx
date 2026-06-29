export type Stat = { label: string; value: string };

// Single bar split into 4 columns (desktop) / 2 columns (tablet+mobile), divided
// by hairlines — achieved with a 1px gap over the divider colour + white cells.
export default function OverallStatistics({ stats }: { stats: Stat[] }) {
    return (
        <section>
            <h2 className="mb-5 text-[20px] font-black tracking-[-0.3px] text-[#003060]">Overall Statistics</h2>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#e7e9eb] bg-[#e7e9eb] shadow-[0px_12px_12px_-8px_rgba(0,48,96,0.04),0px_32px_40px_-16px_rgba(2,104,192,0.10)] xl:grid-cols-4">
                {stats.map((s, i) => (
                    <div key={i} className="flex flex-col gap-2.5 bg-white p-5">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase leading-snug tracking-[0.5px] text-[#9aa7b8]">{s.label}</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/dashboard/stat-mascot.svg" alt="" className="h-7 w-auto shrink-0" />
                        </div>
                        <p className="text-[20px] font-bold leading-none text-[#003060] sm:text-[22px]">{s.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
