import Image from "next/image";
import ShareButtons from "./ShareButtons";

const A = "/assets/marketing";

/* Upload button — frosted circle pinned to the top-right corner of a shareable */
function UploadButton() {
    return (
        <button
            type="button"
            aria-label="Download shareable"
            className="absolute right-[16px] top-[16px] backdrop-blur-[10px] bg-[rgba(255,255,255,0.5)] overflow-hidden rounded-full size-[56px]"
            style={{ boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.4)" }}
        >
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[24px]">
                <Image src={`${A}/icons/upload.svg`} alt="" width={24} height={24} className="block max-w-none size-full" />
            </span>
        </button>
    );
}

/* ── "Spread the Word" — video, shareable graphics, QR code & FundBuddy hints ──
   Mobile: heading centered, cards stacked · Tablet: 9:16 + 1:1 row then full-width
   QR · Desktop: all three cards in one row                                       */
export default function Shareables() {
    return (
        <div className="flex flex-col gap-[40px] items-center justify-center pb-[40px] md:pb-[75px] pt-[40px] md:pt-[80px] xl:pt-[112px] px-[16px] md:px-[24px] xl:px-0">
            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center md:flex-row md:justify-center px-[8px]">
                <h2 className="md:flex-1 font-black text-[32px] xl:text-[46px] text-[#003060] tracking-[-1.5px] leading-none text-center md:text-left">
                    Spread the Word
                </h2>
                <div className="flex items-start justify-end p-[4px] shrink-0">
                    <ShareButtons variant="orange" />
                </div>
            </div>

            <div className="w-full max-w-[1152px] flex flex-col gap-[24px] items-center justify-center">
                {/* 16:9 video */}
                <div className="bg-[#e8eaee] h-[550px] overflow-hidden relative rounded-[24px] w-full">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[254px] h-[254px]">
                        <Image src={`${A}/shareables/play-button.svg`} alt="Play video" width={254} height={254} className="block max-w-none size-full" />
                    </span>
                    <UploadButton />
                </div>

                {/* Shareable graphics */}
                <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap gap-[24px] items-center w-full">
                    <div className="bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:w-[320px] md:shrink-0">
                        <Image src={`${A}/shareables/photo-a.png`} alt="Shareable graphic" width={698} height={464} className="absolute inset-0 w-full h-full object-cover" />
                        <UploadButton />
                    </div>
                    <div className="bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full md:flex-1 md:min-w-0">
                        <Image src={`${A}/shareables/photo-b.png`} alt="Shareable graphic" width={822} height={548} className="absolute inset-0 w-full h-full object-cover" />
                        <UploadButton />
                    </div>
                    <div className="bg-[#e8eaee] h-[400px] overflow-hidden relative rounded-[24px] w-full xl:w-[320px] xl:flex-none xl:shrink-0">
                        <Image src={`${A}/shareables/photo-c.png`} alt="" width={695} height={464} className="absolute inset-0 w-full h-full object-cover" />
                        <div aria-hidden className="absolute inset-0 bg-[rgba(255,255,255,0.34)]" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[264px] h-[264px] flex items-center justify-center">
                            <Image src={`${A}/shareables/qr-code.svg`} alt="Campaign QR code" width={264} height={264} className="block max-w-none size-full" />
                        </span>
                        <UploadButton />
                    </div>
                </div>
            </div>

            {/* FundBuddy hover context V1 — speech bubble */}
            <div className="w-full max-w-[1152px] flex items-center justify-center">
                {/* Large illustration (tablet/desktop) */}
                <div className="hidden md:block h-[189px] w-[143px] relative shrink-0 overflow-hidden">
                    <span className="absolute inset-[7.81%_3.93%_4.69%_4.13%]">
                        <Image src={`${A}/shareables/fundbuddy-large.svg`} alt="" width={132} height={166} className="absolute inset-0 block max-w-none size-full" />
                    </span>
                </div>
                {/* Small illustration (mobile) */}
                <Image src={`${A}/shareables/fundbuddy-small.svg`} alt="" width={63} height={80} className="md:hidden h-[80px] w-[63px] shrink-0 self-center" />
                <div className="relative flex-1 min-w-0">
                    <div
                        className="ml-[16px] md:ml-[49px] flex flex-col gap-[24px] items-end px-[24px] md:px-[32px] py-[24px] rounded-[15px] xl:max-w-[952px]"
                        style={{
                            background: "linear-gradient(0deg, #0278de 0%, #005bac 100%)",
                            boxShadow: "0px 32px 40px 0px rgba(20,65,109,0.26), 0px 12px 12px 0px rgba(0,91,172,0.25)",
                        }}
                    >
                        <p className="font-normal text-[18px] md:text-[22px] text-white w-full" style={{ lineHeight: 1.25 }}>
                            Hover on any of the shareables above to get context about what they&rsquo;re for!
                        </p>
                        <button
                            type="button"
                            className="bg-white flex items-center justify-center overflow-hidden pb-[13px] pt-[12px] px-[14px] rounded-[12px]"
                            style={{ boxShadow: "0px 12px 40px -8px rgba(255,255,255,0.74)" }}
                        >
                            <span className="font-bold text-[14px] text-[#0268c0] leading-none whitespace-nowrap">Got it!</span>
                        </button>
                    </div>
                    {/* Speech-bubble arrow */}
                    <span className="absolute left-[-18px] md:left-0 top-[26px] md:top-[46px] w-[51px] h-[56px] flex items-center justify-center">
                        <Image src={`${A}/shareables/bubble-arrow.svg`} alt="" width={56} height={51} className="-rotate-90 w-[56px] h-[51px] max-w-none" />
                    </span>
                </div>
            </div>

            {/* FundBuddy hover context V2 — inline bar */}
            <div className="w-full max-w-[1152px] flex flex-col items-center justify-center">
                <div className="w-full flex gap-[16px] items-center overflow-hidden rounded-[16px]">
                    <Image src={`${A}/shareables/fundbuddy-small.svg`} alt="" width={63} height={80} className="h-[80px] w-[63px] shrink-0" />
                    <div className="bg-white border-2 border-[#dde0e3] flex flex-1 items-center min-w-0 pl-[16px] pr-[24px] py-[18px] rounded-[16px]">
                        <p className="flex-1 font-normal text-[18px] text-[#003060] min-w-0" style={{ lineHeight: 1.4 }}>
                            Hover on any of the shareables above to get context about what they&rsquo;re for!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
