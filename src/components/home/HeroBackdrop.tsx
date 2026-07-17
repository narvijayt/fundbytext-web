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

export default function HeroBackdrop({ archHeight = "34.5%", archDrop = 79 }: {
    // How tall the white bottom arch is, as a share of the hero. The default suits
    // the tall About / How-It-Works hero, where a video card straddles the arch and
    // fills the white. On a short hero with no video (e.g. /resources) that same
    // 34.5% leaves a big empty white band, so those pages pass a smaller value.
    archHeight?: string;
    // How far (in the 0–320 viewBox) the blue sweeps DOWN at the left/right edges
    // relative to the centre — the amplitude of the wave. 79 is the gentle default;
    // a larger value gives a more pronounced curve with deeper blue "wings" at the
    // edges, which is what the short heroes want so the arch reads as a wave rather
    // than a near-flat line.
    archDrop?: number;
}) {
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
            {/* White halo — the home page's, and the only one. It used to be a
                breakpoint pair, on the theory that the mobile frame wants a wash lit
                all the way to the edges. That mobile layer held white at 0.82 out to
                half the width and bottomed out at 0.12, so nothing around it stayed
                blue and the nav lost its backdrop: the Menu pill is white, and on a
                near-white field it read as transparent. Home's single ramp reaches
                `transparent` by 90%, so the blue survives around the glow — and
                matching it is what keeps these pages looking like the home hero.

                The VERTICAL geometry is stated in px rather than the % home uses,
                because % resolves against the hero box and these heroes vary widely:
                ~420px on mobile against home's ~1040, so the same percentages squash
                the halo and drag its hot centre up onto the nav (26% of the radius vs
                home's 34%). Home's % work out to ~250px centre / ~600px radius at
                both its breakpoints, so saying that outright reproduces its spread at
                any hero height. Horizontal stays a share of the width — every hero is
                full-bleed, so that one already matches. */}
            <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse 86% 600px at 50% 250px,rgba(255,255,255,1) 0%,rgba(255,255,255,0.95) 26%,rgba(198,231,255,0.5) 48%,rgba(37,144,242,0.10) 72%,transparent 90%)",
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={A_HERO_BLUR}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: 1600, height: 1546, top: -430, opacity: 0.9 }} />

            {/* White arch. In the Figma it peaks at ~65.5% of the hero in the
                centre and drops to ~74% at the edges — so it passes through the
                video card about a third of the way down, and is only visible to
                the card's left and right. The card (z-10) straddles it. */}
            <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1920 320"
                preserveAspectRatio="none" style={{ height: archHeight }} aria-hidden="true">
                {/* Edges sit `archDrop` below the top; the control point mirrors it above
                    so the centre peaks at y=0. Larger archDrop ⇒ deeper wave. */}
                <path d={`M0,${archDrop} Q960,${-archDrop} 1920,${archDrop} L1920,320 L0,320 Z`} fill="white" />
            </svg>

            {/* Grey square dot grid — runs over the blue AND the white arch. */}
            <div className="absolute inset-0" style={{ backgroundImage: DOT_TEXTURE, backgroundRepeat: "repeat" }} />
            {/* Grain — the same tile (and soft-light treatment) as the dashboard sidebar. */}
            <div className="absolute inset-0 opacity-50 mix-blend-soft-light"
                style={{ backgroundImage: "url(/assets/dashboard/sidebar-noise.png)", backgroundRepeat: "repeat" }} />
        </div>
    );
}
