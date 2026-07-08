import Link from "next/link";
import CurrentYear from "@/components/CurrentYear";
import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import FundByTextLogo from "@/components/FundByTextLogo";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const AB = "/figma/about";
const HW = "/figma/how-it-works";

const A_HERO_BLUR  = `${F}/hero-blur.svg`;
const A_FLAG_PIN   = `${F}/flag-pin.svg`;
const A_VID_PLAY   = `${F}/vid-play.svg`;
const PAY          = "/assets/marketing/footer";

const A_STAT_CAMPAIGNS = `${F}/stat-campaigns.png`;
const A_STAT_GOALS     = `${F}/stat-goals.png`;
const A_STAT_ORGS      = `${F}/stat-orgs.png`;
const A_STAT_RAISED    = `${F}/stat-raised.png`;

const A_HERO_VIDEO = `${AB}/hero-video.jpg`;

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

const MADE_EASY_CARDS = [
    { img: `${HW}/card-1.png`, title: "How to Start a Campaign",                          body: "Pick a campaign type, set your goal, and our AI helps you launch in minutes—no setup fees, no friction.",            elevated: false },
    { img: `${HW}/card-2.png`, title: "How Participants do their part",                    body: "Participants share a simple text link with their network, inviting friends and family to give in just a few taps.",   elevated: true  },
    { img: `${HW}/card-3.png`, title: "Donations and Completing a Campaign and Payment",   body: "Donors give securely by text, we deduct a flat 15% fee, and your check is mailed within 10 business days.",          elevated: false },
];

