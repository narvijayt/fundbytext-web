import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";

/* ── Shared legal page (privacy / terms / cookies) ──────────────────────────
   Figma 5430:134333. Each policy is the marketing hero (badge + title + intro)
   over a white content card, then the shared footer — the same shell as the
   about page. The Figma is drawn at 1920, so every size steps down and only
   reaches its Figma value at 2xl. */

const A_FLAG_PIN  = "/figma/flag-pin.svg";
const A_HERO_BLUR = "/figma/hero-blur.svg";

// Grey 20px dot grid — the same one the about / campaigns heroes use.
const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

// Figma "Headline Gradient", used on the section titles.
const HEADLINE_GRADIENT = "linear-gradient(172.74deg,rgb(38,91,145) 30.542%,rgb(0,48,96) 69.458%)";

// Section = { title, lead?, bullets?, body? }. Bullets render as a disc list;
// a "Label: text" bullet bolds the label.
export type Section = { title: string; lead?: string; bullets?: string[]; body?: string };

// The blue flag-pin with its glow (Figma-exact insets), as on the marketing pages.
function FlagGlyph({ size }: { size: number }) {
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_FLAG_PIN} className="absolute max-w-none"
                style={{ width: size * 2.875, height: size * 2.875, top: -size * 0.5625, left: -size * 0.9375 }} />
        </div>
    );
}

/* The legal badge differs from the marketing SectionBadge: a white→blue-10
   gradient fill, and a 16px sentence-case navy label rather than the 12px
   uppercase tracked one. */
function PolicyBadge({ label }: { label: string }) {
    return (
        <div className="flex w-full justify-center">
            <div className="flex w-auto items-center gap-2.5 rounded-full border border-[#eaeef3] pl-2.5 pr-5 py-2.5 shadow-[0_12px_20px_-8px_rgba(0,91,172,0.2)]"
                style={{ backgroundImage: "linear-gradient(-90deg,#ffffff 0%,#eff5f5 100%)" }}>
                <FlagGlyph size={32} />
                <span className="whitespace-nowrap text-center font-bold leading-[1.1] text-[13px] lg:text-[14px] 2xl:text-[16px] text-[#003060]">
                    {label}
                </span>
            </div>
        </div>
    );
}

function Bullet({ text }: { text: string }) {
    const i = text.indexOf(":");
    if (i > 0 && i < 24) {
        return (
            <li className="ms-[18px] lg:ms-[26px] 2xl:ms-[42px]">
                <span className="font-bold text-[#003060]">{text.slice(0, i + 1)}</span>{text.slice(i + 1)}
            </li>
        );
    }
    return <li className="ms-[18px] lg:ms-[26px] 2xl:ms-[42px]">{text}</li>;
}

/* Figma "Title + Body Text": a 32px gradient title over 28px charcoal body,
   32px apart. */
function PolicyBlock({ s }: { s: Section }) {
    const bodyCls = "font-normal leading-[1.4] text-[#2f3a45] text-[15px] lg:text-[17px] xl:text-[20px] 2xl:text-[28px]";
    return (
        <div className="flex w-full flex-col items-start gap-4 lg:gap-6 2xl:gap-8">
            {/* bg-clip-text sizes the gradient to the padding box, so the pad keeps
                it off the descenders. */}
            <h2 className="w-full bg-clip-text font-black leading-none tracking-[-1px] text-transparent pb-[0.12em] text-[20px] lg:text-[24px] xl:text-[28px] 2xl:text-[32px]"
                style={{ backgroundImage: HEADLINE_GRADIENT }}>
                {s.title}
            </h2>
            {s.lead && <p className={bodyCls}>{s.lead}</p>}
            {s.bullets && (
                <ul className={`block w-full list-disc space-y-1.5 lg:space-y-2 ${bodyCls}`}>
                    {s.bullets.map((b, i) => <Bullet key={i} text={b} />)}
                </ul>
            )}
            {s.body && <p className={bodyCls}>{s.body}</p>}
        </div>
    );
}

export default async function LegalPage({
    badge, title, intro, sections,
}: { badge: string; title: string; intro: string; sections: Section[] }) {
    const user = await getAuthUser();

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">

            {/* Blue block wraps the nav + headline so its height FOLLOWS the content;
                the card is then pulled up a fixed amount to overlap it (~15-20% at
                every width). A viewport-height backdrop looked right at one width and
                broke at others — it under-lapped entirely at 1024 and ran to 27% at
                1920, because the blue tracked vw while the card's top tracked content. */}
            <section className="relative bg-white">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0" style={{
                            background: "linear-gradient(160deg,rgba(0,56,140,1) 0%,rgba(10,100,210,1) 22%,rgba(33,150,253,1) 48%,rgba(150,215,255,1) 72%,rgba(255,255,255,1) 100%)",
                        }} />
                        <div className="absolute inset-0" style={{
                            background: "radial-gradient(ellipse 88% 64% at 50% 30%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.97) 24%,rgba(190,228,255,0.55) 46%,rgba(33,150,253,0.08) 68%,transparent 84%)",
                        }} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" src={A_HERO_BLUR} className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                            style={{ width: 1500, height: 1450, top: -480, opacity: 0.9 }} />

                        {/* Arch at the blue's bottom — it lands behind the card, so it
                            reads only in the blue strips either side of it. */}
                        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1440 160"
                            preserveAspectRatio="none" style={{ height: "clamp(60px,11vw,170px)" }} aria-hidden="true">
                            <path d="M0,130 Q720,-130 1440,130 L1440,160 L0,160 Z" fill="white" />
                        </svg>

                        <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
                        <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                            style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
                    </div>

                    <NavBar user={user} />

                    {/* Figma "Headline": 914px wide, 24px gaps, centred. The bottom pad
                        leaves blue below it for the card to ride into. */}
                    <div className="relative z-10 mx-auto flex w-full max-w-[914px] flex-col items-center gap-4 lg:gap-6 px-4 md:px-6 pt-8 lg:pt-14 pb-32 lg:pb-52">
                        <PolicyBadge label={badge} />
                        {/* Solid midnight blue in the Figma — the gradient is on the
                            section titles, not on this one. */}
                        <h1 className="text-center font-black leading-[1.1] tracking-[-1px] text-[#003060] text-[28px] sm:text-[34px] md:text-[40px] lg:text-[46px] xl:text-[54px] 2xl:text-[64px]">
                            {title}
                        </h1>
                        <p className="text-center font-medium leading-[1.4] text-[#003060] text-[15px] lg:text-base 2xl:text-lg">
                            {intro}
                        </p>
                    </div>
                </div>

                {/* Content card (Figma 1152 wide, 56/80 padding, 32px blocks). The
                    negative pull is what overlaps it onto the blue. */}
                <div className="relative z-10 -mt-20 lg:-mt-32 px-4 md:px-6 lg:px-10 pb-16 lg:pb-24">
                    <div className="mx-auto flex w-full max-w-[1152px] flex-col items-start gap-6 lg:gap-8 rounded-[24px] border border-[#e7e9eb] bg-white px-5 sm:px-8 lg:px-14 py-10 lg:py-20 shadow-[0px_12px_12px_0px_rgba(0,48,96,0.04),0px_32px_40px_0px_rgba(2,104,192,0.16)]">
                        {sections.map((s) => <PolicyBlock key={s.title} s={s} />)}
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
