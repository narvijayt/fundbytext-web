import Image from "next/image";
import MarketingNav from "./MarketingNav";
import ShareButtons from "./ShareButtons";

const A = "/assets/marketing";

/* ── Hero — campaign logo, title, share buttons & photo grid over the blue band ──
   Mobile: everything centered & stacked · Tablet: logo+title row, share centered,
   photos stacked · Desktop: full three-column header + side-by-side photo grid   */
export default function HeroSection() {
    return (
        <div className="relative">
            {/* Blue band with FBT pattern + color-dodge ellipse (exported from Figma) */}
            <div className="absolute inset-x-0 top-0 h-[498px] md:h-[635px] overflow-hidden">
                <Image
                    src={`${A}/hero/bg-section.png`}
                    alt=""
                    width={1920}
                    height={635}
                    priority
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative max-w-[1152px] mx-auto px-[16px] md:px-[24px] xl:px-0">
                <MarketingNav />

                {/* Row 1 — logo, campaign name, share + photo grid */}
                <div className="flex flex-col gap-[32px] pt-[42px] md:pt-[72px] xl:pt-[92px]">
                    <div className="relative flex flex-col md:gap-[32px] w-full">
                        {/* Header row: logo + title + edit */}
                        <div className="flex flex-col items-center md:flex-row md:items-stretch md:gap-[24px] w-full xl:pr-[294px]">
                            {/* Organization logo */}
                            <div className="bg-white overflow-hidden relative rounded-[16px] shrink-0 size-[104px]">
                                <Image
                                    src={`${A}/hero/org-logo.svg`}
                                    alt="Organization logo"
                                    width={76}
                                    height={63}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[76.12px] h-[63.23px]"
                                />
                            </div>
                            {/* Campaign name + edit */}
                            <div className="flex flex-col items-center md:flex-1 md:flex-row md:items-center md:justify-between min-w-0">
                                <div className="h-[104px] flex items-center md:h-auto">
                                    <h1
                                        className="font-black text-[32px] xl:text-[40px] text-white tracking-[-1px] text-center md:text-left w-full md:max-w-[500px]"
                                        style={{ lineHeight: 1.1, textShadow: "0px 32px 40px rgba(2,104,192,0.16), 0px 12px 12px rgba(0,48,96,0.04)" }}
                                    >
                                        New Helmets for the Bears Football Team
                                    </h1>
                                </div>
                                <button
                                    type="button"
                                    className="bg-[#f47435] flex gap-[12px] items-center px-[12px] py-[6px] rounded-[6px] shrink-0 md:self-end xl:self-center"
                                >
                                    <Image src={`${A}/icons/edit.svg`} alt="" width={20} height={20} className="size-[20px]" />
                                    <span className="font-medium text-[14px] text-white leading-none">EDIT</span>
                                </button>
                            </div>
                        </div>
                        {/* Share block — centered below on mobile/tablet, right column on desktop */}
                        <div className="flex flex-col gap-[16px] items-center justify-center p-[4px] mt-[12px] md:mt-0 xl:absolute xl:right-0 xl:top-0 xl:mt-0 xl:h-[104px] xl:w-[270px] xl:items-end">
                            <p className="font-black text-[12px] text-white text-center tracking-[1px] uppercase leading-none whitespace-nowrap">
                                Help us spread the word!
                            </p>
                            <ShareButtons variant="dark" />
                        </div>
                    </div>

                    {/* Photo grid */}
                    <div className="flex flex-col xl:flex-row gap-[24px] items-start w-full xl:h-[464px]">
                        <div className="bg-[#e7e9eb] h-[282px] md:h-[330px] xl:h-full overflow-hidden relative rounded-[16px] shrink-0 w-full xl:w-[662px]">
                            <Image src={`${A}/hero/photo-1.png`} alt="Campaign photo" width={774} height={516} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-1 flex-col gap-[24px] w-full xl:h-full items-start justify-center min-w-0">
                            <div className="flex xl:flex-1 gap-[24px] items-start min-h-0 w-full">
                                <div className="bg-[#e7e9eb] flex-1 h-[129px] md:h-[153px] xl:h-full min-w-0 overflow-hidden relative rounded-[16px]">
                                    <Image src={`${A}/hero/photo-2.png`} alt="Campaign photo" width={354} height={235} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#e7e9eb] flex-1 h-[129px] md:h-[153px] xl:h-full min-w-0 overflow-hidden relative rounded-[16px]">
                                    <Image src={`${A}/hero/photo-3.png`} alt="Campaign photo" width={391} height={261} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="flex xl:flex-1 gap-[24px] items-start min-h-0 w-full">
                                <div className="bg-[#e7e9eb] flex-1 h-[129px] md:h-[153px] xl:h-full min-w-0 overflow-hidden relative rounded-[16px]">
                                    <Image src={`${A}/hero/photo-4.png`} alt="Campaign photo" width={350} height={233} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#e7e9eb] flex-1 h-[129px] md:h-[153px] xl:h-full min-w-0 overflow-hidden relative rounded-[16px]">
                                    <Image src={`${A}/hero/photo-5.png`} alt="Campaign photo" width={335} height={223} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
