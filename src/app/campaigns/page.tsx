import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { CampaignStatus } from "@/generated/prisma/enums";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const A_HERO_BLUR = `${F}/hero-blur.svg`;
const A_FLAG_PIN  = `${F}/flag-pin.svg`;

// Same grey 20px dot grid the About hero uses — it runs over the blue and the
// white arch alike.
const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

// ── Types ────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "active" | "upcoming" | "completed";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",       label: "All Campaigns" },
    { key: "active",    label: "Active"         },
    { key: "upcoming",  label: "Upcoming"       },
    { key: "completed", label: "Completed"      },
];

// Status pill tones, matched to the dashboard's badges.
const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
    active:    { label: "Active",    bg: "#dcfce7", fg: "#15803d" },
    upcoming:  { label: "Upcoming",  bg: "#dbeafe", fg: "#1d4ed8" },
    completed: { label: "Completed", bg: "#ede9fe", fg: "#6d28d9" },
};

function fmt(n: unknown) {
    const num = Number(n);
    if (!n || isNaN(num)) return null;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

// ── Sub-components ────────────────────────────────────────────────────────────

// The blue flag-pin icon with its glow (Figma-exact insets) — same construction
// as the home / about marketing pages.
function FlagGlyph({ size }: { size: number }) {
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                style={{ width: size * 2.875, height: size * 2.875, top: -size * 0.5625, left: -size * 0.9375 }} />
        </div>
    );
}

