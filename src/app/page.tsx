import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import CountdownBadge from "@/components/CountdownBadge";
import NavBar from "@/components/NavBar";
import FundByTextLogo from "@/components/FundByTextLogo";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";

const A_HERO_BLUR      = `${F}/hero-blur.svg`;
const A_FLAG_PIN       = `${F}/flag-pin.svg`;
const A_UNDERLINE      = `${F}/underline.svg`;
const A_ARROW_RIGHT    = `${F}/arrow-right.svg`;
const A_CARD_GRADIENT  = `${F}/card-gradient.svg`;
const A_BAR_TEXTURE    = `${F}/bar-texture.svg`;
const A_TIMER_ICON     = `${F}/timer-icon.svg`;

const A_STAT_CAMPAIGNS = `${F}/stat-campaigns.png`;
const A_STAT_GOALS     = `${F}/stat-goals.png`;
const A_STAT_ORGS      = `${F}/stat-orgs.png`;
const A_STAT_RAISED    = `${F}/stat-raised.png`;

const A_CARD_DOG        = `${F}/card-dog.png`;
const A_CARD_SOFTBALL   = `${F}/card-softball.png`;
const A_CARD_BASEBALL   = `${F}/card-baseball.png`;
const A_CARD_VOLLEYBALL = `${F}/card-volleyball.png`;
const A_CARD_MINISTRY   = `${F}/card-ministry.png`;

const A_LB_NETFLIX     = `${F}/lb-netflix.svg`;
const A_LB_BUFFER      = `${F}/lb-buffer.svg`;
const A_LB_STRIPE      = `${F}/lb-stripe.svg`;
const A_LB_FRAMER_TXT  = `${F}/lb-framer-txt.svg`;
const A_LB_FRAMER_ICO  = `${F}/lb-framer-ico.svg`;
const A_LB_HUBSPOT     = `${F}/lb-hubspot.svg`;
const A_LB_DROPBOX     = `${F}/lb-dropbox.svg`;

const A_VID_NOISE      = `${F}/vid-noise.png`;
const A_VID_THUMB      = `${F}/vid-thumb.png`;
const A_VID_PLAY       = `${F}/vid-play.svg`;

const A_ORG_VECTOR     = `${F}/org-vector.svg`;
const A_ORG_PHOTO      = `${F}/org-photo.png`;
const A_ORG_RAISED     = `${F}/org-raised.svg`;
const A_ORG_FLAG       = `${F}/org-flag.svg`;
const A_IND_VECTOR     = `${F}/ind-vector.svg`;
const A_IND_PHOTO      = `${F}/ind-photo.png`;
const A_IND_AVATAR     = `${F}/ind-avatar.png`;
const A_IND_MEDAL      = `${F}/ind-medal.svg`;
const A_IND_BAR        = `${F}/ind-bar.svg`;

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
    { n: 1, title: "Create a campaign",       desc: "Simply fill in the campaign details to tell us about yourself or your organization. Setup takes only minutes.", icon: "flag" },
    { n: 2, title: "Enter donor information", desc: "Add your donors and participants so they receive campaign outreach automatically.", icon: "donor" },
    { n: 3, title: "Share your campaign",     desc: "Your custom campaign link goes out via text, email, or social — wherever donors are.", icon: "share" },
    { n: 4, title: "Donors donate",           desc: "Donors give securely online. You see every contribution in real time.", icon: "money" },
    { n: 5, title: "You get paid",            desc: "Funds are mailed to you by check once the campaign closes.", icon: "pay" },
];

const STATIC_CARDS = [
    { img: A_CARD_DOG,        tag: "Animal Welfare", name: "Help Charlie with Vet Bills",           goal: "$3,000",  days: null,           slug: null },
    { img: A_CARD_SOFTBALL,   tag: "Sports",         name: "Colorado Sparkler Softball Trip",        goal: "$3,000",  days: null,           slug: null },
    { img: A_CARD_BASEBALL,   tag: "Sports",         name: "Spring Fundraiser for Cowboys Baseball", goal: "$10,000", days: "90 days left", slug: null },
    { img: A_CARD_VOLLEYBALL, tag: "Sports",         name: "Help Fund Travel to Nationals",          goal: "$6,000",  days: null,           slug: null },
    { img: A_CARD_MINISTRY,   tag: "Ministry",       name: "Summer Mission Trip Abroad",             goal: "$5,000",  days: null,           slug: null },
];

// ── Data ──────────────────────────────────────────────────────────────────────

