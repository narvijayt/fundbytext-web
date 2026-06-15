import Image from "next/image";

const A = "/assets/marketing";

/* Diagonal white stripe overlay used on the green progress fills */
const STRIPES: React.CSSProperties = {
    backgroundImage:
        "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 3.5px, transparent 3.5px, transparent 21.6px)",
};

const TOP3: { first: string; last: string; raised: string; bar: number; medal: string; tint: string; avatar?: string; initials?: string; glow?: boolean }[] = [
    {
        first: "Jane", last: "Wells", raised: "$6,000", bar: 168.7,
        medal: "medal-gold", tint: "linear-gradient(225deg, #ffe5b2 16.667%, #ffffff 43.333%)",
        avatar: `${A}/avatars/stephanie.jpg`, glow: true,
    },
    {
        first: "Ethan", last: "Thompson", raised: "$5,500", bar: 215,
        medal: "medal-silver", tint: "linear-gradient(225deg, #d4dee7 16.667%, #ffffff 43.333%)",
        initials: "ET",
    },
    {
        first: "Noah", last: "Wilson", raised: "$5,000", bar: 172,
        medal: "medal-bronze", tint: "linear-gradient(225deg, #ebd4b1 16.667%, #ffffff 43.333%)",
        avatar: `${A}/avatars/noah.jpg`,
    },
];

const PARTICIPANTS: { rank: number; name: string; raised: string; bar: number; avatar: string; highlighted?: boolean }[] = [
    { rank: 4, name: "Stephanie Smith", raised: "$4,500", bar: 215, avatar: `${A}/avatars/stephanie.jpg`, highlighted: true },
    { rank: 5, name: "Michael Doe", raised: "$4,000", bar: 181, avatar: `${A}/avatars/michael.jpg` },
    { rank: 6, name: "Johnny Mayer", raised: "$3,500", bar: 151, avatar: `${A}/avatars/noah.jpg` },
    { rank: 7, name: "Samuel Smith", raised: "$3,000", bar: 132, avatar: `${A}/avatars/michael.jpg` },
    { rank: 8, name: "Andrea Joe", raised: "$2,500", bar: 132, avatar: `${A}/avatars/stephanie.jpg` },
];

