import { getAuthUser } from "@/lib/session";
import NavBar from "@/components/NavBar";
import MarketingFooter from "@/components/MarketingFooter";

const A_HERO_BLUR = "/figma/hero-blur.svg";

// Grey 2×2 square dot grid on a 20px tile — the same texture the marketing hero
// (About / How-It-Works / home) uses, so the auth hero reads identically. The old
// auth layout used brighter white dots, which drifted from the rest of the site.
const GRAY_DOTS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

// White curved area — the SAME gentle arch as the home hero, not a dome. A
// fixed-height sweep (--curve-h) forms the top (a soft centre-up bulge behind the
// cards) and a second solid mask fills full-width white below it, down to the
// footer. The old version was a tall centre-peaked dome that swept down to a thin
// strip at the edges, leaving big blue triangles — which read as wrong.
const ARCH_CURVE = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 100' preserveAspectRatio='none'><path d='M0,88 Q720,0 1440,88 L1440,100 L0,100 Z' fill='white'/></svg>",
)}")`;
const ARCH_SOLID = "linear-gradient(#000,#000)";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const user = await getAuthUser();

    return (
        <div className="font-sans text-gray-900 overflow-x-hidden">
            <section className="relative overflow-hidden">
                {/* ── Hero background — the same treatment as the marketing hero
                    (HeroBackdrop): flat bright-blue base, a broad white halo behind the
                    card, the hero-blur glow, grey square dots and the soft-light grain. ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Base blue — flat, bright, reads the same on both edges. */}
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(176deg,rgba(37,144,242,1) 0%,rgba(63,158,245,1) 26%,rgba(69,161,245,1) 52%,rgba(74,164,245,1) 76%,rgba(54,153,243,1) 100%)",
                    }} />
                    {/* White halo behind the auth card. */}
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 78% 46% at 50% 22%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.95) 26%,rgba(198,231,255,0.5) 48%,rgba(37,144,242,0.10) 72%,transparent 88%)",
                    }} />
                    {/* Glow. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_HERO_BLUR}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ width: 1600, height: 1546, top: -560, opacity: 0.9 }} />
                    {/* Grey square dot grid — same tile/colour as the marketing hero. */}
                    <div className="absolute inset-0" style={{ backgroundImage: GRAY_DOTS, backgroundRepeat: "repeat" }} />
                    {/* Grain — the dashboard-sidebar noise, soft-light. */}
                    <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                        style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
                </div>

                <NavBar user={user} />

                {/* Centered auth card (+ optional content below, e.g. the login campaign
                    cards). The campaign cards are the last child, so the white arch below
                    rises just behind their lower edge — they straddle the blue → white
                    seam, matching the Figma. */}
                <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-14 px-4 sm:px-6 lg:px-10 pt-8 lg:pt-14 pb-0">
                    {children}
                </div>

                {/* ── White curved area. A dotted-white layer carries the grey dots
                    straight off the blue; its top is a fixed-height gentle sweep
                    (--curve-h, a soft centre-up bulge behind the cards) with a solid
                    mask filling full-width white below, down to the footer. The negative
                    top margin lifts the whole thing up so the sweep rides behind the
                    cards' lower edge. ── */}
                <div className="relative z-0 -mt-[clamp(96px,13vw,190px)] h-[clamp(200px,26vw,380px)] [--curve-h:96px] lg:[--curve-h:150px]">
                    <div className="absolute inset-0" style={{
                        background: `${GRAY_DOTS} 0 0 / 20px 20px repeat, white`,
                        WebkitMaskImage: `${ARCH_CURVE}, ${ARCH_SOLID}`, maskImage: `${ARCH_CURVE}, ${ARCH_SOLID}`,
                        WebkitMaskSize: "100% var(--curve-h), 100% calc(100% - var(--curve-h) + 1px)",
                        maskSize: "100% var(--curve-h), 100% calc(100% - var(--curve-h) + 1px)",
                        WebkitMaskPosition: "top, bottom", maskPosition: "top, bottom",
                        WebkitMaskRepeat: "no-repeat, no-repeat", maskRepeat: "no-repeat, no-repeat",
                    }} />
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
