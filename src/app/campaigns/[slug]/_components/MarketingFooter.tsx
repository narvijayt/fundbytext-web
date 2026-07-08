import Image from "next/image";
import CurrentYear from "@/components/CurrentYear";
import Link from "next/link";

const A = "/assets/marketing";
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
                        <div className="flex gap-[8px] items-center shrink-0 w-full md:w-[235px] xl:w-[300px]">
                            <Image src={`${A}/footer/social-1.svg`} alt="Telegram" width={40} height={40} className="size-[40px]" />
                            <Image src={`${A}/footer/social-2.svg`} alt="WhatsApp" width={40} height={40} className="size-[40px]" />
                        </div>
                        <p className="font-medium text-[14px] text-[#7e8a96] whitespace-nowrap" style={{ lineHeight: 1.25 }}>1901 Thornridge Cir. Shiloh,<br />Hawaii 81063</p>
                    </div>
                </div>

                {/* CTA card (themed to accent) */}
                <div className="flex flex-col gap-[32px] items-center justify-center overflow-hidden p-[24px] md:p-[40px] relative rounded-[24px] w-full xl:w-auto xl:shrink-0" style={{ background: accent }}>
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
