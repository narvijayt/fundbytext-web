import Link from "next/link";
import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import FundByTextLogo from "@/components/FundByTextLogo";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const AB = "/figma/about";

const A_HERO_BLUR  = `${F}/hero-blur.svg`;
const A_FLAG_PIN   = `${F}/flag-pin.svg`;
const A_VID_PLAY   = `${F}/vid-play.svg`;
const A_BAR_TEXTURE = `${F}/bar-texture.svg`;
const PAY          = "/assets/marketing/footer";

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

// ── Custom textures (coded, not raster) ────────────────────────────────────────
const F_GLYPH = "M9.21961 0C4.12776 0 0 4.189 0 9.35639V21.9925H6.80123V13.1382C6.80123 11.9286 7.76713 10.9483 8.95907 10.9483H23.0981V14.5017H10.8428V18.7607H21.7073V22.0008H10.8691L3.75375 39H15.5243L27.3901 21.9934V0H9.21961Z";

const NOISE_URI = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

function fWatermarkUri(alpha: number) {
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'>` +
        `<g fill='rgba(255,255,255,${alpha})'>` +
        `<g transform='translate(14,16) rotate(-12) scale(1.25)'><path d='${F_GLYPH}'/></g>` +
        `<g transform='translate(96,86) rotate(14) scale(0.95)'><path d='${F_GLYPH}'/></g>` +
        `</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(33%2C150%2C253%2C0.35)'/%3E%3C/svg%3E")`;

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

const STORIES = [
    { img: A_STORY_CAR,   tag: "Individual",         title: "Fund to Fix My Car After Hit and Run", body: "A hit-and-run left my only car undriveable. Friends are texting to chip in so I can get back to work.",            offset: 0  },
    { img: A_STORY_BALL,  tag: "Sports",             title: "Colorado Sparkler Softball Trip",       body: "Help our girls' team travel to the Colorado tournament — a few taps covers jerseys, lodging, and field fees.",     offset: 15 },
    { img: A_STORY_CHAIR, tag: "Medical and Health", title: "Raising Funds for a New Chair",         body: "My old wheelchair finally gave out. A quick text-to-give campaign is funding a custom replacement that fits.",     offset: 14 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
    return (
        <div className="flex justify-center w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-2.5 pr-3 sm:pr-5 py-2 sm:py-2.5 rounded-full border border-[#d4dee7] shadow-[0_12px_20px_-8px_rgba(0,91,172,0.2)] w-auto bg-white">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 shrink-0 overflow-hidden">
                    <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                        style={{ width: 92, height: 92, top: -14, left: -24 }} />
                </div>
                <span className="font-bold text-[#57728d] text-[9px] sm:text-xs tracking-[0.5px] sm:tracking-[1px] uppercase whitespace-nowrap">{label}</span>
            </div>
        </div>
    );
}

function SolveIcon({ name }: { name: string }) {
    const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (name === "pouch") return (
        <svg {...common}>
            <path d="M5 9c0-1 1-2 2.5-2.5C9 6 9.5 4.5 12 4.5s3 1.5 4.5 2C18 7 19 8 19 9c1.5 2 2 4 2 6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4c0-2 .5-4 2-6Z" />
            <path d="M9 6.5 8 3.5M15 6.5l1-3M9.5 13h5" />
        </svg>
    );
    if (name === "clock") return (
        <svg {...common}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <path d="M12 8v4l2.5 2" />
        </svg>
    );
    if (name === "eye") return (
        <svg {...common}>
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.8" />
        </svg>
    );
    // share / network
    return (
        <svg {...common}>
            <circle cx="6" cy="12" r="2.6" /><circle cx="17.5" cy="6" r="2.6" /><circle cx="17.5" cy="18" r="2.6" />
            <path d="M8.3 10.8 15.2 7.2M8.3 13.2l6.9 3.6" />
        </svg>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AboutPage() {
    const user = await getAuthUser();

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
            <section className="relative overflow-hidden">
                {/* Background: coded layers (reused from the home hero) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(160deg,rgba(0,56,140,1) 0%,rgba(10,100,210,1) 22%,rgba(33,150,253,1) 48%,rgba(150,215,255,1) 72%,rgba(255,255,255,1) 100%)",
                    }} />
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 88% 64% at 50% 30%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.97) 24%,rgba(190,228,255,0.55) 46%,rgba(33,150,253,0.08) 68%,transparent 84%)",
                    }} />
                    <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                    <div className="absolute inset-0 mix-blend-overlay opacity-[0.15]"
                        style={{ backgroundImage: NOISE_URI, backgroundRepeat: "repeat" }} />
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1500, height: 1450, top: -480, opacity: 0.9 }} />
                </div>

                <NavBar user={user} />

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-[56px] pt-6 lg:pt-10 px-4 sm:px-6 lg:px-36 w-full">
                    <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-[654px]">
                        <SectionBadge label="About FundByText" />
                        <h1 className="font-black text-[32px] md:text-[46px] lg:text-[64px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent w-full"
                            style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            Fundraising without the friction.
                        </h1>
                    </div>

                    {/* Video / photo card */}
                    <div className="relative w-full max-w-[1152px] h-[249px] md:h-[300px] lg:h-[500px] rounded-[12px] md:rounded-[14px] lg:rounded-[24px] overflow-hidden shadow-[0_20px_20px_-14px_rgba(2,104,192,0.2),0_40px_40px_-16px_rgba(2,104,192,0.2)]"
                        style={{ background: "#f2f2f2" }}>
                        <img alt="A team celebrating a fundraising win" src={A_HERO_VIDEO}
                            className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                style={{ width: "clamp(47px,7vw,94px)", height: "clamp(47px,7vw,94px)" }}>
                                <img alt="Play" src={A_VID_PLAY} className="w-full h-full" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* White arch base — fades the blue hero into the white section below */}
                <svg className="block w-full" viewBox="0 0 1440 120" preserveAspectRatio="none"
                    style={{ height: "clamp(44px,7vw,110px)", display: "block", marginTop: -1, marginBottom: -2 }} aria-hidden="true">
                    <path d="M0,72 Q720,2 1440,72 L1440,120 L0,120 Z" fill="white" />
                </svg>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                WHAT MAKES US DIFFERENT
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-6 lg:pt-12 pb-12 lg:pb-20 px-4 sm:px-6 lg:px-36">
                <div className="flex flex-col items-center gap-10 lg:gap-16 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[900px]">
                        <SectionBadge label="What Makes Us Different" />
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[28px] font-normal leading-[1.4]">
                            At FundByText, we believe fundraising should be effortless, transparent, and impactful. We take the complexity out of traditional fundraising by integrating mobile-first, text-driven, and AI-enhanced solutions, helping you connect with donors quickly and securely.
                        </p>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 w-full justify-center">
                        {DIFF_CARDS.map((c) => (
                            <div key={c.title}
                                className={`bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-6 lg:gap-10 w-full lg:w-[368px] flex-none ${c.elevated ? "lg:flex-col-reverse lg:shadow-[0_20px_20px_-12px_rgba(2,120,222,0.3),0_50px_80px_-16px_rgba(2,120,222,0.3)]" : ""}`}>
                                <div className="w-full h-[250px] overflow-hidden flex-none"
                                    style={{ background: c.imgBg, borderRadius: c.imgRadius }}>
                                    <img alt="" src={c.img} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="font-black text-[#0268c0] text-[22px] leading-[1.25]">{c.title}</p>
                                    <p className="font-normal text-[#2f3a45] text-[18px] leading-[1.4]">{c.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-center">
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
            <section className="bg-white pb-8 lg:pb-10 px-4 sm:px-6 lg:px-36">
                <div className="grid grid-cols-2 md:flex md:items-center md:justify-center max-w-[1200px] mx-auto">
                    {STATS.map((s) => (
                        <div key={s.label} className="flex items-center gap-3 md:gap-3 lg:gap-5 px-4 md:px-3 lg:px-8 py-3 lg:py-4 lg:min-w-[230px] xl:min-w-[260px]">
                            <div className="shrink-0">
                                <img alt="" src={s.img} className="object-contain lg:hidden" style={{ width: s.smW, height: s.smH }} />
                                <img alt="" src={s.img} className="object-contain hidden lg:block" style={{ width: s.imgW, height: s.imgH }} />
                            </div>
                            <div className="flex flex-col gap-1 lg:gap-2 min-w-0">
                                <p className="font-black text-[#0268c0] text-[22px] lg:text-[28px] leading-snug truncate">{s.value}</p>
                                <p className="font-black text-[#aeb5bd] text-[8px] lg:text-xs tracking-[1px] uppercase leading-tight">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                WHAT WE AIM TO SOLVE
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white py-12 lg:py-20 px-4 sm:px-6 lg:px-36">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-20 max-w-[1152px] mx-auto">

                    {/* Left column */}
                    <div className="w-full lg:w-[450px] flex-none flex flex-col gap-5 items-start">
                        <SectionBadge label="Increasing generosity" />
                        <h2 className="font-black text-[34px] lg:text-[56px] leading-none tracking-[-1px] bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(134deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            What we aim to solve
                        </h2>
                        <p className="text-[#003060] text-base lg:text-xl font-normal leading-[1.4]">
                            The world is full of generosity, but too often, it&apos;s slowed down by complicated systems. We saw the challenges—donors dropping off, fundraisers struggling, impact delayed. So, we set out to change that.
                        </p>
                        <div className="relative w-full rounded-[16px] overflow-hidden mt-1" style={{ aspectRatio: "450 / 259" }}>
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
                                        <p className="font-black text-[#003060] text-[22px] leading-[1.25]">{c.title}</p>
                                        <p className="font-normal text-[#2f3a45] text-[18px] leading-[1.4]">{c.body}</p>
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
            <section className="relative overflow-hidden bg-white pt-12 lg:pt-20 pb-16 lg:pb-28 px-4 sm:px-6 lg:px-36">
                {/* Decorative blue wash + grain at the bottom */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-120px] w-[1500px] h-[520px] rounded-[50%] pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(33,150,253,0.16) 0%,transparent 65%)" }} />
                <div className="absolute inset-0 mix-blend-overlay opacity-10 pointer-events-none"
                    style={{ backgroundImage: NOISE_URI, backgroundRepeat: "repeat" }} />

                <div className="relative z-10 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-4 mb-10 lg:mb-16">
                        <SectionBadge label="real stories" />
                        <h2 className="font-black text-[#003060] text-3xl sm:text-4xl lg:text-[56px] lg:tracking-[-1px] leading-[1.1] text-center">
                            How people use FundbyText
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-stretch sm:items-end justify-center">
                        {STORIES.map((card) => (
                            <div key={card.title}
                                className="bg-white rounded-2xl border border-[#eaeef3] shadow-sm hover:shadow-md transition-shadow flex-none w-full sm:w-[368px]"
                                style={{ marginBottom: card.offset }}>
                                <div className="relative h-[220px] rounded-t-2xl overflow-hidden">
                                    <img alt={card.title} src={card.img} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="p-5 lg:p-6">
                                    <div className="inline-flex bg-[#feece4] px-1.5 py-1 rounded-[6px] mb-3">
                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{card.tag}</span>
                                    </div>
                                    <p className="font-black text-[#003060] text-lg lg:text-xl leading-snug mb-2">{card.title}</p>
                                    <p className="text-[#7e8a96] text-sm leading-relaxed">{card.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination — active wide pill in 2nd position */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-6 h-2 rounded-full bg-[#003060]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                        <div className="w-2 h-2 rounded-full bg-[#eaeef3]" />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════ */}
            <footer style={{ background: "#003060" }} className="px-4 sm:px-6 lg:px-10 pt-14 lg:pt-24 pb-8">
                <div className="max-w-[1280px] mx-auto flex flex-col-reverse lg:flex-row gap-5">

                    {/* Left — white card */}
                    <div className="flex-1 bg-white rounded-[24px] p-7 sm:p-10 lg:p-12">
                        <div className="flex flex-col sm:flex-row gap-10 sm:gap-12 lg:gap-16">
                            <div className="flex flex-col justify-between gap-10 sm:w-[210px]">
                                <Link href="/" className="self-start"><FundByTextLogo size="md" /></Link>
                                <div className="flex items-center gap-3">
                                    <a href="#" aria-label="Telegram" className="flex size-10 items-center justify-center rounded-full bg-[#0268c0] text-white transition hover:brightness-110">
                                        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.5L2.9 11.84c-1.3.52-1.29 1.26-.23 1.58l4.86 1.52 1.88 5.78c.23.63.4.88.84.88.33 0 .5-.15.7-.33l2.36-2.3 4.9 3.62c.9.5 1.55.24 1.78-.84l3.2-15.1c.33-1.32-.5-1.92-1.35-1.65z"/></svg>
                                    </a>
                                    <a href="#" aria-label="WhatsApp" className="flex size-10 items-center justify-center rounded-full bg-[#0268c0] text-white transition hover:brightness-110">
                                        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.99.58 3.84 1.59 5.4L2 22l4.77-1.56A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.47 14.38c-.23.64-1.34 1.23-1.84 1.28-.49.05-.95.23-3.2-.67-2.7-1.06-4.4-3.84-4.53-4.02-.13-.18-1.08-1.43-1.08-2.73s.68-1.94.92-2.2c.24-.27.53-.33.7-.33.18 0 .35 0 .5.01.16.01.38-.06.59.45.23.55.77 1.9.84 2.04.07.13.11.29.02.47-.09.18-.13.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.28-.12.54.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.42.11.58-.07.16-.18.66-.77.84-1.04.18-.27.35-.22.59-.13.24.09 1.52.72 1.78.85.27.13.44.2.5.31.07.11.07.62-.16 1.26z"/></svg>
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[#aeb5bd] text-xs font-black uppercase tracking-[1px] mb-6">Navigate</p>
                                <ul className="space-y-[18px]">
                                    {[
                                        { label: "Browse Campaigns", href: "#" },
                                        { label: "How It Works", href: "/how-it-works" },
                                        { label: "FAQs", href: "#" },
                                        { label: "Resources", href: "#" },
                                        { label: "About Us", href: "/about" },
                                        { label: "Help & Support", href: "/contact" },
                                    ].map((l) => (
                                        <li key={l.label}>
                                            <Link href={l.href} className="text-[#2f3a45] text-sm hover:text-[#0268c0] transition-colors">{l.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="sm:w-[180px] flex flex-col">
                                <p className="text-[#aeb5bd] text-xs font-black uppercase tracking-[1px] mb-6">Payment Methods</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <img alt="Visa" src={`${PAY}/visa.svg`} className="size-8" />
                                        <img alt="Mastercard" src={`${PAY}/mastercard.svg`} className="size-8" />
                                        <img alt="PayPal" src={`${PAY}/paypal.svg`} className="h-8 w-[27px]" />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <img alt="JCB" src={`${PAY}/jcb.svg`} className="size-8" />
                                        <img alt="Swift" src={`${PAY}/swift.svg`} className="size-8" />
                                    </div>
                                </div>
                                <p className="text-[#7e8a96] text-sm leading-relaxed mt-auto pt-10">1901 Thornridge Cir. Shiloh,<br />Hawaii 81063</p>
                            </div>
                        </div>
                    </div>

                    {/* Right — blue CTA card */}
                    <div className="relative overflow-hidden rounded-[24px] p-8 lg:p-10 flex flex-col shrink-0 w-full lg:w-[340px]"
                        style={{ background: "#0268c0" }}>
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ backgroundImage: fWatermarkUri(0.07), backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="font-black text-white text-4xl lg:text-5xl leading-[1.05] mb-4">Ready to<br />Inspire?</h3>
                            <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-8">Start Your FundbyText Campaign Today.</p>
                            <div className="mt-auto space-y-3">
                                <Link href="/campaigns/create"
                                    className="flex items-center justify-center w-full py-3.5 rounded-[14px] text-white font-black text-xs tracking-[1px] uppercase transition hover:brightness-105"
                                    style={{ background: "#f47435" }}>
                                    Get Started for Free
                                </Link>
                                <Link href="/how-it-works"
                                    className="flex items-center justify-center w-full py-3.5 rounded-[14px] text-white font-black text-xs tracking-[1px] uppercase border border-white/30 hover:border-white/60 transition-colors">
                                    See How It Works
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1280px] mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-white/50 text-xs">© FundbyText 2025 — All Rights Reserved.</p>
                    <div className="flex items-center gap-1.5">
                        <Link href="/privacy" className="text-white/50 text-xs hover:text-white transition-colors">Privacy.</Link>
                        <Link href="/terms" className="text-white/50 text-xs hover:text-white transition-colors">Terms &amp; Conditions.</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
