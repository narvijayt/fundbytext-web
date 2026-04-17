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
    active:    { bar: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-100",   label: "Active"    },
    upcoming:  { bar: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-100",      label: "Upcoming"  },
    completed: { bar: "bg-purple-400", badge: "bg-purple-50 text-purple-700 border-purple-100", label: "Completed" },
    draft:     { bar: "bg-gray-300",   badge: "bg-gray-100 text-gray-500 border-gray-200",     label: "Draft"     },
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
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <p className="text-sm text-gray-400 mt-0.5">Platform-wide stats as of {now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            {/* ── KPI cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
                {/* Total Raised */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Raised</p>
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{fmtUSD(totalRaised)}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className={`text-xs font-semibold ${raisedDelta.sign === "+" ? "text-green-600" : raisedDelta.sign === "-" ? "text-red-500" : "text-gray-400"}`}>
                            {raisedDelta.sign}{fmtUSD(thisWeekRaised)}
                        </span>
                        <span className="text-xs text-gray-400">this week</span>
                        {lastWeekRaised > 0 && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${raisedDelta.sign === "+" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                {raisedDelta.sign}{raisedDelta.pct.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Total Donations */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Donations</p>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{totalDonations.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className={`text-xs font-semibold ${countDelta.sign === "+" ? "text-green-600" : countDelta.sign === "-" ? "text-red-500" : "text-gray-400"}`}>
                            {countDelta.sign}{thisWeekCount}
                        </span>
                        <span className="text-xs text-gray-400">this week</span>
                        {lastWeekCount > 0 && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${countDelta.sign === "+" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                {countDelta.sign}{countDelta.pct.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Campaigns */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaigns</p>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{(statusMap["active"] ?? 0).toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-semibold text-green-600">{statusMap["active"] ?? 0} active</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{totalCampaigns} total</span>
                    </div>
                </div>

                {/* Users */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Users</p>
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{totalUsers.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-semibold text-green-600">+{newUsersThisMonth}</span>
                        <span className="text-xs text-gray-400">this month</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{orgCount} orgs</span>
                    </div>
                </div>
            </div>

            {/* ── 30-day chart ────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Daily Donations — Last 30 Days</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtUSD(chartTotal)} total · dashed line = daily average</p>
                    </div>
                </div>
                <DailyDonationsChart data={chartData} />
            </div>

            {/* ── Two-column section ───────────────────────────────────────────── */}
            <div className="grid grid-cols-[1fr_320px] gap-6 items-start">

                {/* Top Campaigns */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800">Top Campaigns</h2>
                        <Link href="/admin/campaigns" className="text-xs font-semibold text-[#0268c0] hover:underline">
                            View all
                        </Link>
                    </div>
                    {topCampaigns.length === 0 ? (
                        <p className="px-6 py-8 text-sm text-gray-400 text-center">No campaigns yet.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                                    <th className="text-left px-6 py-3">Campaign</th>
                                    <th className="text-left px-6 py-3">Status</th>
                                    <th className="text-right px-6 py-3">Raised</th>
                                    <th className="text-right px-6 py-3">Donations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topCampaigns.map((c) => {
                                    const raised = parseFloat(c.total_raised.toString());
                                    const goal   = c.goal_amount ? parseFloat(c.goal_amount.toString()) : null;
                                    const pct    = goal && goal > 0 ? Math.min(100, (raised / goal) * 100) : null;
                                    const sc     = STATUS_COLORS[c.status] ?? STATUS_COLORS.draft;
                                    return (
                                        <tr key={c.slug} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <Link href={`/admin/campaigns/${c.slug}`}
                                                    className="font-medium text-gray-900 hover:text-[#0268c0] transition-colors line-clamp-1">
                                                    {c.name ?? "Untitled"}
                                                </Link>
                                                {pct !== null && (
                                                    <div className="mt-1.5 h-1 w-full max-w-36 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#0268c0] rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${sc.badge}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800 tabular-nums">
                                                {fmtUSD(raised)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-400 text-xs tabular-nums">
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">Campaign Breakdown</h2>
                        <div className="space-y-3">
                            {STATUS_ORDER.map((s) => {
                                const count = statusMap[s] ?? 0;
                                const pct   = totalCampaigns > 0 ? (count / totalCampaigns) * 100 : 0;
                                const sc    = STATUS_COLORS[s];
                                return (
                                    <div key={s}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-600">{sc.label}</span>
                                            <span className="text-xs font-bold text-gray-700">{count}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${sc.bar}`}
                                                style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">{totalCampaigns} total campaigns</p>
                    </div>

                    {/* Recent Donations */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-800">Recent Donations</h2>
                            <Link href="/admin/donations" className="text-xs font-semibold text-[#0268c0] hover:underline">
                                View all
                            </Link>
                        </div>
                        {recentDonations.length === 0 ? (
                            <p className="px-5 py-6 text-xs text-gray-400 text-center">No donations yet.</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentDonations.map((d) => {
                                    const name = d.is_anonymous
                                        ? "Anonymous"
                                        : `${d.donor_first_name} ${d.donor_last_name}`.trim();
                                    return (
                                        <div key={d.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                                                <Link href={`/admin/campaigns/${d.campaign.slug}`}
                                                    className="text-[10px] text-gray-400 hover:text-[#0268c0] transition-colors truncate block">
                                                    {d.campaign.name ?? "Untitled"}
                                                </Link>
                                                <p className="text-[10px] text-gray-300 mt-0.5">{fmtDate(d.created_at)}</p>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 shrink-0">
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
