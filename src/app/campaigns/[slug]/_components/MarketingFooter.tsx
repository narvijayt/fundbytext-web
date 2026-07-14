import Image from "next/image";
import CurrentYear from "@/components/CurrentYear";
import Link from "next/link";
import FooterShareLinks from "./FooterShareLinks";

const A = "/assets/marketing";

// The exact drifting "F" texture from the campaign-creation steps (ui.tsx's
// VectorWallpaper) — same two glyphs, same upright angles, same 170px tile —
// recoloured white so it reads as a faint watermark over the accent CTA card,
// drifting via the shared `driftLeft` keyframe.
const F_PATH_A = "m23.28 76.64l18.97-6.62 9.55-34.07-12.37-35.43-29.27 10.22c-8.19 2.86-12.49 11.93-9.58 20.25l7.1 20.36 10.96-3.83-4.98-14.26c-0.67-1.95 0.33-4.08 2.25-4.75l22.79-7.96 2 5.73-19.75 6.89 2.4 6.86 17.5-6.11 1.82 5.23-17.46 6.09-1.9 31.39z";
const F_PATH_B = "M27.9717 0L9.09569 6.86879L0 41.0623L12.8348 76.3241L41.9651 65.7237C50.1204 62.752 54.2958 53.6262 51.279 45.3431L43.9061 25.0827L32.9973 29.0551L38.1658 43.2516C38.8655 45.1926 37.895 47.3292 35.9765 48.0289L13.3012 56.282L11.2248 50.5868L30.8757 43.4321L28.3855 36.601L10.969 42.9431L9.08063 37.7445L26.4595 31.4174L27.9491 0.00752493L27.9717 0Z";
const F_WATERMARK = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='170' height='170'>` +
    `<g fill='rgba(255,255,255,0.16)'>` +
    `<g transform='translate(16,12)'><path d='${F_PATH_A}'/></g>` +
    `<g transform='translate(96,90)'><path d='${F_PATH_B}'/></g>` +
    `</g></svg>`,
)}")`;

const NAV_LINKS = [
    { label: "Browse Campaigns", href: "#" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "FAQs", href: "#" },
    { label: "Resources", href: "#" },
    { label: "About Us", href: "/about" },
    { label: "Help & Support", href: "/contact" },
];

