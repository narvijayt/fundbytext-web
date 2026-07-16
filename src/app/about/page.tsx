import Link from "next/link";
import { getAuthUser } from "@/lib/session";
import { getDefaultCampaignVideo } from "@/lib/settings";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";
import StoriesCarousel, { type Story } from "@/components/home/StoriesCarousel";
import HowItWorksVideo from "@/components/home/HowItWorksVideo";
import HeroBackdrop from "@/components/home/HeroBackdrop";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const AB = "/figma/about";

const A_FLAG_PIN   = `${F}/flag-pin.svg`;

// Streamline Flex glyphs exported from the Figma "What We Aim To Solve" cards —
// filled paths with the design's white→white-70% vertical shading (NOT strokes).
const A_SOLVE_ICON: Record<string, { src: string; size: number }> = {
    pouch: { src: `${AB}/solve-pouch.svg`, size: 24 },
    clock: { src: `${AB}/solve-clock.svg`, size: 28 },
    eye:   { src: `${AB}/solve-eye.svg`,   size: 24 },
    share: { src: `${AB}/solve-share.svg`, size: 24 },
};

const A_STAT_CAMPAIGNS = `${F}/stat-campaigns.png`;
const A_STAT_GOALS     = `${F}/stat-goals.png`;
const A_STAT_ORGS      = `${F}/stat-orgs.png`;
const A_STAT_RAISED    = `${F}/stat-raised.png`;

const A_HERO_VIDEO = `${AB}/hero-video.jpg`;
const A_DIFF_1     = `${AB}/diff-card-1.png`;
const A_DIFF_2     = `${AB}/diff-card-2.png`;
const A_DIFF_3     = `${AB}/diff-card-3.png`;
const A_SOLVE_PHONE = `${AB}/solve-phone.png`;
const A_STORY_CAR  = `${AB}/story-car.jpg`;
const A_STORY_BALL = `${AB}/story-softball.jpg`;
const A_STORY_CHAIR = `${AB}/story-chair.jpg`;

// ── Data ──────────────────────────────────────────────────────────────────────

const DIFF_CARDS = [
    { img: A_DIFF_1, imgBg: "#ffffff", imgRadius: 16, title: "Set it up on your time",  body: "No complicated setups. Just text, share, and start raising.",            elevated: false },
    { img: A_DIFF_2, imgBg: "#f2f2f2", imgRadius: 14, title: "Hassle-free giving",      body: "Donors can contribute with just a few taps.",                              elevated: true  },
    { img: A_DIFF_3, imgBg: "#f2f2f2", imgRadius: 14, title: "Easy to use",             body: "Build a campaign in 4 easy steps, easy tracking, and real-time updates.",  elevated: false },
];

// Note: card 3 & 4 copy had small typos in Figma ("we can the money", "know",
// missing "with") — corrected here for production quality.
const SOLVE_CARDS = [
    { icon: "pouch",   tone: "orange", title: "Inefficient Fundraising",          body: "Why do you need a person to launch a campaign like our competitors do? All you need is the right platform. With Fund By Text, you can create and launch a campaign on your schedule, any time of the day." },
    { icon: "clock",   tone: "blue",   title: "Overcomplicated Donor Process",    body: "Donors simply click the link and they are directed to your campaign home page where they can support your cause." },
    { icon: "eye",     tone: "blue",   title: "Lack of transparency & trust",     body: "Fund By Text charges 15% of all donations to cover processing fees, overhead and marketing costs. Once a campaign is finished, checks are mailed out within 10 business days so that all donations can clear and we can send the money to your bank." },
    { icon: "share",   tone: "orange", title: "If I would have known about it, I would have donated!", body: "You can now reach your entire network by texting and emailing them directly, while sharing your campaign on social media with all of your followers." },
];

