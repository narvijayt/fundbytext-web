import Link from "next/link";
import CurrentYear from "@/components/CurrentYear";
import FooterSocialShare from "@/components/FooterSocialShare";

/* ── Shared marketing footer ────────────────────────────────────────────────
   Figma 5814:11914 / About 5724:16709 — bg #003060, an 800px white card and a
   328px blue CTA card (24px gap) over a 1152px container, plus the bottom bar.
   Extracted from the home page so every marketing page (home, about, …) shows
   the identical footer instead of drifting copies.
   Note: this is NOT the same as SiteFooter, which the auth/legal/contact pages
   use — that one is a narrower, older variant. */

const F = "/figma";
const A_FOOTER_LOGO = `${F}/footer-logo.svg`;

// The same drifting "F" texture the public campaign footer uses (ported from
// campaigns/[slug]/_components/MarketingFooter, itself the creation steps'
// VectorWallpaper): the two vector glyphs, upright, on a 170px tile. This page
// previously used a 328x412 PNG export, so the mark, its spacing and its angle
// all read differently from the campaign page — these are now identical.
/* Pre-encoded, and the path data is inline — both deliberate, and the same
   construction the wizard's VectorWallpaper has always used.

   This used to build raw SVG (`<g ...><path d='${F_PATH_A}'/></g>`) and run it
   through encodeURIComponent() at runtime. The production minifier mangled that
   literal: it dropped the `'/></g>` after the FIRST path, so the emitted SVG was
   invalid (2 <path>, 1 />), the background image never loaded, and the drift had
   nothing to show. Dev doesn't minify, so it only ever broke once deployed —
   which is why the identical wizard wallpaper kept working in production.

   Encoding the angle brackets here leaves the minifier nothing to mangle. */
const F_WATERMARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cg fill='rgba(255,255,255,0.16)'%3E%3Cg transform='translate(16,12)'%3E%3Cpath d='m23.28 76.64l18.97-6.62 9.55-34.07-12.37-35.43-29.27 10.22c-8.19 2.86-12.49 11.93-9.58 20.25l7.1 20.36 10.96-3.83-4.98-14.26c-0.67-1.95 0.33-4.08 2.25-4.75l22.79-7.96 2 5.73-19.75 6.89 2.4 6.86 17.5-6.11 1.82 5.23-17.46 6.09-1.9 31.39z'/%3E%3C/g%3E%3Cg transform='translate(96,90)'%3E%3Cpath d='M27.9717 0L9.09569 6.86879L0 41.0623L12.8348 76.3241L41.9651 65.7237C50.1204 62.752 54.2958 53.6262 51.279 45.3431L43.9061 25.0827L32.9973 29.0551L38.1658 43.2516C38.8655 45.1926 37.895 47.3292 35.9765 48.0289L13.3012 56.282L11.2248 50.5868L30.8757 43.4321L28.3855 36.601L10.969 42.9431L9.08063 37.7445L26.4595 31.4174L27.9491 0.00752493L27.9717 0Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
const A_PAY_VISA    = `${F}/pay-visa.svg`;
const A_PAY_MC      = `${F}/pay-mastercard.svg`;
const A_PAY_PAYPAL  = `${F}/pay-paypal.svg`;
const A_PAY_JCB     = `${F}/pay-jcb.svg`;
const A_PAY_SWIFT   = `${F}/pay-swift.svg`;

const NAV_LINKS = [
    { label: "Browse Campaigns", href: "/campaigns" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "FAQs", href: "/faq" },
    { label: "Resources", href: "/resources" },
    { label: "About Us", href: "/about" },
    { label: "Help & Support", href: "/contact" },
];

