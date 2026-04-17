import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/enums";
import AdminDonationSearchInput from "./_components/AdminDonationSearchInput";
import AdminDonationSortSelect  from "./_components/AdminDonationSortSelect";
import FlagDonationButton from "./_components/FlagDonationButton";

const PAGE_SIZE = 10;

function fmtUSD(n: string | number | { toString(): string }) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(n.toString()));
}
function fmtDateTime(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " at "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function AdminDonationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp     = await searchParams;
    const query  = typeof sp.q      === "string" ? sp.q.trim()                         : "";
    const page   = typeof sp.page   === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;
    const filter = typeof sp.filter === "string" ? sp.filter                           : "all";
    const sort   = typeof sp.sort   === "string" ? sp.sort                             : "newest";

    const where = {
        payment_status: PaymentStatus.completed,
        ...(query ? {
            OR: [
                { donor_first_name:        { contains: query, mode: "insensitive" as const } },
                { donor_last_name:         { contains: query, mode: "insensitive" as const } },
                { donor_email:             { contains: query, mode: "insensitive" as const } },
                { stripe_payment_intent_id:{ contains: query, mode: "insensitive" as const } },
                { campaign: { name:        { contains: query, mode: "insensitive" as const } } },
            ],
        } : {}),
        ...(filter === "flagged"   ? { is_flagged: true }    : {}),
        ...(filter === "anonymous" ? { is_anonymous: true }  : {}),
    };

    const orderBy =
        sort === "oldest"  ? { created_at: "asc"  as const }
        : sort === "highest" ? { amount:   "desc" as const }
        : sort === "lowest"  ? { amount:   "asc"  as const }
        : { created_at: "desc" as const };

    const [donations, total] = await Promise.all([
        prisma.donation.findMany({
            where,
            select: {
                id:                      true,
                amount:                  true,
                donor_first_name:        true,
                donor_last_name:         true,
                donor_email:             true,
                donor_country:           true,
                is_anonymous:            true,
                is_flagged:              true,
                flag_note:               true,
                stripe_payment_intent_id: true,
                payment_method:          true,
                card_brand:              true,
                card_last4:              true,
                card_exp_month:          true,
                card_exp_year:           true,
                created_at:              true,
                campaign: { select: { slug: true, name: true } },
                member:   { select: { user_id: true, first_name: true, last_name: true } },
            },
            orderBy,
            skip:  (page - 1) * PAGE_SIZE,
            take:  PAGE_SIZE,
        }),
        prisma.donation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildUrl = (params: Record<string, string | undefined>) => {
        const merged = {
            q:      query  || undefined,
            page:   page   > 1 ? String(page) : undefined,
            filter: filter !== "all"    ? filter : undefined,
            sort:   sort   !== "newest" ? sort   : undefined,
            ...params,
        };
        const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
        return `/admin/donations${qs ? `?${qs}` : ""}`;
    };

    const exportUrl = `/api/v1/admin/donations/export?q=${encodeURIComponent(query)}&filter=${filter}&sort=${sort}`;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} completed</p>
                </div>
                <a
                    href={exportUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </a>
            </div>

            {/* Filters + search */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Suspense>
                    <AdminDonationSearchInput defaultValue={query} />
                </Suspense>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs font-semibold">
                    {(["all", "flagged", "anonymous"] as const).map((f) => (
                        <Link
                            key={f}
                            href={buildUrl({ filter: f !== "all" ? f : undefined, page: undefined })}
                            className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {f}
                        </Link>
                    ))}
                </div>

                <Suspense>
                    <AdminDonationSortSelect defaultValue={sort} />
                </Suspense>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-225">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left px-5 py-3 w-10">#</th>
                            <th className="text-left px-5 py-3">Donor</th>
                            <th className="text-left px-5 py-3">Campaign</th>
                            <th className="text-left px-5 py-3">Attributed To</th>
                            <th className="text-right px-5 py-3">Amount</th>
                            <th className="text-left px-5 py-3">Payment</th>
                            <th className="text-left px-5 py-3">Stripe ID</th>
                            <th className="text-left px-5 py-3">Date</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {donations.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-12 text-gray-400">No donations found.</td>
                            </tr>
                        )}
                        {donations.map((d, i) => (
                            <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${d.is_flagged ? "bg-red-50/40" : ""}`}>
                                {/* # */}
                                <td className="px-5 py-3 text-xs text-gray-400 tabular-nums">
                                    {(page - 1) * PAGE_SIZE + i + 1}
                                </td>

                                {/* Donor */}
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-900">
                                        {d.donor_first_name} {d.donor_last_name}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                        {d.donor_email && (
                                            <p className="text-xs text-gray-400">{d.donor_email}</p>
                                        )}
                                        {d.is_anonymous && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Anonymous</span>
                                        )}
                                        {d.is_flagged && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Flagged</span>
                                        )}
                                    </div>
                                    {d.is_flagged && d.flag_note && (
                                        <p className="text-xs text-red-500 mt-0.5 max-w-45 truncate" title={d.flag_note}>{d.flag_note}</p>
                                    )}
                                </td>

                                {/* Campaign */}
                                <td className="px-5 py-3">
                                    <Link href={`/admin/campaigns/${d.campaign.slug}`} className="text-[#0268c0] hover:underline font-medium text-xs">
                                        {d.campaign.name ?? "Untitled"}
                                    </Link>
                                </td>

                                {/* Attributed participant */}
                                <td className="px-5 py-3 text-xs text-gray-500">
                                    {d.member ? (
                                        d.member.user_id ? (
                                            <Link href={`/admin/users/${d.member.user_id}`} className="text-[#0268c0] hover:underline">
                                                {d.member.first_name} {d.member.last_name}
                                            </Link>
                                        ) : `${d.member.first_name} ${d.member.last_name}`
                                    ) : <span className="text-gray-300">General Fund</span>}
                                </td>

                                {/* Amount */}
                                <td className="px-5 py-3 text-right font-semibold text-gray-800">{fmtUSD(d.amount)}</td>

                                {/* Payment details */}
                                <td className="px-5 py-3">
                                    {d.card_brand ? (
                                        <div className="text-xs text-gray-600">
                                            <p className="font-semibold capitalize">{d.card_brand} ···· {d.card_last4}</p>
                                            {d.card_exp_month && d.card_exp_year && (
                                                <p className="text-gray-400">{String(d.card_exp_month).padStart(2, "0")}/{d.card_exp_year}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 capitalize">{d.payment_method}</span>
                                    )}
                                    {d.donor_country && <p className="text-[10px] text-gray-400 mt-0.5">{d.donor_country}</p>}
                                </td>

                                {/* Stripe ID */}
                                <td className="px-5 py-3">
                                    {d.stripe_payment_intent_id ? (
                                        <span className="text-xs font-mono text-gray-500 select-all" title={d.stripe_payment_intent_id}>
                                            {d.stripe_payment_intent_id.slice(0, 20)}…
                                        </span>
                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                </td>

                                {/* Date */}
                                <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(d.created_at)}</td>

                                {/* Flag */}
                                <td className="px-5 py-3">
                                    <FlagDonationButton
                                        donationId={d.id}
                                        isFlagged={d.is_flagged}
                                        flagNote={d.flag_note ?? ""}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Previous</Link>
                        )}
                        {page < totalPages && (
                            <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Next</Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
