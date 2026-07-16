import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";

// ── Types ────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "active" | "upcoming" | "completed";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",       label: "All Campaigns" },
    { key: "active",    label: "Active"         },
    { key: "upcoming",  label: "Upcoming"       },
    { key: "completed", label: "Completed"      },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; dot: string }> = {
    active:    { label: "Active",    bg: "#dcfce7", dot: "#22c55e" },
    upcoming:  { label: "Upcoming",  bg: "#dbeafe", dot: "#3b82f6" },
    completed: { label: "Completed", bg: "#ede9fe", dot: "#8b5cf6" },
};

function fmt(n: unknown) {
    const num = Number(n);
    if (!n || isNaN(num)) return null;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

// ── Data ─────────────────────────────────────────────────────────────────────

async function getCampaigns(filter: FilterKey, q: string) {
    const statusFilter = filter === "all"
        ? { in: [CampaignStatus.active, CampaignStatus.upcoming, CampaignStatus.completed] as CampaignStatus[] }
        : { equals: filter as CampaignStatus };

    return prisma.campaign.findMany({
        where: {
            // Private campaigns are members-only — the campaign page 403s them to
            // everyone else, so they must never be listed or searchable here either.
            visibility: "public",
            status: statusFilter,
            // Match name OR organisation: people search for "the softball one" and
            // for their school/club by name. Mirrors /api/v1/campaigns/search.
            ...(q ? {
                OR: [
                    { name:             { contains: q, mode: "insensitive" as const } },
                    { org_display_name: { contains: q, mode: "insensitive" as const } },
                    { organization:     { name: { contains: q, mode: "insensitive" as const } } },
                ],
            } : {}),
        },
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
        select: {
            slug:            true,
            name:            true,
            story:           true,
            status:          true,
            campaign_type:   true,
            goal_amount:     true,
            start_date:      true,
            end_date:        true,
            _count:          { select: { donations: true, donors: true, members: true } },
            donations:       { select: { amount: true } },
            media:           { where: { media_type: "hero" }, take: 1, select: { url: true } },
        },
    });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string; q?: string }>;
}) {
    const { filter: rawFilter, q = "" } = await searchParams;
    const filter = (FILTERS.some((f) => f.key === rawFilter) ? rawFilter : "all") as FilterKey;

    const campaigns = await getCampaigns(filter, q.trim());

    return (
        <div className="min-h-screen font-sans" style={{ background: "#f7faff" }}>

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-sm" style={{ background: "#0a1628" }}>
                <div className="flex items-center gap-6 text-sm text-white/70">
                    <Link href="/" className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Home
                    </Link>
                </div>
                <Link href="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1565C0" }}>
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">FundByText</span>
                </Link>
                <div className="flex items-center gap-4 text-sm">
                    <Link href="/login" className="text-white/70 hover:text-white transition-colors">Sign In</Link>
                    <Link href="/campaigns/create" className="px-4 py-1.5 rounded-full text-white font-semibold text-sm transition-colors" style={{ background: "#f97316" }}>
                        Start A Campaign
                    </Link>
                </div>
            </nav>

            {/* ── Hero header ────────────────────────────────────────────── */}
            <div className="px-6 pt-14 pb-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(160deg,#1a6fbf 0%,#1565C0 60%,#0d4fa8 100%)" }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
                <div className="relative z-10 max-w-2xl mx-auto">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">Browse Campaigns</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Find a Campaign to Support</h1>
                    <p className="text-blue-100 text-sm mb-8">Discover fundraisers from individuals and organizations — and make a difference today.</p>

                    {/* Search bar */}
                    <form method="GET" className="relative max-w-lg mx-auto">
                        <input type="hidden" name="filter" value={filter !== "all" ? filter : ""} />
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Search campaigns…"
                            className="w-full pl-11 pr-4 py-3 rounded-full text-sm text-gray-800 outline-none shadow-lg focus:ring-2 focus:ring-orange-400 bg-white"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                        </svg>
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-colors" style={{ background: "#f97316" }}>
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Filter tabs + count ─────────────────────────────────────── */}
            <div className="sticky top-14 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 overflow-x-auto">
                    <div className="flex items-center gap-1 py-1">
                        {FILTERS.map(({ key, label }) => {
                            const active = filter === key;
                            return (
                                <Link
                                    key={key}
                                    href={`/campaigns?filter=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                                    className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-colors ${
                                        active
                                            ? "text-blue-700 bg-blue-50"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap shrink-0 py-2">
                        {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* ── Campaign grid ───────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                {campaigns.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-700 mb-2">No campaigns found</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            {q ? `No results for "${q}".` : "There are no campaigns in this category yet."}
                        </p>
                        <Link href="/campaigns/create" className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-colors" style={{ background: "#f97316" }}>
                            Start the First One
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((c) => {
                            const heroImg  = c.media[0]?.url ?? null;
                            const raised   = c.donations.reduce((s, d) => s + Number(d.amount), 0);
                            const goal     = Number(c.goal_amount ?? 0);
                            const pct      = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : null;
                            const style    = STATUS_STYLE[c.status] ?? STATUS_STYLE.active;
                            const isOrg    = c.campaign_type === "organization";
                            const endDate  = c.end_date ? new Date(c.end_date) : null;
                            const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86_400_000)) : null;

                            return (
                                <Link
                                    key={c.slug}
                                    href={`/campaigns/${c.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-blue-100 flex flex-col"
                                >
                                    {/* Hero image */}
                                    <div className="relative h-44 bg-linear-to-br from-blue-100 to-blue-300 shrink-0">
                                        {heroImg ? (
                                            <Image src={heroImg} alt={c.name ?? ""} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg className="w-14 h-14 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                </svg>
                                            </div>
                                        )}

                                        {/* Overlay badges */}
                                        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/40 to-transparent" />
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: style.bg }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                                            <span style={{ color: style.dot }}>{style.label}</span>
                                        </div>
                                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/30 text-white backdrop-blur-sm">
                                            {isOrg ? "Organization" : "Individual"}
                                        </span>

                                        {daysLeft !== null && c.status === "active" && (
                                            <p className="absolute bottom-2 left-3 text-white text-xs font-bold">
                                                {daysLeft === 0 ? "Last day!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="flex flex-col flex-1 p-5 gap-3">
                                        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                                            {c.name ?? "Untitled Campaign"}
                                        </h3>

                                        {c.story && (
                                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{c.story}</p>
                                        )}

                                        {/* Progress bar */}
                                        {goal > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{ width: `${pct ?? 0}%`, background: c.status === "completed" ? "#8b5cf6" : "#22c55e" }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="font-semibold text-gray-700">{fmt(raised) ?? "$0"} raised</span>
                                                    <span>of {fmt(goal)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer stats */}
                                        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                            <span>
                                                {isOrg
                                                    ? `${c._count.members} participant${c._count.members !== 1 ? "s" : ""}`
                                                    : `${c._count.donors} donor${c._count.donors !== 1 ? "s" : ""}`}
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold text-blue-600 group-hover:gap-2 transition-all">
                                                View Campaign
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Start your own CTA */}
                <div className="mt-16 rounded-2xl px-8 py-10 text-center" style={{ background: "linear-gradient(135deg,#1565C0 0%,#0d4fa8 100%)" }}>
                    <h2 className="text-2xl font-extrabold text-white mb-2">Ready to start your own?</h2>
                    <p className="text-blue-200 text-sm mb-6">Create a campaign in minutes and start raising funds today.</p>
                    <Link href="/campaigns/create" className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-bold text-sm shadow-lg transition-transform hover:scale-105" style={{ background: "#f97316" }}>
                        Start A Campaign
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
