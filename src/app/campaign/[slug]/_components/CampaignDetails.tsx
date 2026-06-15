import Image from "next/image";

const A = "/assets/marketing";

const DONORS: { name: string; when: string; amount: string; avatar: "green" | "gray" | "orange" }[] = [
    { name: "Stephanie S.", when: "5m ago", amount: "$500", avatar: "green" },
    { name: "Michael M.", when: "47m ago", amount: "$50", avatar: "gray" },
    { name: "Hannah L.", when: "1h ago", amount: "$250", avatar: "orange" },
    { name: "Nick P.", when: "2d ago", amount: "$75", avatar: "gray" },
    { name: "Johnny P.", when: "3w ago", amount: "$250", avatar: "orange" },
    { name: "Samuel S.", when: "1mo ago", amount: "$500", avatar: "green" },
    { name: "Nick P.", when: "2d ago", amount: "$75", avatar: "gray" },
];

/* ── Row 2 — progress bar, donate button, description, organizer + live donation feed ──
   Mobile/tablet: stacked, feed full-width · Desktop: details left, 368px feed right     */
export default function CampaignDetails() {
    return (
        <div className="max-w-[1152px] mx-auto px-[16px] md:px-[24px] xl:px-0 mt-[48px] flex flex-col md:gap-[40px] xl:flex-row xl:gap-[122px] items-start">
            {/* ── Left column: campaign details ─────────────────────── */}
            <div className="flex w-full xl:flex-1 flex-col items-start min-w-0">
                {/* Progress bar + donate button */}
                <div className="flex flex-col gap-[24px] items-start pb-[48px] pt-[12px] px-[8px] w-full">
                    <div className="flex flex-col gap-[12px] items-start w-full">
                        <div className="flex items-end px-[4px] w-full">
                            <p className="flex-1 min-w-0 text-[24px] text-[#003060]" style={{ lineHeight: 1.15 }}>
                                <span className="font-black tracking-[-0.5px]">$4,500 </span>
                                <span className="font-normal">raised</span>
                            </p>
                            <p className="font-medium text-[18px] text-[#aeb5bd] whitespace-nowrap" style={{ lineHeight: 1.4 }}>
                                $5,000 goal
                            </p>
                        </div>
                        {/* Goal progress bar */}
                        <div className="h-[32px] relative rounded-full w-full bg-[#f2f2f2]">
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-[32px] w-[125px]">
                                <Image src={`${A}/hero/progress-track-texture.svg`} alt="" width={125} height={32} className="absolute inset-0 block max-w-none size-full" />
                            </span>
                            <span className="absolute left-0 top-[-4px] h-[40px] w-[79.4%]">
                                <Image src={`${A}/hero/progress-raised.svg`} alt="" width={513} height={40} className="block max-w-none size-full" />
                            </span>
                            <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
                        </div>
                        {/* Date + donations info */}
                        <div className="flex gap-[6px] items-center justify-center px-[4px] w-full">
                            <span className="h-[40px] w-[25px] relative shrink-0 overflow-hidden">
                                <Image
                                    src={`${A}/icons/flag.svg`}
                                    alt=""
                                    width={19}
                                    height={36}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[19px] h-[36px] -rotate-10"
                                />
                            </span>
                            <span className="flex flex-1 flex-col gap-[4px] items-start justify-center min-w-0">
                                <span className="font-medium text-[16px] text-[#7e8a96] w-full" style={{ lineHeight: 1.4 }}>March 5, 2025</span>
                                <span className="font-black text-[12px] text-[#f47435] tracking-[1px] uppercase w-full leading-none">3 days left!</span>
                            </span>
                            <span className="font-medium text-[16px] text-[#aeb5bd] text-right w-[91px]" style={{ lineHeight: 1.4 }}>
                                16 donations
                            </span>
                        </div>
                    </div>
                    {/* Donate Now */}
                    <button
                        type="button"
                        className="bg-[#f47435] flex h-[56px] gap-[10px] items-center justify-center overflow-hidden px-[18px] py-[16px] rounded-[16px] w-full"
                        style={{ boxShadow: "0px 20px 20px -14px rgba(234,103,37,0.2), 0px 20px 40px -16px rgba(244,116,53,0.2)" }}
                    >
                        <Image src={`${A}/icons/heart.svg`} alt="" width={24} height={24} className="size-[24px] -mt-[3px] -ml-[3px]" />
                        <span className="font-black text-[14px] text-white tracking-[1px] uppercase leading-none whitespace-nowrap">donate now</span>
                    </button>
                </div>

                {/* Description */}
                <div className="border-y border-[#e7e9eb] flex flex-col gap-[24px] items-start px-[8px] py-[48px] w-full">
                    <p className="font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none">description</p>
                    <div className="font-normal text-[18px] text-[#2f3a45] w-full" style={{ lineHeight: 1.4 }}>
                        <p className="mb-[12px]">
                            Help our soccer team get new uniforms and travel costs. This is for the upcoming regional tournament.
                            Every little bit counts! Lorem ipsum dolor sit amet, consecte tetur adipiscing elitsed do eiusmod tempor
                            incididunt ut.
                        </p>
                        <p>Lorem ipsum dolor sit amet, consec tetur adipiscing elitsed do eiusmod ...</p>
                    </div>
                    <button type="button" className="border-b border-[#0268c0] flex gap-[8px] items-center justify-center py-[2px]">
                        <span className="font-bold text-[16px] text-[#0268c0] tracking-[0.15px] leading-none whitespace-nowrap">Read more</span>
                    </button>
                </div>

                {/* Organizer */}
                <div className="flex gap-[12px] items-center px-[8px] py-[24px] w-full">
                    <div className="bg-[#e8eaee] overflow-hidden relative rounded-full shrink-0 size-[56px]">
                        <Image src={`${A}/avatars/organizer.jpg`} alt="Organizer" width={131} height={164} className="absolute left-1/2 top-[-10.7px] -translate-x-1/2 w-[131px] h-[163.7px] max-w-none object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col gap-[8px] items-start justify-center min-w-0">
                        <p className="md:whitespace-nowrap">
                            <span className="font-bold text-[18px] text-[#003060]" style={{ lineHeight: 1.15 }}>Stephanie Smith</span>
                            <span className="font-medium text-[18px] text-[#aeb5bd]" style={{ lineHeight: 1.4 }}> is organizing this campaign.</span>
                        </p>
                        <span className="bg-[#e2f1ff] flex items-center justify-center overflow-hidden px-[10px] py-[8px] rounded-[8px]">
                            <span className="font-black text-[12px] text-[#0268c0] tracking-[1px] uppercase leading-none whitespace-nowrap">ABC University</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Right column: live donation feed ──────────────────── */}
            <div
                className="bg-white flex flex-col gap-[24px] h-[516px] items-center justify-center overflow-hidden px-[32px] py-[28px] relative rounded-[24px] shrink-0 w-full xl:w-[368px]"
                style={{ boxShadow: "0px 12px 16px -8px rgba(0,48,96,0.08), 0px 28px 32px -8px rgba(2,104,192,0.16)" }}
            >
                {DONORS.map((d, i) => {
                    const size = d.avatar === "green" ? 42 : 40;
                    return (
                        <div key={`${d.name}-${i}`} className="flex gap-[12px] items-center pr-[8px] w-full">
                            <Image
                                src={`${A}/avatars/donor-${d.avatar}.png`}
                                alt=""
                                width={size}
                                height={size}
                                className="rounded-full shrink-0"
                                style={{ width: size, height: size }}
                            />
                            <div className="flex flex-1 flex-col items-start justify-center min-w-0">
                                <p className="font-bold text-[16px] text-[#003060] pt-[4px] w-full" style={{ lineHeight: 1.25 }}>{d.name}</p>
                                <p className="font-medium text-[14px] text-[#7e8a96] pt-[4px] w-full leading-none">{d.when}</p>
                            </div>
                            <p className="font-medium text-[16px] text-[#003060] pt-[4px] whitespace-nowrap" style={{ lineHeight: 1.4 }}>{d.amount}</p>
                        </div>
                    );
                })}
                {/* Fade overlays */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-[120px] pointer-events-none" style={{ background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)" }} />
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-[120px] pointer-events-none" style={{ background: "linear-gradient(0deg, #fff 0%, rgba(255,255,255,0) 100%)" }} />
            </div>
        </div>
    );
}
