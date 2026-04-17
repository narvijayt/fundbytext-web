import Link from "next/link";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDateTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " at "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type Donor = {
    id:            string;
    first_name:    string;
    last_name:     string;
    email:         string | null;
    phone:         string | null;
    status:        string;
    created_at:    number;
    isWalkIn:      boolean;
    isGeneralFund: boolean;
    isAnonymous:   boolean;
    assigned_member: { user_id: string | null; first_name: string; last_name: string } | null;
    added_by_member: { user_id: string | null; first_name: string; last_name: string } | null;
    donations:    { amount: number; donated_at: number }[];
};

const STATUS_COLORS: Record<string, string> = {
    donated:     "bg-green-50 text-green-700 border-green-100",
    contacted:   "bg-blue-50 text-blue-700 border-blue-100",
    not_donated: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AdminDonorsTable({
    donors,
    total,
    page,
    totalPages,
    prevHref,
    nextHref,
}: {
    donors:     Donor[];
    total:      number;
    page:       number;
    totalPages: number;
    prevHref:   string | null;
    nextHref:   string | null;
}) {
    const totalRaised = donors.reduce((s, d) => s + d.donations.reduce((ds, don) => ds + don.amount, 0), 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Donors</h2>
                <span className="text-sm text-gray-400">{total} added · {fmtUSD(totalRaised)} raised</span>
            </div>
            {donors.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No donors added yet.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-6 py-3">Name</th>
                            <th className="text-left px-6 py-3">Contact</th>
                            <th className="text-left px-6 py-3">Added By</th>
                        <th className="text-left px-6 py-3">Assigned To</th>
                            <th className="text-left px-6 py-3">Status</th>
                            <th className="text-right px-6 py-3">Donated</th>
                            <th className="text-left px-6 py-3">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {donors.map((d) => {
                            const total = d.donations.reduce((s, don) => s + don.amount, 0);
                            return (
                                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="font-medium text-gray-900">{d.first_name} {d.last_name}</p>
                                        {(d.isWalkIn || d.isGeneralFund || d.isAnonymous) && (
                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                {d.isWalkIn && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100">Walk-in</span>
                                                )}
                                                {d.isGeneralFund && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">General Fund</span>
                                                )}
                                                {d.isAnonymous && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Anonymous</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-xs">
                                        {d.email && <p>{d.email}</p>}
                                        {d.phone && <p>{d.phone}</p>}
                                        {!d.email && !d.phone && "—"}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">
                                        {d.added_by_member ? (
                                            d.added_by_member.user_id ? (
                                                <Link href={`/admin/users/${d.added_by_member.user_id}`} className="text-[#0268c0] hover:underline">
                                                    {d.added_by_member.first_name} {d.added_by_member.last_name}
                                                </Link>
                                            ) : (
                                                `${d.added_by_member.first_name} ${d.added_by_member.last_name}`
                                            )
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">
                                        {d.assigned_member ? (
                                            d.assigned_member.user_id ? (
                                                <Link href={`/admin/users/${d.assigned_member.user_id}`} className="text-[#0268c0] hover:underline">
                                                    {d.assigned_member.first_name} {d.assigned_member.last_name}
                                                </Link>
                                            ) : (
                                                `${d.assigned_member.first_name} ${d.assigned_member.last_name}`
                                            )
                                        ) : <span className="text-gray-300">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[d.status] ?? ""}`}>
                                            {d.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-semibold text-gray-700">
                                        {total > 0 ? fmtUSD(total) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(d.created_at)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
            {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {prevHref && (
                            <Link href={prevHref} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Previous</Link>
                        )}
                        {nextHref && (
                            <Link href={nextHref} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Next</Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
