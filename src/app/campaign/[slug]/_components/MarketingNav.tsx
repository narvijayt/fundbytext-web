import Image from "next/image";

const A = "/assets/marketing";

/* ── Top navigation bar — white rounded-bottom bar floating over the hero ──
   Mobile: small logo + hamburger · Tablet: full logo + hamburger · Desktop: + donate button */
export default function MarketingNav() {
    return (
        <div
            className="flex items-center justify-between overflow-hidden px-[16px] py-[16px] md:px-[24px] md:py-[20px] rounded-b-[20px] bg-[#f9f9fc]"
            style={{ boxShadow: "0px 4px 30px 0px rgba(0,91,172,0.08)" }}
        >
            <Image
                src={`${A}/nav/logo.svg`}
                alt="FundbyText"
                width={199}
                height={39}
                className="w-[153px] h-[30px] md:w-[198.9px] md:h-[39px] shrink-0"
            />
            <div className="flex flex-1 gap-[12px] items-center justify-end min-w-0">
                <button
                    type="button"
                    className="hidden xl:flex bg-[#f47435] gap-[8px] items-center justify-center pb-[18px] pt-[16px] px-[20px] rounded-[12px] shrink-0"
                >
                    <span className="font-black text-[12px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">
                        donate to this campaign
                    </span>
                </button>
                <button type="button" aria-label="Menu" className="relative overflow-hidden rounded-[4px] size-[30px] md:size-[48px] shrink-0">
                    {/* mobile bars */}
                    <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[8px] left-[calc(50%+5px)] -translate-x-1/2" />
                    <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[18px] top-[14px] left-1/2 -translate-x-1/2" />
                    <span className="md:hidden absolute bg-[#003060] h-[2px] rounded-[4px] w-[8px] top-[20px] left-[calc(50%-5px)] -translate-x-1/2" />
                    {/* tablet/desktop bars */}
                    <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[12.4px] left-[calc(50%+8px)] -translate-x-1/2" />
                    <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[28px] top-[22.4px] left-1/2 -translate-x-1/2" />
                    <span className="hidden md:block absolute bg-[#003060] h-[3.2px] rounded-[4px] w-[12px] top-[32.4px] left-[calc(50%-8px)] -translate-x-1/2" />
                </button>
            </div>
        </div>
    );
}
