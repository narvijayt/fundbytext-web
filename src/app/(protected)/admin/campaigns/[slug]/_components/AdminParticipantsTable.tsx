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

const RANK_STYLES: Record<number, string> = {
    1: "bg-amber-100 text-amber-700",
    2: "bg-slate-100 text-slate-600",
    3: "bg-orange-100 text-orange-700",
};

const TH_CLS = "px-5 py-3.5 text-left text-[13px] font-semibold";

export default function AdminParticipantsTable({
    participants,
    goalAmount,
}: {
    participants: Participant[];
    goalAmount:   number | null;
}) {
    return (
        <section id="participants" className="scroll-mt-6">
            <div className="mb-4 flex items-center gap-2.5">
                <h2 className="text-[20px] font-black text-[#003060]">Participants</h2>
                <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#5b6b7c]">{participants.length}</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="bg-[#0268c0] text-white">
                                <th className={`${TH_CLS} w-16 pl-5`}>Rank</th>
                                <th className={TH_CLS}>Name</th>
                                <th className={TH_CLS}>Email</th>
                                <th className={`${TH_CLS} text-right`}>Donors Added</th>
                                <th className={`${TH_CLS} text-right`}>Raised</th>
                                {goalAmount && <th className={`${TH_CLS} text-right pr-5`}>Progress</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((p, i) => {
                                const rank = i + 1;
                                const pct  = goalAmount ? Math.min(100, Math.round((p.raised / goalAmount) * 100)) : null;
                                return (
                                    <tr key={p.id} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                        <td className="py-3.5 pl-5 pr-4">
                                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${RANK_STYLES[rank] ?? "bg-[#eef2f7] text-[#9aa7b8]"}`}>{rank}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-semibold text-[#003060]">
                                                {p.userId ? <Link href={`/admin/users/${p.userId}`} className="text-[#0268c0] hover:underline">{p.name}</Link> : p.name}
                                            </span>
                                            {p.isOrganizer && <span className="ml-1.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">Organizer</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] text-[#7e8a96]">
                                            {p.email && p.userId ? <Link href={`/admin/users/${p.userId}`} className="hover:text-[#0268c0] hover:underline">{p.email}</Link> : (p.email ?? <span className="text-gray-300">—</span>)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-[13px] text-[#7e8a96]">{p.donorsAdded}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-[#003060]">{fmtUSD(p.raised)}</td>
                                        {goalAmount && (
                                            <td className="py-3.5 pl-4 pr-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#eef2f7]">
                                                        <div className="h-full rounded-full bg-[#f47435]" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="w-9 text-right text-xs font-medium text-[#9aa7b8]">{pct}%</span>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
