import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/enums";
import AdminDonationSearchInput from "./_components/AdminDonationSearchInput";
import AdminDonationSortSelect  from "./_components/AdminDonationSortSelect";
import FlagDonationButton from "./_components/FlagDonationButton";

const PAGE_SIZE = 10;

const TH_CLS = "px-4 py-3.5 text-left text-[13px] font-semibold";

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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-black text-[#003060]">Donations</h1>
                    <p className="mt-0.5 text-[13px] text-[#9aa7b8]">{total.toLocaleString()} completed</p>
                </div>
                <a
                    href={exportUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0268c0] px-4 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-105"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </a>
            </div>

            {/* Filters + search */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <Suspense>
                    <AdminDonationSearchInput defaultValue={query} />
                </Suspense>
                <div className="flex items-center gap-1 rounded-xl border border-[#e7e9eb] bg-white p-1 text-[13px] font-semibold shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
                    {(["all", "flagged", "anonymous"] as const).map((f) => (
                        <Link
                            key={f}
                            href={buildUrl({ filter: f !== "all" ? f : undefined, page: undefined })}
                            className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                                filter === f ? "bg-[#0268c0] text-white" : "text-[#7e8a96] hover:bg-gray-50 hover:text-[#003060]"
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
            <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-225">
                    <thead>
                        <tr className="bg-[#0268c0] text-white">
                            <th className={`${TH_CLS} w-10 pl-5`}>#</th>
                            <th className={TH_CLS}>Donor</th>
                            <th className={TH_CLS}>Campaign</th>
                            <th className={TH_CLS}>Attributed To</th>
                            <th className={`${TH_CLS} text-right`}>Amount</th>
                            <th className={TH_CLS}>Payment</th>
                            <th className={TH_CLS}>Stripe ID</th>
                            <th className={TH_CLS}>Date</th>
                            <th className="py-3.5 pl-4 pr-5" />
                        </tr>
                    </thead>
                    <tbody>
                        {donations.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No donations found.</td>
                            </tr>
                        )}
                        {donations.map((d, i) => (
                            <tr key={d.id} className={`border-b border-[#eef1f4] transition-colors last:border-0 ${d.is_flagged ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-[#f7f9fb]"}`}>
                                {/* # */}
                                <td className="py-3.5 pl-5 pr-4 text-xs tabular-nums text-[#9aa7b8]">
                                    {(page - 1) * PAGE_SIZE + i + 1}
                                </td>

                                {/* Donor */}
                                <td className="px-4 py-3.5">
                                    <p className="text-[13px] font-medium text-[#003060]">
                                        {d.donor_first_name} {d.donor_last_name}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                        {d.donor_email && (
                                            <p className="text-xs text-[#7e8a96]">{d.donor_email}</p>
                                        )}
                                        {d.is_anonymous && (
                                            <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Anonymous</span>
                                        )}
                                        {d.is_flagged && (
                                            <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Flagged</span>
                                        )}
                                    </div>
                                    {d.is_flagged && d.flag_note && (
                                        <p className="mt-0.5 max-w-45 truncate text-xs text-red-500" title={d.flag_note}>{d.flag_note}</p>
                                    )}
                                </td>

                                {/* Campaign */}
                                <td className="px-4 py-3.5">
                                    <Link href={`/admin/campaigns/${d.campaign.slug}`} className="text-[13px] font-medium text-[#0268c0] hover:underline">
                                        {d.campaign.name ?? "Untitled"}
                                    </Link>
                                </td>

                                {/* Attributed participant */}
                                <td className="px-4 py-3.5 text-[13px] text-[#7e8a96]">
                                    {d.member ? (
                                        d.member.user_id ? (
                                            <Link href={`/admin/users/${d.member.user_id}`} className="text-[#0268c0] hover:underline">
                                                {d.member.first_name} {d.member.last_name}
                                            </Link>
                                        ) : `${d.member.first_name} ${d.member.last_name}`
                                    ) : <span className="text-[#9aa7b8]">General Fund</span>}
                                </td>

                                {/* Amount */}
                                <td className="px-4 py-3.5 text-right font-bold text-[#003060]">{fmtUSD(d.amount)}</td>

                                {/* Payment details */}
                                <td className="px-4 py-3.5">
                                    {d.card_brand ? (
                                        <div className="text-[13px]">
                                            <p className="font-medium capitalize text-[#003060]">{d.card_brand} ···· {d.card_last4}</p>
                                            {d.card_exp_month && d.card_exp_year && (
                                                <p className="text-xs text-[#9aa7b8]">{String(d.card_exp_month).padStart(2, "0")}/{d.card_exp_year}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs capitalize text-[#7e8a96]">{d.payment_method}</span>
                                    )}
                                    {d.donor_country && <p className="mt-0.5 text-[10px] text-[#9aa7b8]">{d.donor_country}</p>}
                                </td>

                                {/* Stripe ID */}
                                <td className="px-4 py-3.5">
                                    {d.stripe_payment_intent_id ? (
                                        <span className="select-all font-mono text-xs text-[#7e8a96]" title={d.stripe_payment_intent_id}>
                                            {d.stripe_payment_intent_id.slice(0, 20)}…
                                        </span>
                                    ) : <span className="text-xs text-[#9aa7b8]">—</span>}
                                </td>

                                {/* Date */}
                                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#7e8a96]">{fmtDateTime(d.created_at)}</td>

                                {/* Flag */}
                                <td className="py-3.5 pl-4 pr-5">
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-[#7e8a96]">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1.5">
                        {page > 1 ? (
                            <Link href={buildUrl({ page: String(page - 1) })} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </Link>
                        ) : (
                            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                            </span>
                        )}
                        {page < totalPages ? (
                            <Link href={buildUrl({ page: String(page + 1) })} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] transition-colors hover:bg-gray-50">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </Link>
                        ) : (
                            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e9eb] text-[#7e8a96] opacity-40">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
