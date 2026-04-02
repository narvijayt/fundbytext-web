function fmt(n: number | null) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(d: Date) {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export type DonationFeedItem = {
    id: string;
    amount: { toString(): string };
    donor_display_name: string | null;
    donor_first_name: string | null;
    donor_last_name: string | null;
    is_anonymous: boolean;
    created_at: Date;
};

type Props = {
    donations: DonationFeedItem[];
};

export default function LiveDonationFeed({ donations }: Props) {
    return (
        <div className="w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h2 className="text-sm font-bold text-gray-900">Live Donation Feed</h2>
                    </div>
                    <span className="text-xs text-gray-400">{donations.length} total</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-150 overflow-y-auto">
                    {donations.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <p className="text-sm text-gray-400">No donations yet.</p>
                            <p className="text-xs text-gray-300 mt-1">Donations will appear here in real time.</p>
                        </div>
                    ) : (
                        donations.map((d) => {
                            const displayName = d.is_anonymous
                                ? "Anonymous"
                                : (d.donor_display_name ?? `${d.donor_first_name} ${d.donor_last_name}`);
                            const initials = d.is_anonymous
                                ? "?"
                                : displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                                <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                        <p className="text-xs text-gray-400">{timeAgo(d.created_at)}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 shrink-0">
                                        {fmt(parseFloat(d.amount.toString()))}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