async function getFeaturedCampaigns() {
    try {
        return await prisma.campaign.findMany({
            where: { status: { in: ["active", "upcoming"] }, visibility: "public" },
            take: 5,
            orderBy: [{ status: "asc" }, { created_at: "desc" }],
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

function SectionBadge({ label }: { label: string }) {
    return (
        <div className="flex justify-center w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-2.5 pr-3 sm:pr-5 py-2 sm:py-2.5 rounded-full border border-[#eaeef3] shadow-[0_12px_20px_-8px_rgba(0,91,172,0.2)] w-auto"
                style={{ background: "linear-gradient(-90deg,#ffffff 0%,#eff5f5 100%)" }}>
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 shrink-0 overflow-hidden">
                    <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                        style={{ width: 92, height: 92, top: -14, left: -24 }} />
                </div>
                <span className="font-black text-[#003060] text-[9px] sm:text-xs tracking-[0.5px] sm:tracking-[1px] uppercase whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

function StepIcon({ icon }: { icon: string }) {
    if (icon === "flag") return (
        <div className="relative w-5 h-5 overflow-hidden">
            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                style={{ width: 57, height: 57, top: -11, left: -19 }} />
        </div>
    );
    if (icon === "donor") return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
    if (icon === "share") return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    );
    if (icon === "money") return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" />
        </svg>
    );
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
    const [liveCampaigns, user, totalRaisedRaw] = await Promise.all([
        getFeaturedCampaigns(),
        getAuthUser(),
        getTotalRaised(),
    ]);

    const totalRaisedDisplay = totalRaisedRaw >= 1_000_000
        ? `$${(totalRaisedRaw / 1_000_000).toFixed(1)}M+`
        : totalRaisedRaw >= 1000
            ? `$${Math.round(totalRaisedRaw / 1000)}K+`
            : `$${totalRaisedRaw.toLocaleString()}`;

    const heroCards = liveCampaigns.length > 0
        ? liveCampaigns.map((c) => ({
            img: c.media[0]?.url ?? null,
            tag: c.campaign_type ?? "Campaign",
            name: c.name ?? "Untitled",
            goal: c.goal_amount ? `$${Number(c.goal_amount).toLocaleString()}` : null,
            raised: c.total_raised ? `$${Number(c.total_raised).toLocaleString()}` : null,
            status: c.status,
            slug: `/campaigns/${c.slug}`,
            end_date: c.end_date,
            start_date: c.start_date,
        }))
        : null;

    type LiveCard = NonNullable<typeof heroCards>[0];
    type StaticCard = typeof STATIC_CARDS[0];

    const cards = heroCards ?? STATIC_CARDS;

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden min-h-[680px] md:min-h-[820px] lg:min-h-[960px]">
                {/* ── Hero Background: coded layers (Figma exact) ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">

                    {/* L1 — Base: Figma blue rgba(33,150,253) with darker navy at top-corners */}
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(160deg,rgba(0,56,140,1) 0%,rgba(10,100,210,1) 25%,rgba(33,150,253,1) 55%,rgba(100,195,255,1) 80%,rgba(200,235,255,1) 100%)",
                    }} />

                    {/* L2 — Figma white → blue radial: very bright white center, Figma blue at edges */}
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 90% 72% at 50% 32%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.97) 22%,rgba(190,228,255,0.60) 45%,rgba(33,150,253,0.10) 68%,transparent 85%)",
                    }} />

                    {/* L3 — Tiny 2×2px square dots every 20px */}
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(33%2C150%2C253%2C0.35)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "repeat",
                    }} />

                    {/* L4 — Noise grain */}
                    <img alt="" src={A_VID_NOISE}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-[0.18] pointer-events-none" />

                    {/* L5 — Layer Blur (hero-blur.svg): large white ellipse with Gaussian blur,
                             centered at ~30% from top to align with headline + card row.
                             Increased to 1600px wide, opacity 0.92 to match Figma's prominent white halo */}
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1600, height: 1546, top: -430, opacity: 0.92 }} />
                </div>

                {/* Navigation */}
                <NavBar user={user} />

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center gap-6 lg:gap-10 pt-8 lg:pt-12 pb-0 px-4 sm:px-6 w-full">

                    {/* Badge + headline + CTA */}
                    <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-[654px]">
                        <div className="flex flex-col items-center gap-4 lg:gap-6 w-full">
                            <SectionBadge label="Launch your fundraiser in minutes." />

                            <div className="relative flex flex-col items-center justify-center w-full">
                                {/* Underline beneath "Sports Teams" — hidden on very small screens */}
                                <div className="hidden sm:block absolute bottom-[-14px] right-[54px] w-[440px] h-[16px] rotate-[1.5deg] pointer-events-none overflow-hidden">
                                    <img alt="" src={A_UNDERLINE} width={440} height={16} style={{ display: "block" }} />
                                </div>
                                <h1 className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-[64px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent w-full"
                                    style={{
                                        backgroundImage: "linear-gradient(138deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)",
                                    }}>
                                    Effortless Fundraising for Sports Teams
                                    <span className="font-light text-[#f47435]">|</span>
                                </h1>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 w-full sm:w-auto justify-center">
                            <Link href="/campaigns/create"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-[18px] sm:py-[22px] rounded-[20px] text-white font-black text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                <span className="relative z-10">Get Started for Free</span>
                                <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                            </Link>
                            <Link href="#how-it-works"
                                className="flex items-center gap-2.5 px-5 py-4 rounded-2xl hover:bg-white/10 transition-colors">
                                <img alt="" src={A_ARROW_RIGHT} width={32} height={32} style={{ display: "block" }} />
                                <span className="font-bold text-[#003060] text-sm tracking-[1px] uppercase whitespace-nowrap">See How It Works</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── Campaign Cards ── */}
                    <div className="relative w-full">

                        {/* Mobile / Tablet — horizontal snap scroll */}
                        <div className="lg:hidden w-full pb-6"
                            style={{ overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
                            <div className="flex gap-3 pl-4" style={{ width: "max-content", paddingRight: 16 }}>
                                {cards.map((c, i) => {
                                    const W = 252, H = 346, imgH = 170;
                                    const inner = (
                                        <div className="bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none"
                                            style={{ width: W, height: H, scrollSnapAlign: "start" }}>
                                            <div className="relative overflow-hidden flex-none" style={{ height: imgH }}>
                                                {c.img ? (
                                                    <img alt={c.name} src={c.img as string}
                                                        className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400" />
                                                )}
                                                {"days" in c && (c as StaticCard).days && (
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                                        <img alt="" src={A_TIMER_ICON} width={14} height={14} style={{ display: "block" }} />
                                                        <span className="font-bold text-white text-[10px] tracking-[1px] uppercase">
                                                            {(c as StaticCard).days}
                                                        </span>
                                                    </div>
                                                )}
                                                {"status" in c && (c as LiveCard).status === "active" && (c as LiveCard).end_date && (
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                                        <img alt="" src={A_TIMER_ICON} width={14} height={14} style={{ display: "block" }} />
                                                        <CountdownBadge date={(c as LiveCard).end_date!} mode="left"
                                                            className="font-bold text-white text-[10px] tracking-[1px] uppercase" />
                                                    </div>
                                                )}
                                                <img alt="" src={A_CARD_GRADIENT}
                                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-none scale-y-[-1] pointer-events-none"
                                                    style={{ width: 599, height: 200 }} />
                                            </div>
                                            <div className="flex flex-col gap-3 p-4 flex-1">
                                                <div className="flex flex-col gap-2">
                                                    <div className="inline-flex self-start bg-[#feece4] px-1.5 py-1 rounded-[6px]">
                                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{c.tag}</span>
                                                    </div>
                                                    <p className="font-black text-[#003060] text-[15px] leading-snug line-clamp-2">{c.name}</p>
                                                </div>
                                                {c.goal && (
                                                    <div className="relative h-7 rounded-[100px] overflow-hidden mt-auto">
                                                        <div className="absolute inset-0 bg-[#f2f2f2] rounded-[100px]" />
                                                        <img alt="" src={A_BAR_TEXTURE}
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 max-w-none"
                                                            style={{ width: 120, height: 32 }} />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-xs font-black whitespace-nowrap">
                                                            {c.goal} <span className="font-medium">Goal</span>
                                                        </span>
                                                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_8px_0_rgba(0,48,96,0.08)] pointer-events-none" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                    return "slug" in c && (c as LiveCard).slug ? (
                                        <Link key={i} href={(c as LiveCard).slug!} className="flex-none" style={{ scrollSnapAlign: "start" }}>
                                            {inner}
                                        </Link>
                                    ) : (
                                        <div key={i} className="flex-none">{inner}</div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop — staggered fixed layout */}
                        <div className="hidden lg:block overflow-x-auto pb-8">
                            <div className="flex items-end justify-center gap-4 px-4 min-w-max mx-auto">
                                {cards.map((c, i) => {
                                    const isFeatured = i === 2;
                                    const isEdge     = i === 0 || i === 4;
                                    const cardH      = isEdge ? 370 : 400;
                                    const cardW      = isEdge ? 280 : 303;
                                    const topOffset  = isFeatured ? -30 : isEdge ? 30 : 0;

                                    const inner = (
                                        <div className="bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none"
                                            style={{
                                                width: cardW, height: cardH,
                                                marginTop: topOffset > 0 ? topOffset : 0,
                                                marginBottom: topOffset < 0 ? Math.abs(topOffset) : 0,
                                                boxShadow: isFeatured
                                                    ? "0 20px 20px -12px rgba(2,120,222,0.3),0 50px 80px -16px rgba(2,120,222,0.3)"
                                                    : undefined,
                                            }}>
                                            <div className="relative overflow-hidden flex-none" style={{ height: isEdge ? 185 : 200 }}>
                                                {c.img && "slug" in c && (c as LiveCard).slug ? (
                                                    <Image src={c.img as string} alt={c.name} fill className="object-cover" />
                                                ) : c.img ? (
                                                    <img alt={c.name} src={c.img} className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400" />
                                                )}
                                                {"days" in c && (c as StaticCard).days && (
                                                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                                                        <img alt="" src={A_TIMER_ICON} width={16} height={16} style={{ display: "block" }} />
                                                        <span className="font-bold text-white text-xs tracking-[1px] uppercase">
                                                            {(c as StaticCard).days}
                                                        </span>
                                                    </div>
                                                )}
                                                {"status" in c && (c as LiveCard).status === "active" && (c as LiveCard).end_date && (
                                                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                                                        <img alt="" src={A_TIMER_ICON} width={16} height={16} style={{ display: "block" }} />
                                                        <CountdownBadge date={(c as LiveCard).end_date!} mode="left"
                                                            className="font-bold text-white text-xs tracking-[1px] uppercase" />
                                                    </div>
                                                )}
                                                <img alt="" src={A_CARD_GRADIENT}
                                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-none scale-y-[-1] pointer-events-none"
                                                    style={{ width: 599, height: 200 }} />
                                            </div>
                                            <div className="flex flex-col gap-5 p-5 flex-1">
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="inline-flex self-start bg-[#feece4] px-1.5 py-1 rounded-[6px]">
                                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{c.tag}</span>
                                                    </div>
                                                    <p className="font-black text-[#003060] text-lg leading-snug">{c.name}</p>
                                                </div>
                                                {c.goal && (
                                                    <div className="relative h-8 rounded-[100px] overflow-hidden">
                                                        <div className="absolute inset-0 bg-[#f2f2f2] rounded-[100px]" />
                                                        <img alt="" src={A_BAR_TEXTURE}
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 max-w-none"
                                                            style={{ width: 120, height: 32 }} />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm font-black whitespace-nowrap">
                                                            {c.goal} <span className="font-medium">Goal</span>
                                                        </span>
                                                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_8px_0_rgba(0,48,96,0.08)] pointer-events-none" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return "slug" in c && (c as LiveCard).slug ? (
                                        <Link key={i} href={(c as LiveCard).slug!} className="flex-none">{inner}</Link>
                                    ) : (
                                        <div key={i} className="flex-none">{inner}</div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats bar — SVG arch curve + white content ── */}
                <div className="relative z-10">

                    {/* Arch SVG: arch rises from a white base at corners to peak at center.
                        Base (y=70→120) ensures white is visible at every edge, not just center. */}
                    <svg
                        className="block w-full"
                        viewBox="0 0 1440 120"
                        preserveAspectRatio="none"
                        style={{ height: "clamp(60px,8vw,120px)", display: "block", marginBottom: -2 }}
                        aria-hidden="true"
                    >
                        <path d="M0,70 Q720,0 1440,70 L1440,120 L0,120 Z" fill="white" />
                    </svg>

                    {/* Stats content — white bg with matching tiny square dots */}
                    <div style={{
                        background: "white",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(33%2C150%2C253%2C0.14)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "repeat",
                    }}>
                        <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-center divide-x divide-y lg:divide-y-0 divide-[#eaeef3]/60">
                            {[
                                { img: A_STAT_CAMPAIGNS, imgH: 96, imgW: 80,  smH: 60, smW: 50, value: "200+",             label: "Campaigns Launched" },
                                { img: A_STAT_GOALS,     imgH: 70, imgW: 77,  smH: 44, smW: 48, value: "97%",              label: "Goals Met" },
                                { img: A_STAT_ORGS,      imgH: 96, imgW: 114, smH: 60, smW: 72, value: "34+",              label: "Organizations" },
                                { img: A_STAT_RAISED,    imgH: 88, imgW: 82,  smH: 55, smW: 52, value: totalRaisedDisplay, label: "Raised & Counting" },
                            ].map((s) => (
                                <div key={s.label}
                                    className="flex items-center gap-3 lg:gap-5 px-4 lg:px-8 py-3 lg:py-4 lg:min-w-[230px] xl:min-w-[260px]">
                                    <div className="shrink-0">
                                        <img alt="" src={s.img} className="object-contain lg:hidden"
                                            style={{ width: s.smW, height: s.smH }} />
                                        <img alt="" src={s.img} className="object-contain hidden lg:block"
                                            style={{ width: s.imgW, height: s.imgH }} />
                                    </div>
                                    <div className="flex flex-col gap-1 lg:gap-2 min-w-0">
                                        <p className="font-black text-[#0268c0] text-[22px] lg:text-[28px] leading-snug truncate">{s.value}</p>
                                        <p className="font-black text-[#aeb5bd] text-[8px] lg:text-xs tracking-[1px] uppercase leading-tight">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════════════════════════ */}
            <section id="how-it-works" className="bg-white py-12 lg:py-16">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[144px]">
                    <div className="flex flex-col items-center gap-4 mb-10 lg:mb-16">
                        <SectionBadge label="HOW it works" />
                        <h2 className="font-black text-[#003060] text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-center">
                            Fundraising made easy
                        </h2>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

                        {/* Phone mockup — desktop only */}
                        <div className="hidden lg:flex relative flex-none w-[536px] items-center justify-center" style={{ height: 623 }}>
                            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                <div className="absolute w-[330px] h-[348px] rounded-full bg-[#c5e4f8]/60 blur-3xl -top-24 left-4" />
                                <div className="absolute w-[330px] h-[348px] rounded-full bg-[#a8d4f5]/50 blur-3xl top-32 -right-16" />
                                <div className="absolute w-[330px] h-[348px] rounded-full bg-[#d6eeff]/60 blur-3xl -bottom-16 left-8" />
                                <div className="absolute w-[330px] h-[348px] rounded-full bg-[#b8d8f7]/40 blur-3xl bottom-8 -right-8" />
                                <div className="absolute w-[330px] h-[348px] rounded-full bg-[#e0f0fd]/50 blur-3xl top-8 left-1/3" />
                            </div>
                            <div className="relative z-10 mx-auto" style={{ width: 260, height: 540 }}>
                                <div className="absolute inset-0 rounded-[40px] border-[6px] border-gray-800 bg-white shadow-2xl overflow-hidden">
                                    <div className="absolute right-[-8px] top-24 w-[6px] h-12 bg-gray-700 rounded-r-sm" />
                                    <div className="absolute right-[-8px] top-40 w-[6px] h-8 bg-gray-700 rounded-r-sm" />
                                    <div className="absolute left-[-8px] top-32 w-[6px] h-8 bg-gray-700 rounded-l-sm" />
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-full z-20" />
                                    <div className="absolute inset-0 overflow-y-auto mt-8 bg-white">
                                        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[#003060]">
                                            <div className="w-4 h-4 rounded bg-white/20" />
                                            <div className="flex items-center gap-1">
                                                <img alt="" src="/figma/logo-icon.svg" style={{ width: 10, height: 14, display: "block" }} />
                                                <span className="text-white text-[8px] font-black tracking-wide">FundByText</span>
                                            </div>
                                            <div className="w-4 h-4" />
                                        </div>
                                        <div className="bg-white px-3 pt-3 pb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-[#003060] text-[9px]">Create Your Campaign</span>
                                                <span className="font-black text-[#aeb5bd] text-[8px] tracking-wide uppercase">Step 1 / 5</span>
                                            </div>
                                            <div className="flex items-center gap-1 mb-3">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <div key={n} className="flex-1 h-1.5 rounded-full"
                                                        style={{ background: n === 1 ? "#ea6725" : "#f2f2f2" }} />
                                                ))}
                                            </div>
                                            <div className="w-full py-1.5 rounded-sm mb-3 flex items-center justify-center"
                                                style={{ background: "repeating-linear-gradient(-45deg,#1a6fbf,#1a6fbf 4px,#1565C0 4px,#1565C0 8px)" }}>
                                                <span className="text-white text-[8px] font-bold">All the tiny details you need to give us</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <div className="relative w-3 h-3 overflow-hidden shrink-0">
                                                            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                                                                style={{ width: 35, height: 35, top: -6, left: -11 }} />
                                                        </div>
                                                        <p className="font-bold text-[#003060] text-[8px]">What&apos;s the name of your campaign?</p>
                                                    </div>
                                                    <p className="text-[#7e8a96] text-[7px] mb-1">This will be the title everyone sees. Make it clear and catchy!</p>
                                                    <div className="border border-[#eaeef3] rounded-md px-2 py-1.5 flex items-center justify-between">
                                                        <span className="text-[#003060] text-[8px]">New Helmets for the Bears...</span>
                                                        <span className="text-[#aeb5bd] text-[7px]">Max.50</span>
                                                    </div>
                                                    <button className="mt-1.5 w-full py-1 rounded-md text-[8px] font-black text-white"
                                                        style={{ background: "#ea6725" }}>Ask FundBuddy</button>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#003060" strokeWidth="2">
                                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                                        </svg>
                                                        <p className="font-bold text-[#003060] text-[8px]">How would you describe your campaign?</p>
                                                    </div>
                                                    <div className="border border-[#eaeef3] rounded-md p-2 h-12 bg-[#f8fafc]">
                                                        <div className="space-y-1">
                                                            <div className="h-1 bg-[#e2e8f0] rounded w-full" />
                                                            <div className="h-1 bg-[#e2e8f0] rounded w-4/5" />
                                                            <div className="h-1 bg-[#e2e8f0] rounded w-3/5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#003060" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        <p className="font-bold text-[#003060] text-[8px]">How long will your campaign last?</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <div className="flex-1 border border-[#eaeef3] rounded-md px-1.5 py-1">
                                                            <p className="text-[#aeb5bd] text-[6px] uppercase">Start date</p>
                                                            <p className="text-[#003060] text-[7px] font-bold">Wed, March 5</p>
                                                        </div>
                                                        <div className="flex-1 border border-[#eaeef3] rounded-md px-1.5 py-1">
                                                            <p className="text-[#aeb5bd] text-[6px] uppercase">End date</p>
                                                            <p className="text-[#003060] text-[7px] font-bold">Fri, May 30</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sticky bottom-0 bg-white border-t border-[#eaeef3] px-3 py-2 flex items-center justify-between">
                                            <button className="text-[#aeb5bd] text-[8px] font-bold flex items-center gap-1">
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                                Exit
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button className="px-3 py-1 rounded-md border border-[#eaeef3] text-[#003060] text-[8px] font-bold">Back</button>
                                                <button className="px-3 py-1 rounded-md text-white text-[8px] font-black"
                                                    style={{ background: "#ea6725" }}>Next →</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-800 rounded-full" />
                            </div>
                        </div>

                        {/* Steps list */}
                        <div className="flex-1 flex flex-col gap-0 w-full">
                            <div className="space-y-0">
                                {STEPS.map((s, i) => (
                                    <div key={s.n}
                                        className={`flex items-start gap-4 py-4 lg:py-5 ${i < STEPS.length - 1 ? "border-b border-[#eaeef3]" : ""}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i === 0 ? "bg-[#003060] text-white" : "bg-[#f2f2f2] text-[#7e8a96]"}`}>
                                            <StepIcon icon={s.icon} />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className={`font-black text-base ${i === 0 ? "text-[#003060]" : "text-[#aeb5bd]"}`}>{s.title}</p>
                                            {i === 0 && <p className="text-[#7e8a96] text-sm leading-relaxed mt-1">{s.desc}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/campaigns/create"
                                className="self-start mt-6 lg:mt-8 flex items-center gap-2 px-7 py-[18px] rounded-[20px] text-white font-black text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                <span>Get Started for Free</span>
                                <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                            </Link>
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
                            <img alt="Netflix" src={A_LB_NETFLIX} width={97}  height={26} style={{ display: "block" }} />
                            <img alt="Buffer"  src={A_LB_BUFFER}  width={109} height={27} style={{ display: "block" }} />
                            <img alt="Stripe"  src={A_LB_STRIPE}  width={70}  height={29} style={{ display: "block" }} />
                            <div className="flex items-center gap-2 shrink-0">
                                <img alt="" src={A_LB_FRAMER_ICO} width={19} height={28} style={{ display: "block" }} />
                                <img alt="Framer" src={A_LB_FRAMER_TXT} width={89} height={19} style={{ display: "block" }} />
                            </div>
                            <img alt="HubSpot" src={A_LB_HUBSPOT} width={98}  height={28} style={{ display: "block" }} />
                            <img alt="Dropbox" src={A_LB_DROPBOX} width={132} height={26} style={{ display: "block" }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                VIDEO
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-14 lg:pt-28 pb-14 lg:pb-20 px-4 sm:px-6 lg:px-[144px] flex flex-col items-center gap-8 lg:gap-12"
                style={{ background: "linear-gradient(to bottom,#2196fd 0%,#ffffff 57.6%)" }}>
                <img alt="" src={A_VID_NOISE}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20 pointer-events-none" />
                <h2 className="relative z-10 font-black text-3xl sm:text-4xl lg:text-5xl leading-none tracking-[-1px] text-center bg-clip-text text-transparent w-full"
                    style={{ backgroundImage: "linear-gradient(172deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                    See How It Works
                </h2>
                <div className="relative z-10 w-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_20px_20px_-14px_rgba(2,104,192,0.2),0_40px_40px_-16px_rgba(2,104,192,0.2)]"
                    style={{ maxWidth: 1152, aspectRatio: "16/9", background: "#f2f2f2" }}>
                    <img alt="FundByText in action" src={A_VID_THUMB}
                        className="absolute w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                            style={{ width: "clamp(60px,8vw,94px)", height: "clamp(60px,8vw,94px)" }}>
                            <img alt="Play" src={A_VID_PLAY} className="w-full h-full" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                ORG vs INDIVIDUAL
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-8 lg:pt-10 pb-0 overflow-hidden">

                {/* Header */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] mb-10 lg:mb-20">
                    <div className="flex flex-col items-center gap-4">
                        <SectionBadge label="what's the difference?" />
                        <h2 className="font-black text-[#003060] text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-center">
                            Organization vs. Individual
                        </h2>
                        <p className="text-[#2f3a45] text-base lg:text-lg text-center max-w-[1152px]">
                            Not all fundraisers work the same way. Here&apos;s how organization and individual campaigns differ.
                        </p>
                    </div>
                </div>

                {/* Cards */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] mb-16 lg:mb-24">
                    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-10">

                        {/* Org Card */}
                        <div className="relative w-full lg:flex-none lg:w-[556px]">
                            <img alt="" src={A_ORG_VECTOR}
                                className="absolute inset-0 pointer-events-none hidden lg:block"
                                style={{ width: 556, height: 474 }} />
                            <div className="relative rounded-2xl overflow-hidden lg:mx-[19px] lg:mt-[19px]"
                                style={{ height: 302 }}>
                                <img alt="Organization campaign" src={A_ORG_PHOTO}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute bottom-4 left-4 bg-white rounded-[10px] p-3 shadow-[0_9px_5px_rgba(0,0,0,0.15),0_14px_9px_rgba(0,0,0,0.1)]"
                                    style={{ width: 211 }}>
                                    <div className="flex items-baseline gap-1 mb-1.5 px-0.5">
                                        <span className="font-black text-[#003060] text-[15px]">$6,500</span>
                                        <span className="font-normal text-[#003060] text-[15px]">raised</span>
                                    </div>
                                    <div className="relative overflow-hidden mb-1.5" style={{ height: 20, borderRadius: 62 }}>
                                        <div className="absolute inset-0 bg-[#f2f2f2]" />
                                        <img alt="" src={A_ORG_RAISED}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 max-w-none"
                                            style={{ width: 160, height: 27 }} />
                                        <div className="absolute inset-0 shadow-[inset_0_2px_5px_0_rgba(0,48,96,0.1)] pointer-events-none rounded-[62px]" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-0.5">
                                        <div className="relative overflow-hidden shrink-0" style={{ width: 12, height: 18 }}>
                                            <img alt="" src={A_ORG_FLAG} className="absolute max-w-none"
                                                style={{ width: 12, height: 22, top: 0, left: 0 }} />
                                        </div>
                                        <div>
                                            <p className="text-[#7e8a96] text-[10px] font-medium">March 5, 2025</p>
                                            <p className="text-[#f47435] text-[7px] font-black tracking-[0.6px] uppercase">3 days left!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-5 lg:px-6 lg:pt-6 pb-4 lg:pb-6">
                                <p className="font-black text-[#0268c0] text-xl lg:text-2xl mb-2 lg:mb-3">Organization Campaigns</p>
                                <p className="text-[#2f3a45] text-base lg:text-lg leading-relaxed">
                                    One central goal for the entire group and progress is tracked at an organization level.
                                </p>
                            </div>
                        </div>

                        {/* Individual Card */}
                        <div className="relative w-full lg:flex-none lg:w-[556px]">
                            <div className="absolute inset-0 pointer-events-none hidden lg:block"
                                style={{ width: 556, height: 474 }}>
                                <img alt="" src={A_IND_VECTOR} className="w-full h-full"
                                    style={{ transform: "scaleY(-1) rotate(180deg)" }} />
                            </div>
                            <div className="relative rounded-2xl overflow-hidden lg:mx-[19px] lg:mt-[19px]"
                                style={{ height: 302 }}>
                                <img alt="Individual campaign" src={A_IND_PHOTO}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute top-4 left-4 rounded-[10px] p-4 shadow-[0_10px_10px_-7px_rgba(0,0,0,0.15)] overflow-hidden"
                                    style={{ width: 186, background: "linear-gradient(225deg,rgb(255,229,178) 16.7%,rgb(255,255,255) 43.3%)" }}>
                                    <div className="absolute -top-7 -right-7 overflow-hidden" style={{ width: 101, height: 101 }}>
                                        <img alt="" src={A_IND_MEDAL} width={101} height={101} style={{ display: "block" }} />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#f4f8f9] shrink-0">
                                            <img alt="" src={A_IND_AVATAR} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-black text-[#003060] text-[10px]">Stephanie</p>
                                            <p className="font-medium text-[#003060] text-[10px]">Smith</p>
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden mx-1" style={{ height: 16, borderRadius: 50 }}>
                                        <div className="absolute inset-0 bg-[#f2f2f2]" />
                                        <div className="absolute left-0 top-0 h-full rounded-[505px] bg-gradient-to-r from-[#28c45d] to-[#34d56a] shadow-[0_0_6px_rgba(40,196,93,0.5)]"
                                            style={{ width: "85%" }} />
                                        <img alt="" src={A_IND_BAR} className="absolute inset-0 h-full max-w-none" />
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white text-[7px] font-black whitespace-nowrap">
                                            90% <span className="font-medium">Raised</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-5 lg:px-6 lg:pt-6 pb-4 lg:pb-6 flex flex-col lg:items-end">
                                <p className="font-black text-[#0268c0] text-xl lg:text-2xl mb-2 lg:mb-3 w-full lg:text-right">Individual Campaigns</p>
                                <p className="text-[#2f3a45] text-base lg:text-lg leading-relaxed lg:text-right">
                                    Each participant has an individual goal. Supports friendly competition with leaderboards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Real Stories ── */}
                <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] pb-16 lg:pb-24">
                    <div className="flex flex-col items-center gap-4 mb-10 lg:mb-16">
                        <SectionBadge label="real stories" />
                        <h2 className="font-black text-[#003060] text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-center">
                            How people use FundbyText
                        </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 items-stretch sm:items-end justify-center">
                        {[
                            { img: A_CARD_DOG,        tag: "Personal",             title: "Fund to Fix My Car After Hit and Run", desc: "Lorem ipsum dolor sit amet consecte tur quet adipiscing elit semper dalarac.", offset: 0  },
                            { img: A_CARD_SOFTBALL,   tag: "Sports",               title: "Colorado Sparkler Softball Trip",       desc: "Lorem ipsum dolor sit amet consecte tur quet adipiscing elit semper dalarac.", offset: 15 },
                            { img: A_CARD_VOLLEYBALL, tag: "Healthcare & Medical", title: "Raising Funds for a New Chair",         desc: "Lorem ipsum dolor sit amet consecte tur quet adipiscing elit semper dalarac.", offset: 14 },
                        ].map((card, i) => (
                            <div key={i}
                                className="bg-white rounded-2xl border border-[#eaeef3] shadow-sm hover:shadow-md transition-shadow flex-none w-full sm:w-[368px]"
                                style={{ marginBottom: card.offset }}>
                                <div className="relative h-[220px] rounded-t-2xl overflow-hidden">
                                    <img alt={card.title} src={card.img}
                                        className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="p-5 lg:p-6">
                                    <div className="inline-flex bg-[#feece4] px-1.5 py-1 rounded-[6px] mb-3">
                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{card.tag}</span>
                                    </div>
                                    <p className="font-black text-[#003060] text-lg lg:text-xl leading-snug mb-2">{card.title}</p>
                                    <p className="text-[#7e8a96] text-sm leading-relaxed">{card.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="w-6 h-2 rounded-full bg-[#003060]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                    </div>
                </div>

                {/* ── CTA ── */}
                <div className="relative overflow-hidden"
                    style={{ background: "linear-gradient(to bottom,#ffffff 0%,#e8f4fd 40%,#c5e3f7 100%)" }}>
                    <div className="absolute left-1/4 top-10 w-[500px] h-[400px] rounded-full bg-[#2196fd]/20 blur-3xl pointer-events-none" />
                    <div className="absolute right-1/4 top-20 w-[400px] h-[300px] rounded-full bg-[#0268c0]/15 blur-3xl pointer-events-none" />
                    <div className="max-w-[1632px] mx-auto px-4 sm:px-6 lg:px-[144px] relative z-10">
                        <div className="flex flex-col items-center gap-4 lg:gap-6 py-16 lg:py-28">
                            <h2 className="font-black text-[#003060] text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-center">
                                Ready to Inspire?
                            </h2>
                            <p className="font-bold text-[#003060] text-lg lg:text-2xl text-center">
                                Start Your FundbyText Campaign Today.
                            </p>
                            <Link href="/campaigns/create"
                                className="mt-2 lg:mt-4 flex items-center gap-2 px-7 py-[18px] lg:py-[22px] rounded-[20px] text-white font-black text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden"
                                style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                                <span>Get Started for Free</span>
                                <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════ */}
            <footer style={{ background: "#003060" }} className="px-4 sm:px-6 pt-16 lg:pt-28 pb-8">
                <div className="max-w-[1152px] mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

                        {/* Left column */}
                        <div className="flex-1 flex flex-col gap-8 lg:gap-10 p-6 lg:p-10">
                            <Link href="/" className="self-start">
                                <FundByTextLogo size="md" />
                            </Link>
                            <div className="flex flex-row gap-10 lg:gap-16">
                                <div>
                                    <p className="text-white/40 text-xs font-black uppercase tracking-[1px] mb-6 lg:mb-9">Navigate</p>
                                    <ul className="space-y-[22px] lg:space-y-[34px]">
                                        {["Browse Campaigns", "How It Works", "FAQs", "Resources", "About Us", "Help & Support"].map((l) => (
                                            <li key={l}>
                                                <Link href="#" className="text-white/60 text-sm hover:text-white transition-colors">{l}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-black uppercase tracking-[1px] mb-6 lg:mb-9">Payment methods</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            {["Visa", "MC", "PayPal"].map((p) => (
                                                <div key={p} className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                                                    <span className="text-white/70 text-[9px] font-bold">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {["JCB", "Swift"].map((p) => (
                                                <div key={p} className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                                                    <span className="text-white/70 text-[9px] font-bold">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 lg:gap-10">
                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
                                        <svg className="w-[18px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.127 1.195 4.937 4.937 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                                        </svg>
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-white/40 text-xs">1901 Thornridge Cir. Shiloh, Hawaii 81063</p>
                            </div>
                        </div>

                        {/* Right CTA card */}
                        <div className="relative overflow-hidden rounded-2xl p-8 lg:p-10 flex flex-col gap-4 shrink-0 w-full lg:w-[328px]"
                            style={{
                                background: "repeating-linear-gradient(-45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 12px)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                            }}>
                            <div className="absolute inset-0 pointer-events-none rounded-2xl"
                                style={{ background: "linear-gradient(to bottom right,rgba(0,48,96,0.6),transparent)" }} />
                            <div className="relative z-10">
                                <p className="font-black text-white text-2xl lg:text-3xl leading-snug mb-3 lg:mb-4">
                                    Ready to<br />Inspire?
                                </p>
                                <p className="text-white/60 text-sm mb-6 lg:mb-8 leading-relaxed">
                                    Start your FundbyText campaign today and make an impact.
                                </p>
                                <div className="space-y-3 lg:space-y-4">
                                    <Link href="/campaigns/create"
                                        className="flex items-center justify-center w-full py-3 rounded-full text-white font-black text-xs tracking-[1px] uppercase transition-colors"
                                        style={{ background: "#ea6725" }}>
                                        Get Started for Free
                                    </Link>
                                    <Link href="#how-it-works"
                                        className="flex items-center justify-center w-full py-3 rounded-full text-white/60 font-black text-xs tracking-[1px] uppercase border border-white/20 hover:border-white/40 transition-colors">
                                        See How It Works
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-white/30 text-xs">© FundbyText 2025 — All Rights Reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Privacy.</Link>
                            <Link href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Terms &amp; Conditions.</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
