import ParticipantActions from "../ParticipantActions";

function fmt(n: number | null) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export type ParticipantRow = {
    id: string;
    name: string;
    email: string;
    donorsAdded: number;
    raised: number;
    isOrganizer: boolean;
};

type Props = {
    participants: ParticipantRow[];
    isOrganizer: boolean;
    campaignSlug: string;
};

export default function ParticipantsTable({ participants, isOrganizer, campaignSlug }: Props) {
    if (participants.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Participants</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Rank</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Donors Added</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Amount Raised</th>
                            {isOrganizer && (
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400" />
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p, i) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3.5">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                                        {i + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                            {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{p.name}</p>
                                            <p className="text-xs text-gray-400">{p.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 text-right text-gray-700 font-medium">
                                    {p.donorsAdded}
                                </td>
                                <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                                    {fmt(p.raised)}
                                </td>
                                {isOrganizer && (
                                    <td className="px-6 py-3.5 text-right">
                                        <ParticipantActions
                                            memberId={p.id}
                                            campaignSlug={campaignSlug}
                                            name={p.name}
                                            isOrganizer={p.isOrganizer}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
