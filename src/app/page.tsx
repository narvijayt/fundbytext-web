import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { getDefaultCampaignVideo, getDefaultCampaignVideoThumbnail } from "@/lib/settings";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";
import HeroCampaignsCarousel, { type HeroCard } from "@/components/home/HeroCampaignsCarousel";
import HeroRotatingHeadline from "@/components/home/HeroRotatingHeadline";
import StoriesCarousel, { type Story } from "@/components/home/StoriesCarousel";
import HowItWorksVideo from "@/components/home/HowItWorksVideo";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";

const A_HERO_BLUR      = `${F}/hero-blur.svg`;
const A_FLAG_PIN       = `${F}/flag-pin.svg`;
const A_ARROW_RIGHT    = `${F}/arrow-right.svg`;

const A_STAT_CAMPAIGNS = `${F}/stat-campaigns.png`;
const A_STAT_GOALS     = `${F}/stat-goals.png`;
const A_STAT_ORGS      = `${F}/stat-orgs.png`;
const A_STAT_RAISED    = `${F}/stat-raised.png`;

const A_LB_NETFLIX     = `${F}/lb-netflix.svg`;
const A_LB_BUFFER      = `${F}/lb-buffer.svg`;
const A_LB_STRIPE      = `${F}/lb-stripe.svg`;
const A_LB_FRAMER_TXT  = `${F}/lb-framer-txt.svg`;
const A_LB_FRAMER_ICO  = `${F}/lb-framer-ico.svg`;
const A_LB_HUBSPOT     = `${F}/lb-hubspot.svg`;
const A_LB_DROPBOX     = `${F}/lb-dropbox.svg`;

// How It Works ("Fundraising made easy")
const A_HIW_PHONE      = `${F}/hiw-phone-panel.png`;
const A_HIW_FLAG       = `${F}/hiw-step-flag.svg`;
const A_HIW_DONOR      = `${F}/hiw-step-donor.svg`;
const A_HIW_SHARE      = `${F}/hiw-step-share.svg`;
const A_HIW_DONATE     = `${F}/hiw-step-donate.svg`;
const A_HIW_PAID       = `${F}/hiw-step-paid.svg`;

// See How It Works (video)
const A_VID_ELLIPSE    = `${F}/vid-ellipse-blur.svg`;
const A_VID_THUMB      = `${F}/vid-thumb.png`;

// Organization vs. Individual
const A_DIFF_VECTOR    = `${F}/diff-card-vector.svg`;
const A_DIFF_ORG_PHOTO = `${F}/diff-org-photo.png`;
const A_DIFF_IND_PHOTO = `${F}/diff-ind-photo.png`;
const A_DIFF_RAISED    = `${F}/diff-org-raised.svg`;
const A_DIFF_FLAG      = `${F}/diff-org-flag.svg`;
const A_CHIP_AVATAR    = `${F}/chip-avatar.jpg`;
const A_BAR_TEXTURE_SM = `${F}/bar-texture.svg`;

// Stories
const A_STORY_CAR      = `${F}/story-car.png`;
const A_STORY_SOFTBALL = `${F}/story-softball.png`;
const A_STORY_CHAIR    = `${F}/story-chair.png`;
const A_CARD_DOG       = `${F}/card-dog.png`;
const A_CARD_BASEBALL  = `${F}/card-baseball.png`;
const A_CARD_MINISTRY  = `${F}/card-ministry.png`;

// CTA + Footer
const A_CTA_OVERLAY    = `${F}/cta-overlay.svg`;

// ── Custom textures (coded, not raster images) ─────────────────────────────────
// Procedural film-grain noise via SVG feTurbulence — matches the Figma noise overlay.
const NOISE_URI = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

// The Figma "Headline Gradient" (rgb(38,91,145) → rgb(0,48,96)).
const HEADLINE_GRADIENT = "linear-gradient(166deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)";

// Grey 2×2 square dot grid on a 20px tile — the same texture the About /
// How-It-Works hero uses (rgba(87,114,141,0.3)), replacing the old brighter-blue
// dots so the home hero reads identically.
const GRAY_DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

