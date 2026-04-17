import Link from "next/link";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Participant = {
    id:           string;
    userId:       string | null;
    name:         string;
    email:        string | null;
    donorsAdded:  number;
    raised:       number;
    isOrganizer:  boolean;
};

export default function AdminParticipantsTable({
    participants,
    goalAmount,
}: {
    participants: Participant[];
    goalAmount:   number | null;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Participants</h2>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                        <th className="text-left px-6 py-3">Rank</th>
                        <th className="text-left px-6 py-3">Name</th>
                        <th className="text-left px-6 py-3">Email</th>
                        <th className="text-right px-6 py-3">Donors Added</th>
                        <th className="text-right px-6 py-3">Raised</th>
                        {goalAmount && <th className="text-right px-6 py-3">Progress</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {participants.map((p, i) => {
                        const rank = i + 1;
                        const pct  = goalAmount ? Math.min(100, Math.round((p.raised / goalAmount) * 100)) : null;
                        return (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        rank === 1 ? "bg-amber-100 text-amber-700"   :
                                        rank === 2 ? "bg-gray-100 text-gray-600"     :
                                        rank === 3 ? "bg-orange-100 text-orange-700" :
                                                     "bg-gray-50 text-gray-400"
                                    }`}>
                                        {rank}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900">
                                    {p.userId ? (
                                        <Link href={`/admin/users/${p.userId}`} className="text-[#0268c0] hover:underline">
                                            {p.name}
                                        </Link>
                                    ) : p.name}
                                    {p.isOrganizer && (
                                        <span className="ml-1.5 text-[10px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-600">Organizer</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-gray-400">
                                    {p.email && p.userId ? (
                                        <Link href={`/admin/users/${p.userId}`} className="hover:text-[#0268c0] hover:underline">
                                            {p.email}
                                        </Link>
                                    ) : (p.email ?? "—")}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-700">{p.donorsAdded}</td>
                                <td className="px-6 py-3 text-right font-semibold text-gray-800">{fmtUSD(p.raised)}</td>
                                {goalAmount && (
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