/* ── Footer — white info card + accent CTA card on midnight blue. ── */
export default function MarketingFooter({ accent }: { accent: string }) {
    return (
        <div className="bg-[#003060] flex flex-col gap-[40px] md:gap-[64px] items-center pb-[40px] pt-[40px] md:pt-[80px] xl:pt-[112px] px-[16px] md:px-[24px] xl:px-0">
            <div className="flex flex-col xl:flex-row gap-[24px] items-stretch justify-center w-full max-w-[720px] xl:max-w-none xl:w-auto">
                {/* White info card */}
                <div className="bg-white flex flex-col gap-[40px] md:gap-[64px] items-start overflow-hidden p-[24px] md:p-[40px] rounded-[24px] w-full xl:w-[800px] xl:shrink-0">
                    <div className="flex flex-col md:flex-row gap-[40px] md:gap-[16px] items-start w-full">
                        <div className="flex flex-col items-start pr-[5px] shrink-0 w-full md:w-[235px] xl:w-[300px]">
                            <Image src={`${A}/footer/logo.svg`} alt="FundbyText" width={180} height={67} className="w-[180px] h-[67.3px]" />
                        </div>
                        <div className="flex w-full md:flex-1 flex-col gap-[24px] items-start min-w-0">
                            <p className="font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none w-full">navigate</p>
                            <div className="flex flex-col gap-[12px] items-start w-full font-normal text-[16px] text-[#003060]" style={{ lineHeight: 1.4 }}>
                                {NAV_LINKS.map((link) => <Link key={link.label} href={link.href} className="w-full hover:underline">{link.label}</Link>)}
                            </div>
                        </div>
                        <div className="flex w-full md:flex-1 flex-col gap-[24px] items-start min-w-0">
                            <p className="font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none w-full">Payment methods</p>
                            <div className="flex flex-col gap-[12px] items-start w-full">
                                <div className="flex gap-[16px] items-start">
                                    <Image src={`${A}/footer/visa.svg`} alt="Visa" width={32} height={32} className="size-[32px]" />
                                    <Image src={`${A}/footer/mastercard.svg`} alt="Mastercard" width={32} height={32} className="size-[32px]" />
                                    <span className="relative overflow-hidden size-[32px] shrink-0">
                                        <Image src={`${A}/footer/paypal.svg`} alt="PayPal" width={22} height={26} className="absolute inset-[9.38%_15.63%] block max-w-none w-[68.74%] h-[81.24%]" />
                                    </span>
                                </div>
                                <div className="flex gap-[16px] items-start">
                                    <Image src={`${A}/footer/jcb.svg`} alt="JCB" width={32} height={32} className="size-[32px]" />
                                    <Image src={`${A}/footer/swift.svg`} alt="Swift" width={32} height={32} className="size-[32px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-[16px] md:items-center w-full">
                        <FooterShareLinks />
                        <p className="font-medium text-[14px] text-[#7e8a96] whitespace-nowrap" style={{ lineHeight: 1.25 }}>1901 Thornridge Cir. Shiloh,<br />Hawaii 81063</p>
                    </div>
                </div>

                {/* CTA card (themed to accent) */}
                <div className="flex flex-col gap-[32px] items-center justify-center overflow-hidden p-[24px] md:p-[40px] relative rounded-[24px] w-full xl:w-auto xl:shrink-0" style={{ background: accent }}>
                    {/* Drifting "F" app-logo watermark — the same mark that animates behind the
                        creation steps. Transform drift (GPU-composited) so it keeps running in
                        production on mobile; the layer is one tile wider and the card clips it. */}
                    <div aria-hidden className="footer-drift [--fd:-170px] pointer-events-none absolute top-0 left-0 h-full w-[calc(100%+170px)]" style={{ backgroundImage: F_WATERMARK, backgroundRepeat: "repeat", backgroundSize: "170px 170px" }} />
                    <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)" }} />
                    <div className="relative flex flex-col gap-[16px] items-start w-full xl:w-[248px] xl:flex-1 xl:min-h-0">
                        <p className="font-black text-[32px] xl:text-[38px] 2xl:text-[46px] text-white tracking-[-1.5px] w-full" style={{ lineHeight: 1.1 }}>Ready to Fundraise?</p>
                        <p className="font-normal text-[16px] xl:text-[18px] text-white w-full" style={{ lineHeight: 1.4 }}>Start Your FundbyText Campaign Today.</p>
                    </div>
                    <div className="relative flex flex-col gap-[12px] items-start justify-center w-full xl:w-[248px]">
                        <Link href="/campaigns/create" className="bg-[#f47435] flex gap-[8px] items-center justify-center px-[24px] py-[20px] rounded-[12px] w-full transition-opacity hover:opacity-90" style={{ boxShadow: "0px 20px 20px 0px rgba(234,103,37,0.2), 0px 20px 40px 0px rgba(244,116,53,0.2)" }}>
                            <span className="font-black text-[12px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">Get Started for Free</span>
                        </Link>
                        <Link href="/how-it-works" className="border border-[rgba(255,255,255,0.2)] flex gap-[8px] items-center justify-center px-[24px] py-[20px] rounded-[12px] w-full transition-colors hover:bg-white/10">
                            <span className="font-black text-[12px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">See how it works</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-[4px] items-start md:flex-row md:items-center md:justify-between px-[8px] w-full max-w-[1152px] font-normal text-[14px] text-white leading-none">
                <p style={{ lineHeight: 1.25 }}>© FundbyText <CurrentYear /> — All Rights Reserved.</p>
                <p className="md:text-right" style={{ lineHeight: 1.25 }}><Link href="/privacy" className="hover:underline">Privacy.</Link> <Link href="/terms" className="hover:underline">Terms &amp; Conditions.</Link></p>
            </div>
        </div>
    );
}