export default function MarketingFooter() {
    return (
        <footer style={{ background: "#003060" }} className="px-4 sm:px-6 pt-14 lg:pt-28 pb-8 lg:pb-10">
            {/* col-reverse on mobile: the desktop frames run white-card → CTA left to
                right, but both the /about and /how-it-works mobile frames put the
                "Ready to Inspire?" CTA ABOVE the white card, so the source order (which
                desktop needs) has to be flipped rather than followed. */}
            <div className="max-w-[1152px] mx-auto flex flex-col-reverse lg:flex-row lg:items-stretch justify-center gap-6">

                {/* Column 1 — white card (800px) */}
                <div className="bg-white rounded-[24px] p-7 sm:p-10 flex flex-col gap-12 lg:gap-16 w-full lg:w-[800px] lg:flex-none">
                    {/* row 1: logo / navigate / payment methods */}
                    <div className="flex flex-col sm:flex-row gap-10 sm:gap-4 w-full">
                        <div className="sm:w-[300px] shrink-0">
                            <Link href="/" className="inline-block">
                                {/* Scales down below sm, where the row stacks and a 180px mark
                                    swallowed half a 360px screen. Same 180:67 ratio. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="FundbyText" src={A_FOOTER_LOGO}
                                    className="block w-[132px] h-[49px] sm:w-[180px] sm:h-[67px]" />
                            </Link>
                        </div>
                        <div className="flex-1 flex flex-col gap-6">
                            <p className="font-black text-[#aeb5bd] text-xs tracking-[1px] uppercase leading-none">navigate</p>
                            <ul className="flex flex-col gap-3">
                                {NAV_LINKS.map((l) => (
                                    <li key={l.label}>
                                        <Link href={l.href} className="font-normal text-[#003060] text-base leading-[1.4] hover:text-[#0268c0] transition-colors">{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex-1 flex flex-col gap-6">
                            <p className="font-black text-[#aeb5bd] text-xs tracking-[1px] uppercase leading-none">Payment methods</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Visa" src={A_PAY_VISA} className="size-8" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Mastercard" src={A_PAY_MC} className="size-8" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="PayPal" src={A_PAY_PAYPAL} className="size-8 object-contain" />
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="JCB" src={A_PAY_JCB} className="size-8" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Swift" src={A_PAY_SWIFT} className="size-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* row 2: social / address */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-4 w-full">
                        <FooterSocialShare />
                        <p className="font-medium text-[#8f98a3] text-sm leading-[1.25]">
                            1901 Thornridge Cir. Shiloh,<br />Hawaii 81063
                        </p>
                    </div>
                </div>

                {/* Column 2 — blue CTA card (328px, stretches to match) */}
                <div className="relative overflow-hidden rounded-[24px] p-8 sm:p-10 flex flex-col gap-8 w-full lg:w-[328px] lg:flex-none bg-[#0268c0]">
                    {/* F-pattern watermark (Figma export) drifting + fading linear overlay.
                        Transform drift (GPU-composited) so it keeps running on mobile; the
                        layer is one tile wider than the card and the card clips the overflow.
                        --fd and right are set INLINE, not via Tailwind arbitrary classes:
                        those got purged from the production CSS, so the drift ran locally but
                        froze on Vercel — the same fix VectorWallpaper already carries. */}
                    <div aria-hidden className="footer-drift pointer-events-none absolute inset-y-0 left-0"
                        style={{
                            "--fd": "-170px",
                            right: -170,
                            backgroundImage: F_WATERMARK,
                            backgroundRepeat: "repeat",
                            backgroundSize: "170px 170px",
                            backfaceVisibility: "hidden",
                        } as React.CSSProperties} />
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(to bottom,#0268c0 0%,rgba(2,104,192,0) 100%)" }} />
                    <div className="relative z-10 flex-1 flex flex-col gap-4">
                        {/* Below sm the card goes full-width and stacks above the white
                            card, where 28px/18px read oversized against the rest of the
                            mobile page. sm and up keep the existing sizes. */}
                        <h3 className="font-black text-[23px] sm:text-[32px] lg:text-[38px] xl:text-[44px] leading-[1.1] tracking-[-1px] bg-clip-text text-transparent w-full"
                            style={{ backgroundImage: "linear-gradient(to right,#ffffff,rgba(255,255,255,0.8))" }}>
                            Ready to Inspire?
                        </h3>
                        <p className="font-normal text-white/80 text-[15px] sm:text-lg leading-[1.4] w-full">Start Your FundbyText Campaign Today.</p>
                    </div>
                    <div className="relative z-10 flex flex-col gap-3 w-full">
                        <Link href="/campaigns/create"
                            className="flex items-center justify-center w-full px-6 py-5 rounded-[12px] bg-[#f47435] text-white font-black text-xs tracking-[1px] uppercase leading-none shadow-[0_20px_20px_0_rgba(234,103,37,0.2),0_20px_40px_0_rgba(244,116,53,0.2)] transition hover:brightness-105">
                            Get Started for Free
                        </Link>
                        <Link href="/how-it-works"
                            className="flex items-center justify-center w-full px-6 py-5 rounded-[12px] border border-white/20 text-white font-black text-xs tracking-[1px] uppercase leading-none hover:border-white/50 transition-colors">
                            See how it works
                        </Link>
                    </div>
                </div>
            </div>

            {/* bottom bar */}
            <div className="max-w-[1152px] mx-auto mt-10 lg:mt-16 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-white/60 text-sm">© FundbyText <CurrentYear /> — All Rights Reserved.</p>
                <div className="flex items-center gap-1.5">
                    <Link href="/privacy" className="text-white/60 text-sm hover:text-white transition-colors">Privacy.</Link>
                    <Link href="/terms" className="text-white/60 text-sm hover:text-white transition-colors">Terms &amp; Conditions.</Link>
                    <Link href="/cookies" className="text-white/60 text-sm hover:text-white transition-colors">Cookies.</Link>
                </div>
            </div>
        </footer>
    );
}
