import Image from "next/image";
import CurrentYear from "@/components/CurrentYear";
import Link from "next/link";
import FooterShareLinks from "./FooterShareLinks";

const A = "/assets/marketing";

// The FundByText "F" glyph (from logo-icon.svg) — the same mark that drifts
// behind the campaign-creation steps. Tiled + rotated into a faint white
// watermark for the CTA card, drifting via the shared `driftLeft` keyframe.
const F_GLYPH = "M9.21961 0C4.12776 0 0 4.189 0 9.35639V21.9925H6.80123V13.1382C6.80123 11.9286 7.76713 10.9483 8.95907 10.9483H23.0981V14.5017H10.8428V18.7607H21.7073V22.0008H10.8691L3.75375 39H15.5243L27.3901 21.9934V0H9.21961Z";
const F_WATERMARK = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'>` +
    `<g fill='rgba(255,255,255,0.1)'>` +
    `<g transform='translate(14,16) rotate(-12) scale(1.25)'><path d='${F_GLYPH}'/></g>` +
    `<g transform='translate(96,86) rotate(14) scale(0.95)'><path d='${F_GLYPH}'/></g>` +
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
                    {/* Drifting "F" app-logo watermark — the same mark that animates behind the creation steps. */}
                    <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: F_WATERMARK, backgroundRepeat: "repeat", backgroundSize: "170px 170px", animation: "driftLeft 18s linear infinite" }} />
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
