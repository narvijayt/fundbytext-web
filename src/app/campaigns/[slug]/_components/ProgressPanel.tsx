import type { RecentDonation } from "../page";

type Props = {
    totalRaised:     number;
    goalAmount:      number | null;
    pct:             number;
    daysLeft:        number | null;
    donorCount:      number;
    recentDonations: RecentDonation[];
    accent:          string;
    campaignSlug:    string;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ProgressPanel({
    totalRaised,
    goalAmount,
    pct,
    daysLeft,
    donorCount,
    recentDonations,
    accent,
    campaignSlug,
}: Props) {
    return (
        <div className="space-y-4 lg:sticky lg:top-20">

            {/* ── Raised card ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
                {/* Amount raised */}
                <p className="text-3xl font-extrabold text-gray-900">{fmt(totalRaised)}</p>
                {goalAmount && (
                    <p className="text-sm text-gray-500 mt-0.5">
                        raised of <span className="font-semibold text-gray-700">{fmt(goalAmount)}</span> goal
                    </p>
                )}

                {/* Progress bar */}
                <div className="mt-3 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#22c55e" }}
                    />
                </div>

                {/* Stats row */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                        <span className="font-bold text-gray-800">{donorCount}</span> donor{donorCount !== 1 ? "s" : ""}
                    </span>
                    {daysLeft !== null && (
                        <span>
                            <span className="font-bold text-gray-800">{daysLeft}</span> day{daysLeft !== 1 ? "s" : ""} left
                        </span>
                    )}
                    {pct >= 100 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">Goal reached!</span>
                    )}
                </div>

                {/* Share + Donate */}
                <div className="mt-4 space-y-2">
                    {/* Facebook share */}
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                            `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/campaigns/${campaignSlug}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ background: "#1877F2" }}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                        </svg>
                        Share on Facebook
                    </a>

                    {/* Donate */}
                    <a
                        href={`/campaigns/${campaignSlug}/donate`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold shadow-md transition-transform hover:scale-[1.02]"
                        style={{ background: accent }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        Donate Now
                    </a>
                </div>
            </div>

            {/* ── Recent donors ────────────────────────────────────── */}
            {recentDonations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Recent Donors</h3>
                    <ul className="space-y-3">
                        {recentDonations.map((d, i) => (
                            <li key={i} className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ background: accent }}>
                                    {d.is_anonymous ? "?" : d.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{d.display_name}</p>
                                </div>
                                <p className="text-xs font-bold text-gray-700 shrink-0">{fmt(d.amount)}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