/* Green progress fill with stripes + "$X Raised" label, on a gray track */
function ProgressBar({ raised, bar, goal, glow }: { raised: string; bar: number; goal?: string; glow?: boolean }) {
    return (
        <div className="flex-1 h-[32px] min-w-0 relative rounded-full bg-[#f2f2f2]">
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[32px] overflow-hidden rounded-full"
                style={{
                    width: bar,
                    background: "linear-gradient(90deg, #28c45d 0%, #34d56a 100%)",
                    boxShadow: glow ? "0px 0px 12px 0px rgba(40,196,93,0.5)" : undefined,
                }}
            >
                <span aria-hidden className="absolute inset-0" style={STRIPES} />
            </div>
            <p className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-white whitespace-nowrap">
                <span className="font-black" style={{ lineHeight: 1.25 }}>{raised}</span>
                <span className="font-medium leading-none"> Raised</span>
            </p>
            {goal && (
                <p className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[14px] text-[#aeb5bd] text-right whitespace-nowrap">
                    <span className="font-black" style={{ lineHeight: 1.25 }}>{goal} </span>
                    <span className="font-normal" style={{ lineHeight: 1.25 }}>Goal</span>
                </p>
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 2px 8px 0px rgba(0,48,96,0.08)" }} />
        </div>
    );
}

/* ── Leaderboard — title plaque, ribbon, top-3 podium & other participants ──
   Mobile: scaled plaque/ribbon, stacked cards, scrollable table · Desktop: full ── */
export default function LeaderboardSection() {
    return (
        <div className="relative bg-[#0268c0] overflow-hidden pt-[40px] md:pt-[80px] xl:pt-[112px] pb-[40px] md:pb-[80px] xl:pb-[112px]">
            {/* FBT pattern band at the top of the section */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-[1047px] overflow-hidden pointer-events-none">
                <Image src={`${A}/leaderboard/bg-pattern.png`} alt="" width={1920} height={1550} className="w-full h-auto max-w-none" />
            </div>

            <div className="relative flex flex-col items-center px-[16px] md:px-[24px] xl:px-0">
                {/* Title plaque + ribbon */}
                <div className="relative pb-[40px] md:pb-[64px]">
                    <div
                        className="relative flex flex-col items-center overflow-hidden p-[17px] md:p-[24px] rounded-[28px] md:rounded-[40px] w-[313px] h-[130px] md:w-[532px] md:h-[180px]"
                        style={{
                            background: "linear-gradient(180deg, #0278de 0%, #0d8dfd 66.111%)",
                            boxShadow: "0px 30px 30px -10px rgba(0,48,96,0.3)",
                        }}
                    >
                        <div
                            className="relative w-full h-[96px] md:h-[132px] rounded-[17px] md:rounded-[24px]"
                            style={{
                                background: "linear-gradient(180deg, #0278de 17.803%, #0d8dfd 71.97%)",
                                boxShadow: "0px 0px 40px 0px rgba(0,48,96,0.4)",
                            }}
                        >
                            <span aria-hidden className="absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0px -4px 8px 0px rgba(0,48,96,0.1), inset 0px 4px 8px -3px rgba(174,217,254,0.7)" }} />
                        </div>
                        <p
                            className="absolute left-1/2 top-[65px] md:top-[90px] -translate-x-1/2 -translate-y-1/2 font-black text-[33px] md:text-[46px] text-white text-center tracking-[-1.5px] leading-none whitespace-nowrap"
                            style={{ textShadow: "0px 0px 16px #005bac, 0px 0px 4px #005bac" }}
                        >
                            Leaderboard
                        </p>
                        <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 5px 4px -3px rgba(174,217,254,0.7)" }} />
                    </div>
                    {/* Ribbon overlapping the plaque bottom */}
                    <div className="absolute left-1/2 top-[94px] md:top-[116px] -translate-x-1/2 w-[343px] h-[36px] md:w-[599px] md:h-[64px] z-10">
                        <Image src={`${A}/leaderboard/ribbon-shape.svg`} alt="" width={599} height={64} className="absolute inset-0 block max-w-none size-full" />
                        <Image src={`${A}/leaderboard/ribbon-texture.svg`} alt="" width={599} height={64} className="absolute inset-0 block max-w-none size-full" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-[10px] md:gap-[16px] items-center justify-center px-[24px] w-[290px] md:w-[500px]">
                            <span aria-hidden className="relative rounded-full shrink-0 size-[7px] md:size-[11px] bg-[#dde0e3]">
                                <span className="absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0px 3.5px 0px 0px #7e8a96" }} />
                            </span>
                            <p className="font-bold text-[12px] md:text-[20px] text-white text-center whitespace-nowrap" style={{ lineHeight: 1.25 }}>
                                See who&rsquo;s leading the way!
                            </p>
                            <span aria-hidden className="relative rounded-full shrink-0 size-[7px] md:size-[11px] bg-[#dde0e3]">
                                <span className="absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0px 3.5px 0px 0px #7e8a96" }} />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top 3 podium — stacked below xl, row on desktop */}
                <div className="flex flex-col xl:flex-row gap-[24px] items-center w-full max-w-[1152px]">
                    {TOP3.map((t) => (
                        <div
                            key={t.first}
                            className="flex w-full xl:flex-1 flex-col gap-[24px] items-start min-w-0 overflow-hidden p-[32px] relative rounded-[20px]"
                            style={{
                                backgroundImage: t.tint,
                                boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)",
                            }}
                        >
                            <Image
                                src={`${A}/leaderboard/${t.medal}.png`}
                                alt=""
                                width={200}
                                height={200}
                                className="absolute right-[-54px] top-[-54px] size-[200px] max-w-none"
                            />
                            <div className="flex gap-[16px] items-center px-[8px] w-full">
                                <div className="bg-[#f4f8f9] overflow-hidden relative rounded-full shrink-0 size-[64px]">
                                    {t.avatar ? (
                                        <Image src={t.avatar} alt="" width={64} height={64} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <span className="absolute inset-[34%_24%_33%_27%] flex items-center justify-center">
                                            <Image src={`${A}/avatars/et.svg`} alt="" width={32} height={22} className="block max-w-none size-full" />
                                        </span>
                                    )}
                                </div>
                                <p className="text-[20px] text-[#003060] whitespace-nowrap">
                                    <span className="block font-black" style={{ lineHeight: 1.25 }}>{t.first}</span>
                                    <span className="block font-medium" style={{ lineHeight: 1.15 }}>{t.last}</span>
                                </p>
                            </div>
                            <div className="flex w-full">
                                <ProgressBar raised={t.raised} bar={t.bar} glow={t.glow} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Other participants */}
                <div
                    className="bg-white border border-[#eff4f9] flex flex-col gap-[24px] items-start overflow-hidden pb-[24px] pt-[24px] px-[16px] md:pb-[40px] md:pt-[32px] md:px-[40px] rounded-[20px] w-full max-w-[1152px] mt-[32px]"
                    style={{ boxShadow: "0px 20px 20px -14px rgba(0,0,0,0.15), 0px 30px 40px -16px rgba(0,0,0,0.1)" }}
                >
                    <div className="flex flex-col gap-[8px] items-start md:flex-row md:items-center md:justify-between w-full">
                        <h3 className="font-black text-[20px] md:text-[24px] text-[#003060] whitespace-nowrap" style={{ lineHeight: 1.15 }}>Other Participants</h3>
                        <p className="text-[20px] md:text-[24px] text-[#003060] tracking-[-0.5px] whitespace-nowrap" style={{ lineHeight: 1.15 }}>
                            <span className="font-light">Campaign Goal: </span>
                            <span className="font-black">$100,000</span>
                        </p>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <div className="border border-[#d4dee7] flex flex-col items-start overflow-hidden rounded-[16px] w-full min-w-[680px]">
                            {/* Table header */}
                            <div className="border-b border-[#d4dee7] flex gap-[24px] items-center px-[24px] md:px-[32px] xl:px-[48px] py-[16px] w-full font-black text-[12px] text-[#aeb5bd] tracking-[1px] uppercase leading-none">
                                <span className="w-[48px] xl:w-[80px] shrink-0">Rank</span>
                                <span className="flex-1 min-w-0">PARTICIPANT NAME</span>
                                <span className="flex-1 min-w-0">AMOUNT RAISED</span>
                            </div>
                            {/* Rows */}
                            <div className="bg-white flex flex-col items-start w-full">
                                {PARTICIPANTS.map((p) => (
                                    <div
                                        key={p.rank}
                                        className={`flex gap-[24px] items-center px-[24px] md:px-[32px] xl:px-[48px] py-[16px] w-full border-b border-[#d4dee7] ${p.highlighted ? "rounded-[44px]" : ""}`}
                                        style={
                                            p.highlighted
                                                ? { backgroundImage: "linear-gradient(172.92deg, #0278de 0%, #1291ff 52.604%, #0278de 100%)" }
                                                : undefined
                                        }
                                    >
                                        <span className="h-[24px] w-[48px] xl:w-[80px] relative shrink-0">
                                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full size-[24px] ${p.highlighted ? "bg-white" : "bg-[#aeb5bd]"}`}>
                                                <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[14px] leading-none ${p.highlighted ? "text-[#0268c0]" : "text-white"}`}>
                                                    {p.rank}
                                                </span>
                                            </span>
                                        </span>
                                        <div className="flex flex-1 gap-[16px] xl:gap-[24px] items-center min-w-0">
                                            <div className="bg-[#eff4f9] overflow-hidden relative rounded-full shrink-0 size-[48px]">
                                                <Image src={p.avatar} alt="" width={48} height={48} className="absolute inset-0 w-full h-full object-cover" />
                                            </div>
                                            <p className={`text-[16px] md:text-[18px] w-[140px] md:w-[200px] xl:w-[292px] ${p.highlighted ? "text-white font-black" : "text-[#003060] font-bold"}`} style={{ lineHeight: 1.15 }}>
                                                {p.name}
                                            </p>
                                        </div>
                                        <ProgressBar raised={p.raised} bar={p.bar} goal="$10,000" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
