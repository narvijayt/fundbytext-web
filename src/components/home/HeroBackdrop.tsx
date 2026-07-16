// Shared marketing hero backdrop — used by /about and /how-it-works, whose Figma
// frames draw an identical hero band.
//
// The Figma bakes the whole thing into one flat image (gradient → white arch →
// dot grid → grain). It's rebuilt here as coded layers so it scales at every
// breakpoint. Order matters: the arch sits ON the blue, and the dots + grain run
// over BOTH.
//
// This lives in one place on purpose. It used to be copy-pasted per page, and the
// copies drifted — /how-it-works was still carrying the original navy 160deg ramp
// long after /about had been corrected to the flat one below.
//
// Render it inside a `relative` section, before the nav/content. The parent must
// NOT clip: the hero video's drop shadow is meant to spill onto the white section
// underneath, exactly as it does in the Figma.

// Figma's hero dot grid: small grey squares on a 20px grid, run over the blue
// field and the white arch alike (they stay visible on both).
const DOT_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='2' height='2' fill='rgba(87%2C114%2C141%2C0.3)'/%3E%3C/svg%3E")`;

const A_HERO_BLUR = "/figma/hero-blur.svg";

export default function HeroBackdrop() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Base blue. Sampled off the Figma frame, the band is a FLAT, bright
                sky blue that reads the same on both edges (left #2B96F3→#45A1F5→
                #3699F3 top→bottom, right #3B9EF5→#53A9F5) — not a diagonal ramp.
                The old 160deg gradient started at #00388C, which pulled the
                top-left down to ~#012775 (near-navy) while the right edge stayed
                correct, so the band read far darker than the design. White at the
                bottom is the arch's job, so this stays blue all the way down. */}
            <div className="absolute inset-0" style={{
                background: "linear-gradient(176deg,rgba(37,144,242,1) 0%,rgba(63,158,245,1) 26%,rgba(69,161,245,1) 52%,rgba(74,164,245,1) 76%,rgba(54,153,243,1) 100%)",
            }} />
            {/* White halo — one ellipse can't serve both frames, because the design
                spreads it differently: on mobile it washes all the way to the edges
                (#9ACDF8 at x=0) while on desktop it deliberately stops short and
                leaves them saturated (#258FF2 at x=0). Sharing the desktop curve on
                a 375 viewport left a bright centre ringed by blue — reading as a
                "sun" rather than a wash. Each breakpoint gets its own falloff,
                traced from the matching frame. */}
            {/* Mobile: broad, flat wash that stays lit to the edges. Alphas run
                above the raw values traced off the frame because the dot grid and
                the soft-light grain sit over this and eat some of the white. */}
            <div className="absolute inset-0 md:hidden" style={{
                background: "radial-gradient(ellipse 88% 54% at 50% 26%,rgba(255,255,255,1) 0%,rgba(255,255,255,0.96) 32%,rgba(255,255,255,0.82) 50%,rgba(255,255,255,0.58) 68%,rgba(255,255,255,0.3) 86%,rgba(255,255,255,0.12) 100%)",
            }} />
            {/* md+: tighter glow that fades into the blue well before the edges. */}
            <div className="absolute inset-0 hidden md:block" style={{
                background: "radial-gradient(ellipse 84% 62% at 50% 28%,rgba(255,255,255,0.96) 0%,rgba(255,255,255,0.82) 26%,rgba(198,231,255,0.44) 48%,rgba(37,144,242,0.10) 72%,transparent 90%)",
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_HERO_BLUR}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: 1500, height: 1450, top: -480, opacity: 0.9 }} />

            {/* White arch. In the Figma it peaks at ~65.5% of the hero in the
                centre and drops to ~74% at the edges — so it passes through the
                video card about a third of the way down, and is only visible to
                the card's left and right. The card (z-10) straddles it. */}
            <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1920 320"
                preserveAspectRatio="none" style={{ height: "34.5%" }} aria-hidden="true">
                <path d="M0,79 Q960,-79 1920,79 L1920,320 L0,320 Z" fill="white" />
            </svg>

            {/* Grey square dot grid — runs over the blue AND the white arch. */}
            <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
            {/* Grain — the same tile (and soft-light treatment) as the dashboard sidebar. */}
            <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
        </div>
    );
}