// Arch mask for the stats' white curved area: opaque (visible) below the sweeping
// curve, transparent above it. Applied to a dotted-white layer, it gives the stats
// a curved top and lets the grey dots continue from the blue hero onto the white —
// the way How-It-Works runs its dots over both the blue and the white arch.
const ARCH_MASK = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 200' preserveAspectRatio='none'><path d='M0,90 Q720,0 1440,90 L1440,200 L0,200 Z' fill='white'/></svg>",
)}")`;

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
    { title: "Enter donor information", icon: A_HIW_DONOR,  iconSize: 22 },
    { title: "Share your campaign",     icon: A_HIW_SHARE,  iconSize: 24 },
    { title: "Donors donate",           icon: A_HIW_DONATE, iconSize: 22 },
    { title: "You get paid",            icon: A_HIW_PAID,   iconSize: 22 },
];

const STORIES: Story[] = [
    { img: A_STORY_CAR,      tag: "Individual",         title: "Fund to Fix My Car After Hit and Run",   desc: "After a hit and run left him without a ride to work, friends chipped in within days." },
    { img: A_STORY_SOFTBALL, tag: "Sports",             title: "Colorado Sparkler Softball Trip",        desc: "The team texted their campaign link to family and covered the whole tournament trip." },
    { img: A_STORY_CHAIR,    tag: "Medical and Health", title: "Raising Funds for a New Chair",          desc: "A new wheelchair felt out of reach — until his community rallied behind one simple link." },
    { img: A_CARD_DOG,       tag: "Animal Welfare",     title: "Help Charlie with Vet Bills",            desc: "Charlie's surgery was fully funded by neighbors who followed his recovery day by day." },
    { img: A_CARD_BASEBALL,  tag: "Sports",             title: "Spring Fundraiser for Cowboys Baseball", desc: "New helmets and uniforms for the season, raised one text at a time by the parents." },
    { img: A_CARD_MINISTRY,  tag: "Ministry",           title: "Summer Mission Trip Abroad",             desc: "The youth group shared one campaign and sent twelve students on their first mission." },
];

// Curated showcase for the hero row, mirroring the Figma's five cards. Used only
// when there aren't enough live campaigns to fill the staggered row; they link to
// Browse Campaigns, not a fake slug. Order matters — the middle card (index 2) is
// the featured one, so the strongest card sits there.
const HERO_SHOWCASE: HeroCard[] = [
    { img: A_CARD_DOG,       tag: "Animal Welfare", name: "Help Charlie with Vet Bills",           goal: "$3,000",  slug: "/campaigns", status: "active", endDate: null },
    { img: A_STORY_SOFTBALL, tag: "Sports",         name: "Colorado Sparkler Softball Trip",       goal: "$3,000",  slug: "/campaigns", status: "active", endDate: null },
    { img: A_CARD_BASEBALL,  tag: "Sports",         name: "Spring Fundraiser for Cowboys Baseball", goal: "$10,000", slug: "/campaigns", status: "active", endDate: null },
    { img: A_STORY_CHAIR,    tag: "Community",      name: "Help Fund Travel to Nationals",         goal: "$6,000",  slug: "/campaigns", status: "active", endDate: null },
    { img: A_CARD_MINISTRY,  tag: "Ministry",       name: "Summer Mission Trip Abroad",            goal: "$5,000",  slug: "/campaigns", status: "active", endDate: null },
];

// ── Data ──────────────────────────────────────────────────────────────────────

async function getFeaturedCampaigns() {
    try {
        // Only ACTIVE, public campaigns are featured in the hero — the "Browse all"
        // link at the end of the row is how people reach everything else.
        return await prisma.campaign.findMany({
            where: { status: "active", visibility: "public" },
            take: 5,
            orderBy: { created_at: "desc" },
            select: {
                slug: true, name: true, status: true, campaign_type: true,
                goal_amount: true, total_raised: true, start_date: true, end_date: true,
                media: { where: { media_type: "hero" }, take: 1, select: { url: true } },
            },
        });
    } catch { return []; }
}

