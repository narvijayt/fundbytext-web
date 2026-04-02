function fmt(n: number | null) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
    donationsByDay: { day: Date; total: number }[];
    chartMax: number;
};

export default function DonationChart({ donationsByDay, chartMax }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Progress Towards Your Goal</h2>
            <div className="flex items-end gap-1 h-32">
                {donationsByDay.map(({ day, total }, i) => {
                    const heightPct = (total / chartMax) * 100;
                    const isToday = i === donationsByDay.length - 1;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end" style={{ height: "100px" }}>
                                <div
                                    className={`w-full rounded-t-sm transition-all ${isToday ? "bg-orange-500" : "bg-orange-200"}`}
                                    style={{ height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%` }}
                                    title={`${fmtDate(day)}: ${fmt(total)}`}
                                />
                            </div>
                            {(i === 0 || i === 6 || i === 13) && (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Daily donations — last 14 days</p>
        </div>
    );
}
