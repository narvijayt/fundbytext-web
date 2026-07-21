import { getAuthUser } from "@/lib/session";
import { getDefaultCampaignVideo } from "@/lib/settings";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import HowItWorksVideo from "@/components/home/HowItWorksVideo";
import CardVideo from "@/components/home/CardVideo";
import TypedHeadline from "@/components/home/TypedHeadline";
import ApartCarousel, { type ApartCard } from "@/components/home/ApartCarousel";

// ── Asset paths ───────────────────────────────────────────────────────────────
const F = "/figma";
const AB = "/figma/about";
const HW = "/figma/how-it-works";

const A_FLAG_PIN = `${F}/flag-pin.svg`;

const A_STAT_CAMPAIGNS = `${F}/stat-campaigns.png`;
const A_STAT_GOALS     = `${F}/stat-goals.png`;
const A_STAT_ORGS      = `${F}/stat-orgs.png`;
const A_STAT_RAISED    = `${F}/stat-raised.png`;

const A_HERO_VIDEO = `${AB}/hero-video.jpg`;

// ── Data ──────────────────────────────────────────────────────────────────────

// card-1 is a full illustration that fills its frame; cards 2 & 3 are photos that
// ship letterboxed inside a thick blue frame in the PNG, so they're zoomed to crop
// that frame off and let the photo fill (card-2 is boxed harder, hence more zoom).
// transformOrigin nudges the crop toward the photo when the blue is uneven.
const MADE_EASY_CARDS = [
    { img: `${HW}/card-1.png`, title: "How to Start a Campaign",                        body: "Pick a campaign type, set your goal, and our AI helps you launch in minutes—no setup fees, no friction.",          posterStyle: undefined },
    { img: `${HW}/card-2.png`, title: "How Participants do their part",                  body: "Participants share a simple text link with their network, inviting friends and family to give in just a few taps.", posterStyle: { transform: "scale(1.42)", transformOrigin: "50% 56%" } },
    { img: `${HW}/card-3.png`, title: "Donations and Completing a Campaign and Payment", body: "Donors give securely by text, we deduct a flat 15% fee, and your check is mailed within 10 business days.",        posterStyle: { transform: "scale(1.22)", transformOrigin: "50% 50%" } },
];