const STORIES: Story[] = [
    { img: A_STORY_CAR,   tag: "Individual",         title: "Fund to Fix My Car After Hit and Run", desc: "A hit-and-run left my only car undriveable. Friends are texting to chip in so I can get back to work." },
    { img: A_STORY_BALL,  tag: "Sports",             title: "Colorado Sparkler Softball Trip",      desc: "Help our girls' team travel to the Colorado tournament — a few taps covers jerseys, lodging, and field fees." },
    { img: A_STORY_CHAIR, tag: "Medical and Health", title: "Raising Funds for a New Chair",        desc: "My old wheelchair finally gave out. A quick text-to-give campaign is funding a custom replacement that fits." },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

// The blue flag-pin icon with its glow (glow extends past the box, Figma-exact
// insets) — identical construction to the marketing home page.
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

// Figma "Subheader" pill (261×52): white, #d4dee7 border, blue drop shadow,
// 32px flag glyph + 12px bold uppercase #57728d label. `justify` takes raw
// utilities so callers can flip alignment per breakpoint (the Figma centres this
// pill on mobile/tablet but left-aligns it in the desktop two-column layout).
function SectionBadge({ label, justify = "justify-center" }: { label: string; justify?: string }) {
    return (
        <div className={`flex w-full ${justify}`}>
            <div className="flex items-center gap-2.5 pl-2.5 pr-5 py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)] w-auto">
                <FlagGlyph size={32} />
                <span className="font-bold text-[#57728d] text-xs tracking-[1px] uppercase leading-none whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

function SolveIcon({ name }: { name: string }) {
    const icon = A_SOLVE_ICON[name] ?? A_SOLVE_ICON.pouch;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" src={icon.src} style={{ width: icon.size, height: icon.size }} className="shrink-0" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AboutPage() {
    const [user, defaultVideo] = await Promise.all([
        getAuthUser(),
        getDefaultCampaignVideo().catch(() => null),
    ]);

    const STATS = [
        { img: A_STAT_CAMPAIGNS, imgH: 96, imgW: 80,  smH: 60, smW: 50, value: "200+",   label: "Campaigns Launched" },
        { img: A_STAT_GOALS,     imgH: 70, imgW: 77,  smH: 44, smW: 48, value: "97%",    label: "Goals Met" },
        { img: A_STAT_ORGS,      imgH: 96, imgW: 114, smH: 60, smW: 72, value: "34+",    label: "Organizations" },
        { img: A_STAT_RAISED,    imgH: 88, imgW: 82,  smH: 55, smW: 52, value: "$5.2M+", label: "Raised & Counting" },
    ];

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════ */}
            {/* No overflow-clip here: the video card's drop shadow has to spill onto
                the white section below, exactly as it does in the Figma. */}
            <section className="relative">
                <HeroBackdrop />

                <NavBar user={user} />

                {/* Hero content. The 62px gaps + the video card as the last child put
                    the card's bottom edge on the section boundary (Figma: 428→928). */}
                {/* Figma insets the hero video 32px (mobile) / 38px (tablet); the
                    1152 cap takes over from lg up. */}
                <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-[62px] pt-8 lg:pt-[62px] px-8 md:px-[38px] lg:px-10 w-full">
                    <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-[654px]">
                        <SectionBadge label="About FundByText" />
                        {/* Figma is drawn at 1920 (64px) — scaled down so a laptop isn't shouted at. */}
                        <h1 className="font-black text-[28px] sm:text-[34px] md:text-[40px] lg:text-[46px] xl:text-[54px] 2xl:text-[64px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent pb-[0.12em] w-full"
                            style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            Fundraising without the friction.
                        </h1>
                    </div>

                    {/* Plays the app-settings default campaign video, same as the
                        campaign pages / home "See How It Works" player. */}
                    <HowItWorksVideo videoUrl={defaultVideo} poster={A_HERO_VIDEO} />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                WHAT MAKES US DIFFERENT
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-6 lg:pt-12 pb-12 lg:pb-20 px-4 md:px-6 lg:px-10">
                <div className="flex flex-col items-center gap-10 lg:gap-16 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[900px]">
                        <SectionBadge label="What Makes Us Different" />
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[20px] xl:text-[22px] 2xl:text-[28px] font-normal leading-[1.4]">
                            At FundByText, we believe fundraising should be effortless, transparent, and impactful. We take the complexity out of traditional fundraising by integrating mobile-first, text-driven, and AI-enhanced solutions, helping you connect with donors quickly and securely.
                        </p>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 w-full justify-center">
                        {DIFF_CARDS.map((c) => (
                            <div key={c.title}
                                className={`bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-6 lg:gap-10 w-full md:w-[550px] lg:w-[368px] flex-none ${c.elevated ? "lg:flex-col-reverse lg:shadow-[0_20px_20px_-12px_rgba(2,120,222,0.3),0_50px_80px_-16px_rgba(2,120,222,0.3)]" : ""}`}>
                                <div className="w-full h-[250px] overflow-hidden flex-none"
                                    style={{ background: c.imgBg, borderRadius: c.imgRadius }}>
                                    <img alt="" src={c.img} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="font-black text-[#0268c0] text-[18px] lg:text-[20px] 2xl:text-[22px] leading-[1.25]">{c.title}</p>
                                    <p className="font-normal text-[#2f3a45] text-[15px] lg:text-base 2xl:text-[18px] leading-[1.4]">{c.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 justify-center w-full sm:w-auto">
                        <Link href="/how-it-works"
                            className="flex items-center justify-center px-6 sm:px-7 py-[18px] sm:py-[22px] rounded-[20px] text-white font-black text-xs sm:text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden whitespace-nowrap lg:min-w-[218px]"
                            style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                            <span className="relative z-10">How It Works</span>
                            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                        </Link>
                        <Link href="/campaigns/create"
                            className="flex items-center justify-center px-6 sm:px-7 py-[18px] sm:py-[22px] rounded-[20px] text-white font-black text-xs sm:text-sm tracking-[1px] uppercase shadow-[0_8px_15px_-8px_#ea6725,0_12px_60px_-12px_rgba(255,140,83,0.4)] transition-transform hover:scale-105 relative overflow-hidden whitespace-nowrap"
                            style={{ background: "linear-gradient(to bottom,#ea6725,#ff8c53)" }}>
                            <span className="relative z-10">Get Started for Free</span>
                            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_-4px_3px_-2px_#ea6725,inset_0_3px_2px_-1px_#fbcab1] pointer-events-none" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                STATS
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pb-8 lg:pb-10 px-4 md:px-6 lg:px-10">
                <div className="grid grid-cols-2 md:flex md:items-center md:justify-center max-w-[1200px] mx-auto">
                    {STATS.map((s) => (
                        <div key={s.label} className="flex items-center gap-3 md:gap-3 lg:gap-5 px-4 md:px-3 lg:px-8 py-3 lg:py-4 lg:min-w-[230px] xl:min-w-[260px]">
                            <div className="shrink-0">
                                <img alt="" src={s.img} className="object-contain lg:hidden" style={{ width: s.smW, height: s.smH }} />
                                <img alt="" src={s.img} className="object-contain hidden lg:block" style={{ width: s.imgW, height: s.imgH }} />
                            </div>
                            <div className="flex flex-col gap-1 lg:gap-2 min-w-0">
                                <p className="font-black text-[#0268c0] text-[20px] lg:text-[22px] xl:text-[24px] 2xl:text-[28px] leading-snug truncate">{s.value}</p>
                                <p className="font-black text-[#aeb5bd] text-[8px] lg:text-xs tracking-[1px] uppercase leading-tight">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                WHAT WE AIM TO SOLVE
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white py-12 lg:py-20 px-4 md:px-6 lg:px-10">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 max-w-[1152px] mx-auto">

                    {/* Left column */}
                    <div className="w-full lg:w-[450px] flex-none flex flex-col gap-5 items-center lg:items-start text-center lg:text-left">
                        <SectionBadge label="Increasing generosity" justify="justify-center lg:justify-start" />
                        <h2 className="font-black text-[28px] sm:text-[32px] lg:text-[38px] xl:text-[44px] 2xl:text-[56px] leading-none tracking-[-1px] bg-clip-text text-transparent pb-[0.12em]"
                            style={{ backgroundImage: "linear-gradient(134deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            What we aim to solve
                        </h2>
                        {/* Tablet centres this at 556px (Figma); desktop lets it fill the 450 column. */}
                        <p className="text-[#003060] text-base lg:text-[17px] 2xl:text-xl font-normal leading-[1.4] max-w-[556px] lg:max-w-none">
                            The world is full of generosity, but too often, it&apos;s slowed down by complicated systems. We saw the challenges—donors dropping off, fundraisers struggling, impact delayed. So, we set out to change that.
                        </p>
                        <div className="relative w-full rounded-[16px] overflow-hidden" style={{ aspectRatio: "450 / 259" }}>
                            <img alt="A supporter giving from their phone" src={A_SOLVE_PHONE}
                                className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Right 2×2 grid */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {SOLVE_CARDS.map((c) => {
                            const orange = c.tone === "orange";
                            return (
                                <div key={c.title}
                                    className="relative overflow-hidden bg-white border border-[#eaeef3] rounded-[16px] p-6 flex flex-col gap-6 shadow-[0_1px_4px_0_rgba(25,33,61,0.08)]">
                                    {/* Soft corner glow */}
                                    <div className="absolute -left-[99px] -top-[99px] w-[198px] h-[198px] rounded-full pointer-events-none"
                                        style={{ background: orange
                                            ? "radial-gradient(circle,rgba(255,140,83,0.20),transparent 70%)"
                                            : "radial-gradient(circle,rgba(2,120,222,0.16),transparent 70%)" }} />
                                    {/* Icon tile */}
                                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                                        style={{
                                            background: orange
                                                ? "linear-gradient(to bottom,#f47435,#ff8c53)"
                                                : "linear-gradient(to bottom,#0268c0,#0278de)",
                                            border: `1.5px solid ${orange ? "#ff8c53" : "#0278de"}`,
                                            boxShadow: orange
                                                ? "0 4px 8px -2px #ff8c53,0 12px 32px -2px rgba(255,140,83,0.6)"
                                                : "0 4px 8px -2px #0278de,0 12px 32px -2px rgba(2,120,222,0.6)",
                                        }}>
                                        <SolveIcon name={c.icon} />
                                    </div>
                                    <div className="relative z-10 flex flex-col gap-2">
                                        <p className="font-black text-[#003060] text-[18px] lg:text-[20px] 2xl:text-[22px] leading-[1.25]">{c.title}</p>
                                        <p className="font-normal text-[#2f3a45] text-[15px] lg:text-base 2xl:text-[18px] leading-[1.4]">{c.body}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                REAL STORIES — How people use FundbyText
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-white pt-12 lg:pt-20 pb-16 lg:pb-28 px-4 md:px-6 lg:px-10">
                {/* Blue wash. The Figma builds it from two huge blurred #0081F1
                    ellipses tucked under the section's bottom edge; exported, they
                    flatten to a plain vertical white→blue gradient, so it's coded
                    here — it scales to any section height and needs no raster. */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(180deg,rgba(0,129,241,0) 32%,rgba(0,129,241,0.18) 52%,rgba(0,129,241,0.55) 74%,rgba(0,129,241,0.9) 92%,#0081f1 100%)",
                }} />
                {/* Grain over the wash — the same tile as the hero / dashboard sidebar. */}
                <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-soft-light"
                    style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />

                <div className="relative z-10 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-4 mb-10 lg:mb-16">
                        <SectionBadge label="real stories" />
                        <h2 className="font-black text-[#003060] text-[28px] sm:text-[32px] lg:text-[38px] xl:text-[44px] 2xl:text-[56px] lg:tracking-[-1px] leading-[1.1] text-center">
                            How people use FundbyText
                        </h2>
                    </div>

                    {/* Embla carousel — overflow-hidden (never a scrollbar), drag/swipe
                        to browse, clickable pagination. White pills: they sit on the
                        blue wash here, unlike the home page's white backdrop. */}
                    <StoriesCarousel stories={STORIES} dotTone="white" />
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
