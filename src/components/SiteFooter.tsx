import Link from "next/link";
import CurrentYear from "@/components/CurrentYear";
import FundByTextLogo from "@/components/FundByTextLogo";

const PAY = "/assets/marketing/footer";

// Faint, tiled FundByText "F" watermark for the blue CTA card (coded SVG).
const F_GLYPH = "M9.21961 0C4.12776 0 0 4.189 0 9.35639V21.9925H6.80123V13.1382C6.80123 11.9286 7.76713 10.9483 8.95907 10.9483H23.0981V14.5017H10.8428V18.7607H21.7073V22.0008H10.8691L3.75375 39H15.5243L27.3901 21.9934V0H9.21961Z";
function fWatermarkUri(alpha: number) {
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'>` +
        `<g fill='rgba(255,255,255,${alpha})'>` +
        `<g transform='translate(14,16) rotate(-12) scale(1.25)'><path d='${F_GLYPH}'/></g>` +
        `<g transform='translate(96,86) rotate(14) scale(0.95)'><path d='${F_GLYPH}'/></g>` +
        `</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const NAV_LINKS = [
    { label: "Browse Campaigns", href: "#" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "FAQs", href: "#" },
    { label: "Resources", href: "#" },
    { label: "About Us", href: "/about" },
    { label: "Help & Support", href: "/contact" },
];

/* ── Shared marketing footer (white info card + blue CTA card on midnight blue). ── */
export default function SiteFooter() {
    return (
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
                                {NAV_LINKS.map((l) => (
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
                    <Link href="/cookies" className="text-white/50 text-xs hover:text-white transition-colors">Cookies.</Link>
                </div>
            </div>
        </footer>
    );
}