async function getTotalRaised(): Promise<number> {
    try {
        const result = await prisma.campaign.aggregate({ _sum: { total_raised: true } });
        const total = Number(result._sum.total_raised ?? 0);
        return total > 0 ? total : 5200000;
    } catch { return 5200000; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Figma "Subheader" pill: white, #d4dee7 border, blue drop shadow,
// 32px flag glyph + 12px bold uppercase #57728d label.
function SectionBadge({ label }: { label: string }) {
    return (
        <div className="flex justify-center w-full">
            <div className="flex items-center gap-2.5 pl-2.5 pr-5 py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)] w-auto">
                <FlagGlyph size={32} />
                <span className="font-bold text-[#57728d] text-xs tracking-[1px] uppercase leading-none whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

// The blue flag-pin icon with its glow (glow extends past the box, Figma-exact insets).
function FlagGlyph({ size }: { size: number }) {
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                style={{
                    width: size * 2.875, height: size * 2.875,
                    top: -size * 0.5625, left: -size * 0.9375,
                }} />
        </div>
    );
}

function OrangeCta({ href, label, big }: { href: string; label: string; big?: boolean }) {
    return (
        <Link href={href}
            className={`flex items-center justify-center gap-2 px-7 ${big ? "py-[18px] sm:py-[22px]" : "py-[18px] lg:py-[22px]"} rounded-[20px] text-white font-black text-xs sm:text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden`}
            style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
            <span className="relative z-10 leading-none">{label}</span>
            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
        </Link>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
    const [liveCampaigns, user, totalRaisedRaw, defaultVideo, defaultVideoThumb] = await Promise.all([
        getFeaturedCampaigns(),
        getAuthUser(),
        getTotalRaised(),
        getDefaultCampaignVideo().catch(() => null),
        getDefaultCampaignVideoThumbnail().catch(() => null),
    ]);

    const totalRaisedDisplay = totalRaisedRaw >= 1_000_000
        ? `$${(totalRaisedRaw / 1_000_000).toFixed(1)}M+`
        : totalRaisedRaw >= 1000
            ? `$${Math.round(totalRaisedRaw / 1000)}K+`
            : `$${totalRaisedRaw.toLocaleString()}`;

    const realCards: HeroCard[] = liveCampaigns.map((c) => ({
        img: c.media[0]?.url ?? null,
        // Tag shows the campaign's category. There's no category column yet, so fall
        // back to a friendly label rather than the raw "ORGANIZATION"/"INDIVIDUAL"
        // enum (which read as an odd category pill).
        tag: c.campaign_type === "organization" ? "Organization" : c.campaign_type === "individual" ? "Individual" : "Campaign",
        name: c.name ?? "Untitled",
        goal: c.goal_amount ? `$${Number(c.goal_amount).toLocaleString()}` : null,
        status: c.status ?? "active",
        slug: `/campaigns/${c.slug}`,
        endDate: c.end_date ? new Date(c.end_date).toISOString() : null,
    }));

    // The hero shows a full staggered 5-card row like the Figma. Real campaigns
    // drive it once there are enough to fill the row; below that (e.g. a fresh
    // install) we fall back to a curated showcase so the hero never looks sparse.
    // The showcase cards link to Browse Campaigns rather than a specific slug.
    const heroCards: HeroCard[] = realCards.length >= 3 ? realCards.slice(0, 5) : HERO_SHOWCASE;

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* ── Hero background — the same treatment as the About / How-It-Works
                    hero (HeroBackdrop): flat bright-blue base, a broad white halo, the
                    hero-blur glow, GREY square dots and the soft-light grain. The stats
                    below are part of the hero: their white curved area carries the same
                    dots, so the pattern runs unbroken from the blue onto the white. ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Base blue — flat, bright, reads the same on both edges. */}
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(176deg,rgba(37,144,242,1) 0%,rgba(63,158,245,1) 26%,rgba(69,161,245,1) 52%,rgba(74,164,245,1) 76%,rgba(54,153,243,1) 100%)",
                    }} />
                    {/* White halo behind the headline + cards. */}
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 86% 58% at 50% 24%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.95) 26%,rgba(198,231,255,0.5) 48%,rgba(37,144,242,0.10) 72%,transparent 90%)",
                    }} />
                    {/* Glow. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1600, height: 1546, top: -430, opacity: 0.9 }} />
                    {/* Grey square dot grid — same tile/colour as How-It-Works. */}
                    <div className="absolute inset-0" style={{ backgroundImage: GRAY_DOTS, backgroundRepeat: "repeat" }} />
                    {/* Grain — the dashboard-sidebar noise, soft-light. */}
                    <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                        style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
                </div>

                {/* Navigation */}
                <NavBar user={user} />

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center gap-6 lg:gap-10 pt-8 lg:pt-12 pb-0 px-4 sm:px-6 w-full">

                    {/* Badge + headline + CTA */}
                    <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-[654px]">
                        <div className="flex flex-col items-center gap-4 lg:gap-6 w-full">
                            {/* Hero pill — sentence case with bold "minutes." (Figma-exact) */}
                            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-2 sm:pl-2.5 pr-4 sm:pr-5 py-2 sm:py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)]">
                                <FlagGlyph size={28} />
                                <span className="text-[#003060] text-xs sm:text-sm leading-none whitespace-nowrap">
                                    Launch your fundraiser in <span className="font-black">minutes.</span>
                                </span>
                            </div>

                            <HeroRotatingHeadline />
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 w-full sm:w-auto justify-center">
                            <OrangeCta href="/campaigns/create" label="Get Started for Free" big />
                            <Link href="/how-it-works"
                                className="flex items-center gap-2.5 px-5 py-4 rounded-2xl hover:bg-white/10 transition-colors">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" src={A_ARROW_RIGHT} width={32} height={32} style={{ display: "block" }} />
                                <span className="font-bold text-[#003060] text-sm tracking-[1px] uppercase whitespace-nowrap">See How It Works</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── Campaign Cards — Embla carousel, real campaigns only ── */}
                    <HeroCampaignsCarousel cards={heroCards} />
                </div>

                {/* ── Stats — the hero's white curved area. A dotted-white layer,
                    masked to the arch curve, carries the grey dots straight off the
                    blue (like How-It-Works). The top padding is the curve's headroom so
                    the numbers land on the full-width white below it. ── */}
                <div className="relative z-10 pt-[clamp(48px,7vw,104px)]">
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: `${GRAY_DOTS} 0 0 / 20px 20px repeat, white`,
                        WebkitMaskImage: ARCH_MASK, maskImage: ARCH_MASK,
                        WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
                        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                    }} />
                    <div className="relative">
                        {/* No dividers — the Figma (esp. the mobile 2×2) sets the stats
                            on plain cells with only whitespace between them. */}
                        <div className="grid grid-cols-2 gap-y-6 lg:flex lg:items-center lg:justify-center">
                            {[
                                { img: A_STAT_CAMPAIGNS, imgH: 96, imgW: 80,  smH: 60, smW: 50, value: "200+",             label: "Campaigns Launched" },
                                { img: A_STAT_GOALS,     imgH: 70, imgW: 77,  smH: 44, smW: 48, value: "97%",              label: "Goals Met" },
                                { img: A_STAT_ORGS,      imgH: 96, imgW: 114, smH: 60, smW: 72, value: "34+",              label: "Organizations" },
                                { img: A_STAT_RAISED,    imgH: 88, imgW: 82,  smH: 55, smW: 52, value: totalRaisedDisplay, label: "Raised & Counting" },
                            ].map((s) => (
                                <div key={s.label}
                                    className="flex items-center gap-3 lg:gap-5 px-4 lg:px-8 py-2 lg:py-4 lg:min-w-[230px] xl:min-w-[260px]">
                                    <div className="shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt="" src={s.img} className="object-contain lg:hidden"
                                            style={{ width: s.smW, height: s.smH }} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt="" src={s.img} className="object-contain hidden lg:block"
                                            style={{ width: s.imgW, height: s.imgH }} />
                                    </div>
                                    <div className="flex flex-col gap-1 lg:gap-2 min-w-0">
                                        <p className="font-black text-[#0268c0] text-[20px] lg:text-[24px] leading-snug truncate">{s.value}</p>
                                        <p className="font-black text-[#aeb5bd] text-[8px] lg:text-xs tracking-[1px] uppercase leading-tight">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                HOW IT WORKS — "Fundraising made easy" (Figma 5814:10380)
            ═══════════════════════════════════════════════════════════ */}
            <section id="how-it-works" className="bg-white pt-16 pb-14 lg:pb-20">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[144px]">
                    {/* Header + Subheader */}
                    <div className="flex flex-col items-center gap-5 mb-12 lg:mb-20">
                        <SectionBadge label="HOW it works" />
                        <h2 className="font-black text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[48px] leading-[1.1] pb-[0.1em] tracking-[-1px] text-center bg-clip-text text-transparent"
                            style={{ backgroundImage: HEADLINE_GRADIENT }}>
                            Fundraising made easy
                        </h2>
                    </div>

                    {/* Steps: phone panel + steps content. Side-by-side from md — the
                        Figma tablet keeps the phone left / steps right rather than
                        stacking, so the phone shrinks at md and grows to its 536px at lg. */}
                    <div className="flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-8 lg:gap-20">

                        {/* Phone mockup panel — exact Figma composition (blue dotted panel + iPhone) */}
                        <div className="w-full min-w-0 max-w-[420px] md:max-w-none md:w-[280px] lg:w-[536px] md:flex-none self-center md:self-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Creating a campaign on FundByText" src={A_HIW_PHONE}
                                className="w-full max-w-full h-auto block" />
                        </div>

                        {/* Steps list */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-10 lg:gap-14 py-2 lg:py-6 w-full">
                            <div className="flex flex-col gap-8">

                                {/* Step 1 — active: green flag icon, blue title, copy + progress slider */}
                                <div className="flex items-start gap-5">
                                    <div className="relative shrink-0 size-10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt="" src={A_HIW_FLAG} className="absolute max-w-none"
                                            style={{ width: "250%", height: "250%", left: "-75%", top: "-45%" }} />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-8 min-w-0">
                                        <div className="flex flex-col gap-2">
                                            <p className="font-black text-[#0268c0] text-xl lg:text-2xl leading-[1.25]">Create a campaign</p>
                                            <p className="font-normal text-[#2f3a45] text-base lg:text-lg leading-[1.4]">
                                                Simply fill in the campaign details to tell us about yourself or your organization. Setup takes only minutes.
                                            </p>
                                        </div>
                                        {/* slider: 464px track, 256px green fill */}
                                        <div className="w-full max-w-[464px] rounded-[96px] bg-[#eaeef3] border-[0.5px] border-[#d4dee7] overflow-hidden">
                                            <div className="h-[2px] rounded-[96px] bg-[#34d56a] w-[55%]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Steps 2–5 — gray circle icons, navy titles */}
                                {STEPS.map((s) => (
                                    <div key={s.title} className="flex items-center gap-5">
                                        <div className="flex items-center justify-center bg-[#d4dee7] rounded-full shrink-0 size-10">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img alt="" src={s.icon} style={{ width: s.iconSize, height: s.iconSize, display: "block" }} />
                                        </div>
                                        <p className="font-bold text-[#003060] text-xl lg:text-2xl leading-[1.25]">{s.title}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="self-start">
                                <OrangeCta href="/campaigns/create" label="Get Started for Free" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                LOGO BAR
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pb-16 lg:pb-28 px-4 sm:px-6 lg:px-[144px]">
                <div className="relative rounded-[40px] sm:rounded-[60px] lg:rounded-[100px] overflow-hidden py-8 lg:py-11 shadow-[0_12px_24px_-12px_rgba(0,48,96,0.6),0_30px_60px_-12px_rgba(0,48,96,0.2)]"
                    style={{ background: "#003060" }}>
                    {/* Fade edges — desktop only */}
                    <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[160px] pointer-events-none z-10"
                        style={{ background: "linear-gradient(to right,#003060,transparent)" }} />
                    <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[160px] pointer-events-none z-10"
                        style={{ background: "linear-gradient(to left,#003060,transparent)" }} />
                    <div className="overflow-x-auto lg:overflow-visible px-6 sm:px-12 lg:px-20"
                        style={{ WebkitOverflowScrolling: "touch" }}>
                        <div className="flex items-center justify-start lg:justify-center gap-[36px] sm:gap-[52px] lg:gap-[80px]"
                            style={{ minWidth: "max-content" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Netflix" src={A_LB_NETFLIX} width={97}  height={26} style={{ display: "block" }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Buffer"  src={A_LB_BUFFER}  width={109} height={27} style={{ display: "block" }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Stripe"  src={A_LB_STRIPE}  width={70}  height={29} style={{ display: "block" }} />
                            <div className="flex items-center gap-2 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" src={A_LB_FRAMER_ICO} width={19} height={28} style={{ display: "block" }} />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="Framer" src={A_LB_FRAMER_TXT} width={89} height={19} style={{ display: "block" }} />
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="HubSpot" src={A_LB_HUBSPOT} width={98}  height={28} style={{ display: "block" }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Dropbox" src={A_LB_DROPBOX} width={132} height={26} style={{ display: "block" }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SEE HOW IT WORKS — video (Figma 5814:11740)
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-14 lg:pt-28 pb-14 lg:pb-20 px-4 sm:px-6 lg:px-[144px] flex flex-col items-center gap-8 lg:gap-12"
                style={{ background: "linear-gradient(to bottom,#2196fd 0%,#ffffff 57.6%)" }}>
                {/* Ellipse Layer Blur (Figma asset) */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: 1676, height: 800, top: 96 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_VID_ELLIPSE} className="absolute max-w-none"
                        style={{ left: "-11.93%", top: "-25%", width: "123.86%", height: "150%" }} />
                </div>
                {/* Noise overlay */}
                <div className="absolute inset-0 mix-blend-overlay opacity-20 pointer-events-none"
                    style={{ backgroundImage: NOISE_URI, backgroundRepeat: "repeat" }} />
                <h2 className="relative z-10 font-black text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[48px] leading-[1.1] pb-[0.1em] tracking-[-1px] text-center bg-clip-text text-transparent w-full"
                    style={{ backgroundImage: "linear-gradient(172deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                    See How It Works
                </h2>
                {/* Plays the same default video campaigns use */}
                <HowItWorksVideo
                    videoUrl={defaultVideo}
                    poster={defaultVideoThumb ?? A_VID_THUMB}
                />
            </section>

            {/* ═══════════════════════════════════════════════════════════
                WHAT'S THE DIFFERENCE — Org vs Individual + Stories + CTA
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative isolate bg-white pt-10 overflow-hidden">

                {/* Figma Overlay — two huge blurred #0081F1 ellipses hugging the section
                    bottom (design: 6134×1609 image, bottom −951px), fading up naturally */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={A_CTA_OVERLAY}
                    className="absolute -z-10 left-1/2 max-w-none pointer-events-none"
                    style={{ width: 6134, height: 1609, bottom: -951, transform: "translateX(-50%)" }} />

                {/* Headline */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] mb-10 lg:mb-16">
                    <div className="flex flex-col items-center gap-5">
                        <SectionBadge label="what's the difference?" />
                        <h2 className="font-black text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[48px] leading-[1.1] pb-[0.1em] tracking-[-1px] text-center bg-clip-text text-transparent"
                            style={{ backgroundImage: HEADLINE_GRADIENT }}>
                            Organization vs. Individual
                        </h2>
                        <p className="font-normal text-[#2f3a45] text-base lg:text-lg leading-[1.4] text-center max-w-[520px]">
                            Not all fundraisers work the same way. Here&apos;s how organization and individual campaigns differ.
                        </p>
                    </div>
                </div>

                {/* ── Cards — desktop: exact 556×474 Figma blocks ── */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] mb-8 lg:mb-2">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-10">

                        {/* Organization Campaigns */}
                        <div className="relative w-full max-w-[556px] lg:w-[556px] lg:h-[474px] lg:flex-none rounded-2xl lg:rounded-none border border-[#eaeef3] lg:border-0 bg-white lg:bg-transparent overflow-hidden lg:overflow-visible">
                            {/* card outline vector (desktop) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="" src={A_DIFF_VECTOR}
                                className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" />
                            {/* photo */}
                            <div className="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[19px] w-full lg:w-[518px] h-[240px] sm:h-[302px] lg:rounded-2xl overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="Volunteers running an organization campaign" src={A_DIFF_ORG_PHOTO}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                {/* $6,500 raised chip */}
                                <div className="absolute bottom-4 left-4 bg-white rounded-[10px] p-3 w-[211px] flex flex-col gap-1.5"
                                    style={{ filter: "drop-shadow(0 9.5px 4.7px rgba(0,0,0,0.15)) drop-shadow(0 14px 9.5px rgba(0,0,0,0.1))" }}>
                                    <div className="flex items-end px-0.5">
                                        <p className="text-[#003060] text-[15px] leading-[1.15]">
                                            <span className="font-black tracking-[-0.3px]">$6,500 </span>
                                            <span className="font-normal">raised</span>
                                        </p>
                                    </div>
                                    <div className="relative h-5 rounded-[62px] w-full">
                                        <div className="absolute inset-0 bg-[#f2f2f2] rounded-[62px]" />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt="" src={A_DIFF_RAISED} className="absolute max-w-none"
                                            style={{ width: 158, height: 25, left: 0, top: -2.5 }} />
                                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_5px_0_rgba(0,48,96,0.1)] pointer-events-none" />
                                    </div>
                                    <div className="flex items-center gap-1 px-0.5">
                                        <div className="relative shrink-0 overflow-hidden" style={{ width: 15.4, height: 24.7 }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img alt="" src={A_DIFF_FLAG} className="absolute"
                                                style={{ width: 11.7, height: 22.2, left: 1.8, top: 0.8, transform: "rotate(-10deg)" }} />
                                        </div>
                                        <div className="flex flex-col gap-[2px] justify-center">
                                            <p className="text-[#7e8a96] text-[10px] leading-[1.4] font-medium">March 5, 2025</p>
                                            <p className="text-[#f47435] text-[7.4px] leading-none font-black tracking-[0.6px] uppercase">3 days left!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* title + body */}
                            <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[321px] w-full flex flex-col gap-3 p-6">
                                <p className="font-black text-[#0268c0] text-xl lg:text-2xl leading-[1.25] w-full">Organization Campaigns</p>
                                <p className="font-normal text-[#2f3a45] text-base lg:text-lg leading-[1.4] w-full">
                                    One central goal for the entire group and progress<br className="hidden lg:block" />
                                    is tracked at an organization level.
                                </p>
                            </div>
                        </div>

                        {/* Individual Campaigns */}
                        <div className="relative w-full max-w-[556px] lg:w-[556px] lg:h-[474px] lg:flex-none rounded-2xl lg:rounded-none border border-[#eaeef3] lg:border-0 bg-white lg:bg-transparent overflow-hidden lg:overflow-visible">
                            {/* card outline vector — mirrored */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="" src={A_DIFF_VECTOR}
                                className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
                                style={{ transform: "scaleX(-1)" }} />
                            {/* photo */}
                            <div className="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[19px] w-full lg:w-[518px] h-[240px] sm:h-[302px] lg:rounded-2xl overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="An individual fundraiser sharing her campaign" src={A_DIFF_IND_PHOTO}
                                    className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "right center" }} />
                                {/* Leaderboard chip — coded (gold #1 coin, avatar, 90% bar) */}
                                <div className="absolute left-4 top-4 w-[186px] rounded-[10px] overflow-hidden p-4 flex flex-col gap-3 shadow-[0_10px_10px_-7px_rgba(0,0,0,0.15),0_15px_20px_-8px_rgba(0,0,0,0.1)]"
                                    style={{ background: "linear-gradient(225deg,#ffe5b2 16.7%,#ffffff 43.3%)" }}>
                                    {/* gold #1 coin, clipped at the top-right corner */}
                                    <div className="absolute -right-[27px] -top-[27px] size-[101px] pointer-events-none">
                                        {/* sun rays */}
                                        <div className="absolute inset-0 rounded-full opacity-60"
                                            style={{ background: "conic-gradient(rgba(255,215,107,0) 0deg,rgba(255,215,107,0.9) 20deg,rgba(255,215,107,0) 40deg,rgba(255,215,107,0) 90deg,rgba(255,215,107,0.9) 110deg,rgba(255,215,107,0) 130deg,rgba(255,215,107,0) 180deg,rgba(255,215,107,0.9) 200deg,rgba(255,215,107,0) 220deg,rgba(255,215,107,0) 270deg,rgba(255,215,107,0.9) 290deg,rgba(255,215,107,0) 310deg,rgba(255,215,107,0) 360deg)" }} />
                                        {/* coin disc */}
                                        <div className="absolute rounded-full"
                                            style={{
                                                inset: "16.76%",
                                                background: "radial-gradient(circle at 35% 30%,#ffe084 0%,#ffc843 45%,#f0a71e 80%,#e0940f 100%)",
                                                boxShadow: "0 2px 6px rgba(198,109,16,0.45)",
                                            }} />
                                        {/* inner ring */}
                                        <div className="absolute rounded-full border-[2.5px] border-[#ffdf8a]"
                                            style={{ inset: "26.7%", background: "radial-gradient(circle at 40% 32%,#ffd76b 0%,#f7b62e 70%,#eda31c 100%)" }} />
                                        <span className="absolute inset-0 flex items-center justify-center font-black text-white text-[20px] lg:text-[22px] leading-none"
                                            style={{ textShadow: "0 0 8px #d49021,0 0 3px #c66d10" }}>1</span>
                                    </div>
                                    {/* organizer */}
                                    <div className="relative flex items-center gap-2 px-1">
                                        <div className="relative bg-[#f4f8f9] overflow-hidden rounded-full shrink-0 size-8">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img alt="" src={A_CHIP_AVATAR}
                                                className="absolute w-full h-auto max-w-none"
                                                style={{ top: "-15%" }} />
                                        </div>
                                        <div className="flex flex-col justify-center text-[#003060]">
                                            <p className="font-black text-[10px] leading-[1.25]">Stephanie</p>
                                            <p className="font-medium text-[10px] leading-[1.15]">Smith</p>
                                        </div>
                                    </div>
                                    {/* 90% progress bar */}
                                    <div className="relative h-4 rounded-full w-full overflow-hidden">
                                        <div className="absolute inset-0 bg-[#f2f2f2] rounded-full" />
                                        <div className="absolute left-0 top-0 h-full w-[85px] rounded-full shadow-[0_0_6px_0_rgba(40,196,93,0.5)]"
                                            style={{ background: "linear-gradient(to right,#28c45d,#34d56a)" }} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt="" src={A_BAR_TEXTURE_SM} className="absolute left-0 top-0 max-w-none"
                                            style={{ width: 137, height: 16 }} />
                                        <p className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white text-[7px] leading-none whitespace-nowrap">
                                            <span className="font-black">90%</span><span className="font-medium"> Raised</span>
                                        </p>
                                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_4px_0_rgba(0,48,96,0.08)] pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            {/* title + body — right-shifted block (Figma items-end, 412px) */}
                            <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-[321px] w-full flex flex-col lg:items-end gap-3 p-6">
                                <p className="font-black text-[#0268c0] text-xl lg:text-2xl leading-[1.25] w-full lg:w-[412px]">Individual Campaigns</p>
                                <p className="font-normal text-[#2f3a45] text-base lg:text-lg leading-[1.4] w-full lg:w-[412px]">
                                    Each participant has a individual goal. Supports<br className="hidden lg:block" />
                                    friendly competition with leaderboards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── How People Use FundbyText (real stories) ── */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px]">
                    <div className="flex flex-col items-center gap-4 mb-1 lg:mb-2">
                        <SectionBadge label="real stories" />
                        <h2 className="font-black text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[48px] leading-[1.1] pb-[0.1em] tracking-[-1px] text-center bg-clip-text text-transparent"
                            style={{ backgroundImage: HEADLINE_GRADIENT }}>
                            How people use FundbyText
                        </h2>
                    </div>
                </div>
                <StoriesCarousel stories={STORIES} />

                {/* ── CTA — Ready to Inspire? ── */}
                <div className="relative">
                    {/* Noise overlay */}
                    <div className="absolute inset-0 mix-blend-overlay opacity-20 pointer-events-none"
                        style={{ backgroundImage: NOISE_URI, backgroundRepeat: "repeat" }} />
                    <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] relative z-10">
                        <div className="flex flex-col items-center gap-6 lg:gap-8 py-10 lg:py-12">
                            <div className="flex flex-col items-center gap-4 lg:gap-6 w-full">
                                <h2 className="font-black text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[48px] leading-[1.1] pb-[0.1em] tracking-[-1px] text-center bg-clip-text text-transparent"
                                    style={{ backgroundImage: "linear-gradient(153deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                                    Ready to Inspire?
                                </h2>
                                <p className="font-normal text-[#2f3a45] text-base lg:text-[18px] leading-[1.25] text-center">
                                    Start Your FundbyText Campaign Today.
                                </p>
                            </div>
                            <OrangeCta href="/campaigns/create" label="Get Started for Free" />
                        </div>
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
