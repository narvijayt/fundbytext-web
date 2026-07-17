import { Suspense } from "react";
import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";
import { FILTERS, type FilterKey } from "./_filters";
import CampaignSearch from "./_components/CampaignSearch";
import BrowseTabs from "./_components/BrowseTabs";
import CampaignsResults, { CampaignCount } from "./_components/CampaignsResults";
import CampaignsGridSkeleton from "./_components/CampaignsGridSkeleton";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const A_HERO_BLUR = `${F}/hero-blur.svg`;
const A_FLAG_PIN  = `${F}/flag-pin.svg`;

// Same grey 20px dot grid the About hero uses — it runs over the blue and the
// white arch alike.
const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

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

// ── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
    title: "Browse Campaigns",
    description: "Discover active fundraising campaigns on FundByText and support a cause with a few taps.",
};

export default async function CampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
    const { filter: rawFilter, q: rawQ = "", page: rawPage } = await searchParams;
    const filter = (FILTERS.some((f) => f.key === rawFilter) ? rawFilter : "all") as FilterKey;
    const q = rawQ.trim();

    // ONLY the session is awaited here. The campaign query used to be awaited at the
    // top level too, which blocked the entire page — hero, search and tabs included —
    // behind the database, so switching a tab meant a dead click and a full-page
    // splash. It now lives in <CampaignsResults>, streamed in behind a skeleton, so
    // the shell paints immediately and only the grid waits.
    const user = await getAuthUser();

    // Re-key the boundaries on the query so they re-suspend (and show the skeleton)
    // on every filter/search/page change, rather than holding the previous results.
    const resultsKey = `${filter}|${q}|${rawPage ?? "1"}`;

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO — same construction as the home / about heroes
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Base blue — flat, bright sky blue (the same as the How-It-Works /
                        About / home hero via HeroBackdrop), NOT the dark navy diagonal
                        the legal-doc shell uses. The white arch below carries it to white. */}
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(176deg,rgba(37,144,242,1) 0%,rgba(63,158,245,1) 26%,rgba(69,161,245,1) 52%,rgba(74,164,245,1) 76%,rgba(54,153,243,1) 100%)",
                    }} />
                    {/* White halo — the same wash as HeroBackdrop (About / How-It-Works)
                        and MarketingDocShell, and it has to be sized in PIXELS, not
                        percentages. A percentage radius resolves against the section's
                        height: the home hero is ~1100px tall so `58% at 24%` reads as a
                        broad wash there, but this hero is only ~700px, which collapsed
                        the same values into a small hotspot — a sun. Fixed px keep the
                        glow the same physical size on every page regardless of height. */}
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 86% 600px at 50% 250px,rgba(255,255,255,1) 0%,rgba(255,255,255,0.95) 26%,rgba(198,231,255,0.5) 48%,rgba(37,144,242,0.10) 72%,transparent 90%)",
                    }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1600, height: 1546, top: -430, opacity: 0.9 }} />

                    {/* White arch fading the hero into the white grid below. */}
                    <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1440 160"
                        preserveAspectRatio="none" style={{ height: "clamp(60px,11vw,170px)" }} aria-hidden="true">
                        <path d="M0,130 Q720,-130 1440,130 L1440,160 L0,160 Z" fill="white" />
                    </svg>

                    {/* Grey dot grid + the same grain tile as the dashboard sidebar. */}
                    <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                    <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                        style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
                </div>

                <NavBar user={user} />

                <div className="relative z-10 flex flex-col items-center gap-5 lg:gap-6 pt-8 lg:pt-14 pb-28 lg:pb-44 px-4 md:px-6 lg:px-10">
                    <SectionBadge label="Browse Campaigns" />
                    <h1 className="font-black text-[28px] sm:text-[34px] md:text-[40px] lg:text-[46px] xl:text-[54px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent pb-[0.12em] max-w-[720px]"
                        style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                        Find a campaign to support
                    </h1>
                    <p className="max-w-[560px] text-center text-[#2f3a45] text-base lg:text-lg font-normal leading-[1.4]">
                        Discover fundraisers from individuals and organizations — and make a difference today.
                    </p>

                    {/* Navigates client-side and scrolls the results into view. */}
                    <CampaignSearch filter={filter} initialQ={q} />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                TABS + GRID
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-10 lg:pt-16 pb-16 lg:pb-24 px-4 md:px-6 lg:px-10">
                <div className="max-w-[1152px] mx-auto">

                    {/* The tabs put their own skeleton up the instant you click, without
                        waiting for the server; the Suspense boundary below then covers the
                        query itself. */}
                    <BrowseTabs
                        filter={filter}
                        q={q}
                        count={
                            <Suspense key={resultsKey} fallback={<span className="opacity-0">0 campaigns</span>}>
                                <CampaignCount filter={filter} q={q} />
                            </Suspense>
                        }
                    >
                        <Suspense key={resultsKey} fallback={<CampaignsGridSkeleton />}>
                            <CampaignsResults filter={filter} q={q} rawPage={rawPage} />
                        </Suspense>
                    </BrowseTabs>
                </div>
            </section>

            {/* The footer already carries the "Ready to Inspire?" CTA, so the page
                doesn't repeat it. */}
            <MarketingFooter />
        </div>
    );
}