// Cards 4 & 5 were "Lorem Ipsum Dolor" placeholders — replaced with real
// differentiators (real-time tracking + secure payouts).
const APART_CARDS = [
    { img: `${HW}/apart-1.png`, title: "How to Start a Campaign",          body: "Tell us why you are raising funds, who it is for and what your goal is. From there, you can add your logo, profile picture and photos. We will then use that information to create shareable content that will help get the word out about your campaign. It’s that easy!" },
    { img: `${HW}/apart-2.png`, title: "How Participants do their part",    body: "Participants reach out to their network of associates, friends and family and directly inform them of your campaign. Donors are then directed to your campaign home page to read about your goals and make donations. It’s fundraising made simple!" },
    { img: `${HW}/apart-3.png`, title: "Social Media Shareables",          body: "Getting the word out on social media can really add donors to your campaign. That is why we create them for you. All you have to do is post them. We use your supplied images and text to create a short video highlighting your campaign that can be shared on every platform, complete with a QR code that sends donors to your campaign home page." },
    { img: `${HW}/apart-4.png`, title: "Track Every Donation Live",        body: "Watch your campaign climb in real time. A live dashboard shows every text, share and donation the moment it lands, so you always know exactly how close you are to your goal." },
    { img: `${HW}/apart-5.png`, title: "Secure Payouts, Simple Fees",      body: "Donations are processed securely with one flat 15% fee and no surprises. Your check is mailed within 10 business days, so funds reach your cause quickly and transparently." },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HowItWorksPage() {
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
                HERO  (shared with the About hero)
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
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

                <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-[56px] pt-6 lg:pt-10 px-4 sm:px-6 lg:px-36 w-full">
                    <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-[654px]">
                        <SectionBadge label="About FundByText" />
                        <h1 className="font-black text-[32px] md:text-[46px] lg:text-[64px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent w-full"
                            style={{ backgroundImage: "linear-gradient(139deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            Fundraising without the friction.
                        </h1>
                    </div>

                    <div className="relative w-full max-w-[1152px] h-[249px] md:h-[300px] lg:h-[500px] rounded-[12px] md:rounded-[14px] lg:rounded-[24px] overflow-hidden shadow-[0_20px_20px_-14px_rgba(2,104,192,0.2),0_40px_40px_-16px_rgba(2,104,192,0.2)]"
                        style={{ background: "#f2f2f2" }}>
                        <img alt="A team celebrating a fundraising win" src={A_HERO_VIDEO}
                            className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div style={{ width: "clamp(47px,7vw,94px)", height: "clamp(47px,7vw,94px)" }}>
                                <img alt="Play" src={A_VID_PLAY} className="w-full h-full cursor-pointer hover:scale-105 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>

                <svg className="block w-full" viewBox="0 0 1440 120" preserveAspectRatio="none"
                    style={{ height: "clamp(44px,7vw,110px)", display: "block", marginTop: -1, marginBottom: -2 }} aria-hidden="true">
                    <path d="M0,72 Q720,2 1440,72 L1440,120 L0,120 Z" fill="white" />
                </svg>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                FUNDRAISING MADE EASY
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-4 lg:pt-10 pb-12 lg:pb-20 px-4 sm:px-6 lg:px-36">
                <div className="flex flex-col items-center gap-10 lg:gap-14 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[1152px]">
                        <SectionBadge label="How it works" />
                        <h2 className="font-black text-3xl sm:text-4xl lg:text-[56px] leading-none tracking-[-1px] text-center bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(169deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            Fundraising made easy
                        </h2>
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[28px] font-normal leading-[1.4]">
                            Experience how FundByText simplifies fundraising with seamless, text-driven solutions that make giving effortless, secure, and impactful.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-6 w-full justify-center">
                        {MADE_EASY_CARDS.map((c) => (
                            <div key={c.title}
                                className={`bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-6 lg:gap-10 w-full max-w-[420px] lg:max-w-none lg:w-[368px] flex-none ${c.elevated ? "lg:shadow-[0_20px_20px_-12px_rgba(2,120,222,0.3),0_50px_80px_-16px_rgba(2,120,222,0.3)]" : ""}`}>
                                <div className="w-full aspect-[320/250] lg:h-[250px] lg:aspect-auto rounded-[14px] overflow-hidden bg-[#f2f2f2] flex-none">
                                    <img alt="" src={c.img} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="font-black text-[#0268c0] text-[22px] leading-[1.25]">{c.title}</p>
                                    <p className="font-normal text-[#2f3a45] text-[18px] leading-[1.4]">{c.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                STATS
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pb-8 lg:pb-12 px-4 sm:px-6 lg:px-36">
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
                SEE IT IN ACTION  (What Sets Us Apart — 5-card carousel)
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden pt-12 lg:pt-20 pb-16 lg:pb-28"
                style={{ background: "linear-gradient(to bottom,#ffffff 0%,#ffffff 45%,#e8f4ff 100%)" }}>
                {/* Decorative blue wash + grain curving toward the footer */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-160px] w-[1700px] h-[560px] rounded-[50%] pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(33,150,253,0.22) 0%,transparent 66%)" }} />
                <div className="absolute inset-0 mix-blend-overlay opacity-[0.12] pointer-events-none"
                    style={{ backgroundImage: NOISE_URI, backgroundRepeat: "repeat" }} />

                <div className="relative z-10">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-36 mb-10 lg:mb-16">
                        <SectionBadge label="What sets us apart" />
                        <h2 className="font-black text-3xl sm:text-4xl lg:text-[56px] leading-none tracking-[-1px] text-center bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(149deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
                            See It In Action
                        </h2>
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-xl font-normal leading-[1.4]">
                            At FundByText, we combine innovation, simplicity, and impact to redefine the fundraising experience. With AI-enhanced technology, secure transactions, and a personalized approach, we empower you to connect with supporters quickly and effectively.
                        </p>
                    </div>

                    {/* Horizontal carousel (snap-scroll) */}
                    <div className="overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
                        <div className="flex gap-6 items-stretch w-max mx-auto px-4 sm:px-6 lg:px-36">
                            {APART_CARDS.map((c) => (
                                <div key={c.title}
                                    className="bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-6 w-[300px] sm:w-[368px] flex-none"
                                    style={{ scrollSnapAlign: "start" }}>
                                    <div className="flex flex-col gap-2">
                                        <p className="font-black text-[#003060] text-[22px] leading-[1.25]">{c.title}</p>
                                        <p className="font-normal text-[#2f3a45] text-[18px] leading-[1.4]">{c.body}</p>
                                    </div>
                                    <div className="mt-auto w-full rounded-[12px] overflow-hidden bg-[#f2f2f2]" style={{ aspectRatio: "336 / 193" }}>
                                        <img alt="" src={c.img} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination — active wide pill in 2nd position */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="w-2 h-2 rounded-full bg-[#aeccea]" />
                        <div className="w-6 h-2 rounded-full bg-[#003060]" />
                        <div className="w-2 h-2 rounded-full bg-[#aeccea]" />
                        <div className="w-2 h-2 rounded-full bg-[#aeccea]" />
                        <div className="w-2 h-2 rounded-full bg-[#aeccea]" />
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
                    <p className="text-white/50 text-xs">© FundbyText <CurrentYear /> — All Rights Reserved.</p>
                    <div className="flex items-center gap-1.5">
                        <Link href="/privacy" className="text-white/50 text-xs hover:text-white transition-colors">Privacy.</Link>
                        <Link href="/terms" className="text-white/50 text-xs hover:text-white transition-colors">Terms &amp; Conditions.</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
