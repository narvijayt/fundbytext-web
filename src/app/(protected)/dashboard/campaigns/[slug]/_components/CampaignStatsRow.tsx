function fmt(n: number | null) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
    raisedAmt: number;
    goalAmt: number | null;
    donationCount: number;
    daysLeft: number | null;
    endDate: Date | null;
};

export default function CampaignStatsRow({ raisedAmt, goalAmt, donationCount, daysLeft, endDate }: Props) {
    const pct = goalAmt && goalAmt > 0 ? Math.min(100, Math.round((raisedAmt / goalAmt) * 100)) : null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Amount Raised</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(raisedAmt)}</p>
                {goalAmt && (
                    <p className="text-xs text-gray-400 mt-0.5">of {fmt(goalAmt)} goal</p>
                )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{pct !== null ? `${pct}%` : "—"}</p>
                {pct !== null && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{donationCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">completed payments</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Days Left</p>
                <p className="text-2xl font-bold text-gray-900">{daysLeft !== null ? daysLeft : "—"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {endDate ? `Ends ${fmtDate(endDate)}` : "No end date set"}
                </p>
            </div>
        </div>
    );
}