// Cards 4 & 5 were "Lorem Ipsum Dolor" placeholders in the Figma — filled in with
// real differentiators (real-time tracking + secure payouts).
const APART_CARDS: ApartCard[] = [
    { img: `${HW}/apart-1.png`, title: "How to Start a Campaign",       body: "Tell us why you are raising funds, who it is for and what your goal is. From there, you can add your logo, profile picture and photos. We will then use that information to create shareable content that will help get the word out about your campaign. It’s that easy!" },
    { img: `${HW}/apart-2.png`, title: "How Participants do their part", body: "Participants reach out to their network of associates, friends and family and directly inform them of your campaign. Donors are then directed to your campaign home page to read about your goals and make donations. It’s fundraising made simple!" },
    { img: `${HW}/apart-3.png`, title: "Social Media Shareables",       body: "Getting the word out on social media can really add donors to your campaign. That is why we create them for you. All you have to do is post them — complete with a QR code that sends donors to your campaign home page." },
    { img: `${HW}/apart-4.png`, title: "Track Every Donation Live",     body: "Watch your campaign climb in real time. A live dashboard shows every text, share and donation the moment it lands, so you always know exactly how close you are to your goal." },
    { img: `${HW}/apart-5.png`, title: "Secure Payouts, Simple Fees",   body: "Donations are processed securely with one flat 15% fee and no surprises. Your check is mailed within 10 business days, so funds reach your cause quickly and transparently." },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

// The blue flag-pin icon with its glow (the glow extends past the box, Figma-exact
// insets) — identical construction to /about and the marketing home page.
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

/**
 * Figma "Subheader" pill. Two labellings live in these frames and they are NOT
 * interchangeable:
 *  - `tone="section"` (default): 12px bold, #57728d, uppercase, 1px tracking —
 *    the section badges ("How it works", "What sets us apart"), same as /about.
 *  - `tone="hero"`: #003060, sentence case, no tracking, and it steps 12→16px at
 *    tablet — only the hero's "How Fundraising Works with FundByText".
 */
function SectionBadge({ label, tone = "section" }: { label: string; tone?: "section" | "hero" }) {
    const hero = tone === "hero";
    return (
        <div className="flex w-full justify-center">
            <div className="flex items-center gap-2.5 pl-2.5 pr-5 py-2.5 rounded-full bg-white border border-[#d4dee7] shadow-[0_12px_20px_0_rgba(0,91,172,0.2)] w-auto">
                <FlagGlyph size={32} />
                <span className={hero
                    ? "font-bold text-[#003060] text-[12px] md:text-[15px] xl:text-base leading-none whitespace-nowrap"
                    : "font-bold text-[#57728d] text-xs tracking-[1px] uppercase leading-none whitespace-nowrap"}>
                    {label}
                </span>
            </div>
        </div>
    );
}

// Figma's section headings are drawn at 56px on the 1920 board and 46px at tablet;
// scaled down through the range so a laptop isn't shouted at.
function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="font-black text-[28px] sm:text-[32px] md:text-[38px] lg:text-[42px] xl:text-[48px] 2xl:text-[56px] leading-[1.1] tracking-[-1px] text-center bg-clip-text text-transparent pb-[0.1em]"
            style={{ backgroundImage: "linear-gradient(169deg,rgb(38,91,145) 30.5%,rgb(0,48,96) 69.5%)" }}>
            {children}
        </h2>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = {
    title: "How It Works",
    description: "See how FundByText turns a text into a fundraiser — create a campaign, share your link, and let supporters give in a few taps.",
};

export default async function HowItWorksPage() {
    const [user, defaultVideo] = await Promise.all([
        getAuthUser(),
        getDefaultCampaignVideo().catch(() => null),
    ]);

    const STATS = [
        // xs* is the below-sm tier. The grid is 2-up until md and the section adds
        // its own px-4, so a cell is only ~137px on a 339px phone — at the tablet
        // icon + 22px type there was nothing left for the value and "34+" / "$5.2M+"
        // clipped to "3…" / "$5…". Below sm the icon drops to ~0.68x and the number
        // to 17px so every figure fits whole; sm restores these sizes.
        { img: A_STAT_CAMPAIGNS, imgH: 96, imgW: 80,  smH: 60, smW: 50, xsH: 41, xsW: 34, value: "200+",   label: "Campaigns Launched" },
        { img: A_STAT_GOALS,     imgH: 70, imgW: 77,  smH: 44, smW: 48, xsH: 30, xsW: 33, value: "97%",    label: "Goals Met" },
        { img: A_STAT_ORGS,      imgH: 96, imgW: 114, smH: 60, smW: 72, xsH: 41, xsW: 49, value: "34+",    label: "Organizations" },
        { img: A_STAT_RAISED,    imgH: 88, imgW: 82,  smH: 55, smW: 52, xsH: 37, xsW: 35, value: "$5.2M+", label: "Raised & Counting" },
    ];

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* ═══════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════ */}
            {/* No overflow-clip: the video card's drop shadow has to spill onto the
                white section below, exactly as it does in the Figma. */}
            <section className="relative">
                <HeroBackdrop />

                <NavBar user={user} />

                <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-[62px] pt-8 lg:pt-[62px] px-8 md:px-[38px] lg:px-10 w-full">
                    <div className="flex flex-col items-center gap-6 w-full max-w-[654px]">
                        <SectionBadge label="How Fundraising Works with FundByText" tone="hero" />
                        <TypedHeadline />
                    </div>

                    {/* Plays the app-settings default campaign video, same player as the
                        campaign pages / About hero. The old markup here was a bare <img>
                        play button that did nothing when clicked. */}
                    <HowItWorksVideo videoUrl={defaultVideo} poster={A_HERO_VIDEO} />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                FUNDRAISING MADE EASY
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pt-6 lg:pt-12 pb-12 lg:pb-20 px-4 md:px-6 lg:px-10">
                <div className="flex flex-col items-center gap-10 lg:gap-16 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[1152px]">
                        <SectionBadge label="How it works" />
                        <SectionHeading>Fundraising made easy</SectionHeading>
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[20px] xl:text-[22px] 2xl:text-[28px] font-normal leading-[1.4]">
                            Experience how FundByText simplifies fundraising with seamless, text-driven solutions that make giving effortless, secure, and impactful.
                        </p>
                    </div>

                    {/* Stack at tablet (3 × 550-wide cards), three-across at desktop.
                        items-stretch makes all three the same height (the titles/bodies
                        vary in length, so content-driven heights differed); the shorter
                        cards just carry a little space under their body. */}
                    <div className="flex flex-col items-center lg:flex-row lg:items-stretch gap-6 w-full justify-center">
                        {MADE_EASY_CARDS.map((c) => (
                            <div key={c.title}
                                /* No card is elevated at rest — the blue shadow only appears
                                   on the card the pointer is over. */
                                className="bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-4 lg:gap-5 w-full md:w-[550px] lg:w-[368px] flex-none transition-shadow duration-300 hover:shadow-[0_20px_20px_-12px_rgba(2,120,222,0.3),0_50px_80px_-16px_rgba(2,120,222,0.3)]">
                                {/* Keep the PNG's own 320/250 (640×500) aspect at every
                                    width — the blue frame is baked into the image, so forcing
                                    a taller box cropped it top and bottom. */}
                                <div className="relative w-full aspect-[320/250] rounded-[14px] overflow-hidden bg-[#f2f2f2] flex-none">
                                    <CardVideo videoUrl={defaultVideo} poster={c.img} posterStyle={c.posterStyle} />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="font-black text-[#0268c0] text-[18px] lg:text-[20px] 2xl:text-[22px] leading-[1.25]">{c.title}</p>
                                    <p className="font-normal text-[#2f3a45] text-[15px] lg:text-base 2xl:text-[18px] leading-[1.4]">{c.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                STATS
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white pb-4 lg:pb-6 px-4 md:px-6 lg:px-10">
                <div className="grid grid-cols-2 md:flex md:items-center md:justify-center max-w-[1200px] mx-auto">
                    {/* lg:px-4 (not px-8): at exactly lg the four cells sit at their
                        min-width, and the wider padding left the 28px figures without
                        room — "34+" and "$5.2M+" clipped. xl has the space for px-8. */}
                    {STATS.map((s) => (
                        <div key={s.label} className="flex items-center gap-2 sm:gap-3 lg:gap-5 px-2 sm:px-4 md:px-3 lg:px-4 xl:px-8 py-3 lg:py-4 lg:min-w-[230px] xl:min-w-[260px]">
                            <div className="shrink-0">
                                {/* Sizes ride on inline CSS vars so the Tailwind classes stay
                                    static literals — arbitrary classes built from template
                                    literals get purged from the prod CSS (see VectorWallpaper). */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" src={s.img}
                                    className="object-contain w-(--iw) h-(--ih) sm:w-(--iw-sm) sm:h-(--ih-sm) lg:w-(--iw-lg) lg:h-(--ih-lg)"
                                    style={{
                                        "--iw": `${s.xsW}px`,     "--ih": `${s.xsH}px`,
                                        "--iw-sm": `${s.smW}px`,  "--ih-sm": `${s.smH}px`,
                                        "--iw-lg": `${s.imgW}px`, "--ih-lg": `${s.imgH}px`,
                                    } as React.CSSProperties} />
                            </div>
                            <div className="flex flex-col gap-1 lg:gap-2 min-w-0">
                                <p className="font-black text-[#0268c0] text-[17px] sm:text-[22px] lg:text-[28px] leading-snug truncate">{s.value}</p>
                                <p className="font-black text-[#aeb5bd] text-[8px] lg:text-xs tracking-[1px] uppercase leading-tight">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SEE IT IN ACTION  (What Sets Us Apart — 5-card carousel)
            ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-white pt-6 lg:pt-10 pb-16 lg:pb-28 px-4 md:px-6 lg:px-10">
                {/* Blue wash. The Figma builds it from two huge blurred ellipses tucked
                    under the section's bottom edge; exported they flatten to a plain
                    vertical gradient, so it's coded here — it scales to any section
                    height and needs no raster. Same treatment as /about's Real Stories. */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(180deg,rgba(0,129,241,0) 32%,rgba(0,129,241,0.18) 52%,rgba(0,129,241,0.55) 74%,rgba(0,129,241,0.9) 92%,#0081f1 100%)",
                }} />
                <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-soft-light"
                    style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />

                <div className="relative z-10 flex flex-col items-center gap-10 lg:gap-16 max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center gap-5 lg:gap-6 max-w-[1152px]">
                        <SectionBadge label="What sets us apart" />
                        <SectionHeading>See It In Action</SectionHeading>
                        <p className="text-center text-[#2f3a45] text-base sm:text-lg lg:text-[20px] xl:text-[22px] 2xl:text-[28px] font-normal leading-[1.4]">
                            At FundByText, we combine innovation, simplicity, and impact to redefine the fundraising experience. With AI-enhanced technology, secure transactions, and a personalized approach, we empower you to connect with supporters quickly and effectively.
                        </p>
                    </div>

                    <ApartCarousel cards={APART_CARDS} />
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