function SectionBadge({ label }: { label: string }) {
    return (
        <div className="flex w-full justify-center">
            <div className="flex items-center gap-2.5 pl-2.5 pr-5 py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)] w-auto">
                <FlagGlyph size={32} />
                <span className="font-bold text-[#57728d] text-xs tracking-[1px] uppercase leading-none whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

// ── Data ─────────────────────────────────────────────────────────────────────

async function getCampaigns(filter: FilterKey, q: string) {
    const statusFilter = filter === "all"
        ? { in: [CampaignStatus.active, CampaignStatus.upcoming, CampaignStatus.completed] as CampaignStatus[] }
        : { equals: filter as CampaignStatus };

    const rows = await prisma.campaign.findMany({
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
            end_date:        true,
            org_display_name: true,
            organization:    { select: { name: true } },
            _count:          { select: { donors: true, members: true } },
            donations:       { select: { amount: true } },
            media:           { where: { media_type: "hero" }, take: 1, select: { url: true } },
        },
    });

    // One timestamp for the whole request, read out here rather than per-card
    // during render: every "days left" is measured from the same instant.
    const nowMs = Date.now();

    return rows.map((c) => {
        const raised  = c.donations.reduce((sum, d) => sum + Number(d.amount), 0);
        const goal    = Number(c.goal_amount ?? 0);
        const isOrg   = c.campaign_type === "organization";
        const endMs   = c.end_date ? new Date(c.end_date).getTime() : null;
        return {
            slug:     c.slug,
            name:     c.name ?? "Untitled campaign",
            story:    c.story,
            status:   c.status,
            isOrg,
            org:      c.org_display_name ?? c.organization?.name ?? null,
            heroUrl:  c.media[0]?.url ?? null,
            raised,
            goal,
            pct:      goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : null,
            daysLeft: endMs !== null ? Math.max(0, Math.ceil((endMs - nowMs) / 86_400_000)) : null,
            people:   isOrg ? c._count.members : c._count.donors,
        };
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

    const [user, campaigns] = await Promise.all([
        getAuthUser(),
        getCampaigns(filter, q.trim()),
    ]);

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO — same construction as the home / about heroes
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(160deg,rgba(0,56,140,1) 0%,rgba(10,100,210,1) 22%,rgba(33,150,253,1) 48%,rgba(150,215,255,1) 72%,rgba(255,255,255,1) 100%)",
                    }} />
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 88% 64% at 50% 30%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.97) 24%,rgba(190,228,255,0.55) 46%,rgba(33,150,253,0.08) 68%,transparent 84%)",
                    }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1500, height: 1450, top: -480, opacity: 0.9 }} />

                    {/* White arch fading the hero into the white grid below. */}
                    <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1440 120"
                        preserveAspectRatio="none" style={{ height: "clamp(44px,7vw,110px)" }} aria-hidden="true">
                        <path d="M0,72 Q720,2 1440,72 L1440,120 L0,120 Z" fill="white" />
                    </svg>

                    {/* Grey dot grid + the same grain tile as the dashboard sidebar. */}
                    <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                    <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                        style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
                </div>

                <NavBar user={user} />

                <div className="relative z-10 flex flex-col items-center gap-5 lg:gap-6 pt-8 lg:pt-14 pb-20 lg:pb-32 px-4 md:px-6 lg:px-10">
                    <SectionBadge label="Browse Campaigns" />
                    <h1 className="font-black text-[28px] sm:text-[34px] md:text-[40px] lg:text-[46px] xl:text-[54px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent max-w-[720px]"
                        style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                        Find a campaign to support
                    </h1>
                    <p className="max-w-[560px] text-center text-[#2f3a45] text-base lg:text-lg font-normal leading-[1.4]">
                        Discover fundraisers from individuals and organizations — and make a difference today.
                    </p>

                    {/* Search — plain GET so it works without JS; the header overlay
                        hands off here with ?q=. */}
                    <form method="GET" className="w-full max-w-[560px]">
                        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
                        <div className="flex items-center gap-2 rounded-[16px] border border-[#d4dee7] bg-white p-2 pl-4 shadow-[0_12px_28px_-12px_rgba(0,91,172,0.4)] focus-within:border-[#0268c0]">
                            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                            </svg>
                            <input
                                name="q"
                                defaultValue={q}
                                placeholder="Search campaigns or organizations…"
                                aria-label="Search campaigns or organizations"
                                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#003060] placeholder:text-[#9aa7b8] focus:outline-none"
                            />
                            <button type="submit"
                                className="relative shrink-0 overflow-hidden rounded-[12px] px-5 py-3 text-white font-black text-xs tracking-[1px] uppercase transition-transform hover:scale-105"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                <span className="relative z-10">Search</span>
                                <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                TABS + GRID
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pb-16 lg:pb-24 px-4 md:px-6 lg:px-10">
                <div className="max-w-[1152px] mx-auto">

                    {/* Filter tabs — the dashboard's underline treatment (StatusTabs),
                        minus Drafts, which are never public. */}
                    <div className="mb-8 flex items-end justify-between gap-4 border-b border-[#e7e9eb]">
                        <div className="flex gap-5 overflow-x-auto overflow-y-hidden -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {FILTERS.map(({ key, label }) => {
                                const isActive = filter === key;
                                const params = [key !== "all" ? `filter=${key}` : "", q ? `q=${encodeURIComponent(q)}` : ""].filter(Boolean).join("&");
                                return (
                                    <Link
                                        key={key}
                                        href={params ? `/campaigns?${params}` : "/campaigns"}
                                        className={`relative shrink-0 whitespace-nowrap border-b-2 py-3 text-[12px] font-black uppercase leading-none tracking-[1px] transition-colors ${
                                            isActive ? "border-[#0268c0] text-[#0268c0]" : "border-transparent text-[#7e8a96] hover:text-[#003060]"
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                        <p className="hidden sm:block shrink-0 py-3 text-[12px] font-black uppercase tracking-[1px] text-[#aeb5bd]">
                            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#eaeef3] bg-white py-20 text-center shadow-[0_1px_4px_0_rgba(25,33,61,0.08)]">
                            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5fc]">
                                <svg className="h-6 w-6 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                                </svg>
                            </span>
                            <p className="font-black text-[#003060] text-[20px] leading-[1.25]">No campaigns found</p>
                            <p className="mt-2 max-w-[380px] text-[15px] leading-[1.4] text-[#7e8a96]">
                                {q ? <>Nothing matches “<span className="font-semibold text-[#003060]">{q}</span>”. Try a different name or organization.</> : "There are no campaigns in this category yet."}
                            </p>
                            <Link href={q ? "/campaigns" : "/campaigns/create"}
                                className="relative mt-6 overflow-hidden rounded-[16px] px-6 py-3.5 text-white font-black text-xs tracking-[1px] uppercase transition-transform hover:scale-105"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                <span className="relative z-10">{q ? "Clear search" : "Start the first one"}</span>
                                <span aria-hidden className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map((c) => {
                                const { heroUrl, raised, goal, pct, isOrg, org, daysLeft, people } = c;
                                const style = STATUS_STYLE[c.status] ?? STATUS_STYLE.active;

                                return (
                                    <Link
                                        key={c.slug}
                                        href={`/campaigns/${c.slug}`}
                                        className="group flex flex-col overflow-hidden rounded-[16px] border border-[#eaeef3] bg-white p-4 shadow-[0_1px_4px_0_rgba(25,33,61,0.08)] transition-shadow hover:shadow-[0_20px_20px_-14px_rgba(2,104,192,0.2),0_40px_40px_-16px_rgba(2,104,192,0.2)]"
                                    >
                                        {/* Hero image */}
                                        <div className="relative h-[180px] shrink-0 overflow-hidden rounded-[12px] bg-[#f2f2f2]">
                                            {heroUrl ? (
                                                <Image src={heroUrl} alt={c.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FlagGlyph size={40} />
                                                </div>
                                            )}
                                            <span className="absolute left-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px]"
                                                style={{ background: style.bg, color: style.fg }}>
                                                {style.label}
                                            </span>
                                            <span className="absolute right-2.5 top-2.5 rounded-md bg-[#003060]/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px] text-white backdrop-blur-sm">
                                                {isOrg ? "Organization" : "Individual"}
                                            </span>
                                            {daysLeft !== null && c.status === "active" && (
                                                <span className="absolute bottom-2.5 left-2.5 rounded-md bg-[#003060]/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.5px] text-white backdrop-blur-sm">
                                                    {daysLeft === 0 ? "Last day!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-1 flex-col gap-2 pt-4">
                                            {org && (
                                                <p className="truncate text-[11px] font-black uppercase tracking-[1px] text-[#aeb5bd]">{org}</p>
                                            )}
                                            <h3 className="line-clamp-2 font-black text-[#003060] text-[18px] lg:text-[20px] leading-[1.25] transition-colors group-hover:text-[#0268c0]">
                                                {c.name}
                                            </h3>
                                            {c.story && (
                                                <p className="line-clamp-2 text-[15px] leading-[1.4] text-[#7e8a96]">{c.story}</p>
                                            )}

                                            {/* Progress */}
                                            {goal > 0 && (
                                                <div className="mt-1 space-y-1.5">
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
                                                        <div className="h-full rounded-full"
                                                            style={{ width: `${pct ?? 0}%`, background: c.status === "completed" ? "#8b5cf6" : "#28c45d" }} />
                                                    </div>
                                                    <div className="flex items-center justify-between text-[12px]">
                                                        <span className="font-black text-[#003060]">{fmt(raised) ?? "$0"} raised</span>
                                                        <span className="font-medium text-[#9aa7b8]">of {fmt(goal)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-auto flex items-center justify-between border-t border-[#eef1f4] pt-3 text-[12px]">
                                                <span className="font-medium text-[#9aa7b8]">
                                                    {isOrg
                                                        ? `${people} participant${people !== 1 ? "s" : ""}`
                                                        : `${people} donor${people !== 1 ? "s" : ""}`}
                                                </span>
                                                <span className="flex items-center gap-1 font-black uppercase tracking-[0.5px] text-[#0268c0] transition-all group-hover:gap-2">
                                                    View
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* The footer already carries the "Ready to Inspire?" CTA, so the page
                doesn't repeat it. */}
            <MarketingFooter />
        </div>
    );
}
