import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, CampaignStatus } from "@/generated/prisma/enums";
import DailyDonationsChart from "./_components/DailyDonationsChart";

function fmtUSD(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + " at "
        + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function delta(curr: number, prev: number): { sign: "+" | "-" | ""; pct: number } {
    if (prev === 0) return { sign: curr > 0 ? "+" : "", pct: 0 };
    const pct = ((curr - prev) / prev) * 100;
    return { sign: pct >= 0 ? "+" : "-", pct: Math.abs(pct) };
}

const STATUS_COLORS: Record<string, { bar: string; badge: string; label: string }> = {
    active:    { bar: "bg-[#28c45d]",  badge: "bg-green-100 text-green-700",   label: "Active"    },
    upcoming:  { bar: "bg-[#0268c0]",  badge: "bg-blue-100 text-blue-700",     label: "Upcoming"  },
    completed: { bar: "bg-purple-400", badge: "bg-purple-100 text-purple-700", label: "Completed" },
    draft:     { bar: "bg-gray-300",   badge: "bg-gray-100 text-gray-500",     label: "Draft"     },
};

export default async function AdminOverviewPage() {
    const now        = new Date();
    const weekStart  = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
        allTimeStats,
        thisWeekStats,
        lastWeekStats,
        totalUsers,
        newUsersThisMonth,
        campaignGroups,
        topCampaigns,
        recentDonations,
        dailyRaw,
        orgCount,
    ] = await Promise.all([
        prisma.donation.aggregate({
            where:  { payment_status: PaymentStatus.completed },
            _sum:   { net_amount: true },
            _count: { _all: true },
        }),
        prisma.donation.aggregate({
            where:  { payment_status: PaymentStatus.completed, created_at: { gte: weekStart } },
            _sum:   { net_amount: true },
            _count: { _all: true },
        }),
        prisma.donation.aggregate({
            where:  { payment_status: PaymentStatus.completed, created_at: { gte: lastWeekStart, lt: lastWeekEnd } },
            _sum:   { net_amount: true },
            _count: { _all: true },
        }),
        prisma.user.count(),
        prisma.user.count({ where: { created_at: { gte: monthStart }, deleted_at: null } }),
        prisma.campaign.groupBy({
            by:     ["status"],
            _count: { _all: true },
        }),
        prisma.campaign.findMany({
            where:   { status: { in: [CampaignStatus.active, CampaignStatus.completed, CampaignStatus.upcoming] } },
            orderBy: { total_raised: "desc" },
            take:    8,
            select: {
                slug:         true,
                name:         true,
                status:       true,
                total_raised: true,
                goal_amount:  true,
                campaign_type: true,
                _count: { select: { donations: true } },
            },
        }),
        prisma.donation.findMany({
            where:   { payment_status: PaymentStatus.completed },
            orderBy: { created_at: "desc" },
            take:    8,
            select: {
                id:                 true,
                amount:             true,
                donor_first_name:   true,
                donor_last_name:    true,
                is_anonymous:       true,
                created_at:         true,
                campaign: { select: { slug: true, name: true } },
            },
        }),
        prisma.donation.findMany({
            where:   { payment_status: PaymentStatus.completed, created_at: { gte: thirtyDaysAgo } },
            select:  { amount: true, created_at: true },
            orderBy: { created_at: "asc" },
        }),
        prisma.organization.count(),
    ]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const totalRaised      = parseFloat((allTimeStats._sum.net_amount ?? 0).toString());
    const totalDonations   = allTimeStats._count._all;
    const thisWeekRaised   = parseFloat((thisWeekStats._sum.net_amount ?? 0).toString());
    const thisWeekCount    = thisWeekStats._count._all;
    const lastWeekRaised   = parseFloat((lastWeekStats._sum.net_amount ?? 0).toString());
    const lastWeekCount    = lastWeekStats._count._all;

    const raisedDelta      = delta(thisWeekRaised, lastWeekRaised);
    const countDelta       = delta(thisWeekCount,  lastWeekCount);

    const statusMap        = Object.fromEntries(campaignGroups.map((g) => [g.status, g._count._all]));
    const totalCampaigns   = Object.values(statusMap).reduce((s, n) => s + n, 0);

    // Build 30-day chart data: one entry per calendar day
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const don of dailyRaw) {
        const key = don.created_at.toISOString().slice(0, 10);
        if (key in dailyMap) dailyMap[key] = (dailyMap[key] ?? 0) + parseFloat(don.amount.toString());
    }
    const chartData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));
    const chartTotal = chartData.reduce((s, d) => s + d.amount, 0);

    const STATUS_ORDER = ["active", "upcoming", "completed", "draft"] as const;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-[22px] font-black text-[#003060]">Overview</h1>
                <p className="mt-0.5 text-[13px] text-[#9aa7b8]">Platform-wide stats as of {now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            {/* ── KPI cards — one white card divided into stat cells ─────────── */}
            <div className="flex flex-col divide-y divide-[#eef1f4] overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] lg:flex-row lg:divide-x lg:divide-y-0">
                {/* Total Raised */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Total Raised</p>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
                            <svg className="h-4 w-4 text-[#28c45d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{fmtUSD(totalRaised)}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${raisedDelta.sign === "+" ? "text-[#28c45d]" : raisedDelta.sign === "-" ? "text-red-500" : "text-[#9aa7b8]"}`}>
                            {raisedDelta.sign}{fmtUSD(thisWeekRaised)}
                        </span>
                        <span className="text-xs text-[#9aa7b8]">this week</span>
                        {lastWeekRaised > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${raisedDelta.sign === "+" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {raisedDelta.sign}{raisedDelta.pct.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Total Donations */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Donations</p>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <svg className="h-4 w-4 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{totalDonations.toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${countDelta.sign === "+" ? "text-[#28c45d]" : countDelta.sign === "-" ? "text-red-500" : "text-[#9aa7b8]"}`}>
                            {countDelta.sign}{thisWeekCount}
                        </span>
                        <span className="text-xs text-[#9aa7b8]">this week</span>
                        {lastWeekCount > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${countDelta.sign === "+" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {countDelta.sign}{countDelta.pct.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Campaigns */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Campaigns</p>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{(statusMap["active"] ?? 0).toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#28c45d]">{statusMap["active"] ?? 0} active</span>
                        <span className="text-xs text-[#c9d3dd]">·</span>
                        <span className="text-xs text-[#9aa7b8]">{totalCampaigns} total</span>
                    </div>
                </div>

                {/* Users */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">Users</p>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                            <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-[22px] font-bold tracking-[-0.5px] text-[#003060]">{totalUsers.toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#28c45d]">+{newUsersThisMonth}</span>
                        <span className="text-xs text-[#9aa7b8]">this month</span>
                        <span className="text-xs text-[#c9d3dd]">·</span>
                        <span className="text-xs text-[#9aa7b8]">{orgCount} orgs</span>
                    </div>
                </div>
            </div>

            {/* ── 30-day chart ────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[#e7e9eb] bg-white p-6 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-[15px] font-bold text-[#003060]">Daily Donations — Last 30 Days</h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#9aa7b8]">
                            <span><span className="font-semibold text-[#003060]">{fmtUSD(chartTotal)}</span> total</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1.5">
                                <span aria-hidden className="inline-block h-0 w-3.5 border-t-2 border-dashed border-[#f59e0b]" />
                                daily average
                            </span>
                        </p>
                    </div>
                </div>
                <DailyDonationsChart data={chartData} />
            </div>

            {/* ── Two-column section ───────────────────────────────────────────── */}
            <div className="grid grid-cols-[1fr_320px] gap-6 items-start">

                {/* Top Campaigns */}
                <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                    <div className="flex items-center justify-between gap-3 bg-[#0268c0] px-5 py-3.5 text-white">
                        <h2 className="text-[15px] font-bold">Top Campaigns</h2>
                        <Link href="/admin/campaigns" className="text-[13px] font-semibold text-white/90 transition-colors hover:text-white">
                            View all
                        </Link>
                    </div>
                    {topCampaigns.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No campaigns yet.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#e7e9eb] text-[11px] font-bold uppercase tracking-[0.5px] text-[#003060]">
                                    <th className="py-3 pl-5 pr-4 text-left">Campaign</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Raised</th>
                                    <th className="py-3 pl-4 pr-5 text-right">Donations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCampaigns.map((c) => {
                                    const raised = parseFloat(c.total_raised.toString());
                                    const goal   = c.goal_amount ? parseFloat(c.goal_amount.toString()) : null;
                                    const pct    = goal && goal > 0 ? Math.min(100, (raised / goal) * 100) : null;
                                    const sc     = STATUS_COLORS[c.status] ?? STATUS_COLORS.draft;
                                    return (
                                        <tr key={c.slug} className="border-b border-[#eef1f4] transition-colors last:border-0 hover:bg-[#f7f9fb]">
                                            <td className="py-3.5 pl-5 pr-4">
                                                <Link href={`/admin/campaigns/${c.slug}`}
                                                    className="line-clamp-1 text-[13px] font-medium text-[#003060] transition-colors hover:text-[#0268c0]">
                                                    {c.name ?? "Untitled"}
                                                </Link>
                                                {pct !== null && (
                                                    <div className="mt-1.5 h-1 w-full max-w-36 overflow-hidden rounded-full bg-[#eef1f4]">
                                                        <div className="h-full rounded-full bg-[#0268c0]" style={{ width: `${pct}%` }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${sc.badge}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums text-[#003060]">
                                                {fmtUSD(raised)}
                                            </td>
                                            <td className="py-3.5 pl-4 pr-5 text-right text-xs tabular-nums text-[#7e8a96]">
                                                {c._count.donations.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Campaign Status Breakdown */}
                    <div className="rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <h2 className="mb-4 text-[15px] font-bold text-[#003060]">Campaign Breakdown</h2>
                        <div className="space-y-3">
                            {STATUS_ORDER.map((s) => {
                                const count = statusMap[s] ?? 0;
                                const pct   = totalCampaigns > 0 ? (count / totalCampaigns) * 100 : 0;
                                const sc    = STATUS_COLORS[s];
                                return (
                                    <div key={s}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-xs font-medium text-[#7e8a96]">{sc.label}</span>
                                            <span className="text-xs font-bold text-[#003060]">{count}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
                                            <div
                                                className={`h-full rounded-full ${sc.bar}`}
                                                style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-xs text-[#9aa7b8]">{totalCampaigns} total campaigns</p>
                    </div>

                    {/* Recent Donations */}
                    <div className="overflow-hidden rounded-2xl border border-[#e7e9eb] bg-white shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
                        <div className="flex items-center justify-between gap-3 bg-[#0268c0] px-5 py-3.5 text-white">
                            <h2 className="text-[15px] font-bold">Recent Donations</h2>
                            <Link href="/admin/donations" className="text-[13px] font-semibold text-white/90 transition-colors hover:text-white">
                                View all
                            </Link>
                        </div>
                        {recentDonations.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm italic text-[#9aa7b8]">No donations yet.</p>
                        ) : (
                            <div className="divide-y divide-[#eef1f4]">
                                {recentDonations.map((d) => {
                                    const name = d.is_anonymous
                                        ? "Anonymous"
                                        : `${d.donor_first_name} ${d.donor_last_name}`.trim();
                                    return (
                                        <div key={d.id} className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#f7f9fb]">
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-[#003060]">{name}</p>
                                                <Link href={`/admin/campaigns/${d.campaign.slug}`}
                                                    className="block truncate text-[11px] text-[#7e8a96] transition-colors hover:text-[#0268c0]">
                                                    {d.campaign.name ?? "Untitled"}
                                                </Link>
                                                <p className="mt-0.5 text-[10px] text-[#9aa7b8]">{fmtDate(d.created_at)}</p>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold text-[#28c45d]">
                                                {fmtUSD(parseFloat(d.amount.toString()))}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
