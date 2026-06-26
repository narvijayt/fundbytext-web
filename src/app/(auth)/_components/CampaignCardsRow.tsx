const F = "/figma";
const A_CARD_GRADIENT = `${F}/card-gradient.svg`;
const A_BAR_TEXTURE = `${F}/bar-texture.svg`;
const A_TIMER_ICON = `${F}/timer-icon.svg`;
const AUTH = `${F}/auth`;

type Card = { img: string; tag: string; name: string; goal: string; days: string | null };

const CARDS: Card[] = [
    { img: `${AUTH}/card-vet.jpg`,        tag: "Animal Welfare",   name: "Raise Money for Vet Bills of Rescued Pets",    goal: "$3,000",  days: null },
    { img: `${AUTH}/card-equipment.jpg`,  tag: "Medical & Health", name: "Raise Funds for Special Needs Equipment",      goal: "$3,000",  days: null },
    { img: `${AUTH}/card-basketball.jpg`, tag: "Sports",           name: "Fund Equipment for a Youth Basketball League", goal: "$10,000", days: "90 days left" },
    { img: `${AUTH}/card-choir.jpg`,      tag: "Music",            name: "Support a Youth Choir Competition",            goal: "$6,000",  days: null },
    { img: `${AUTH}/card-community.jpg`,   tag: "Ministry",         name: "Fund a Community Outreach Program",            goal: "$5,000",  days: null },
];

function GoalBar({ goal, small }: { goal: string; small?: boolean }) {
    return (
        <div className={`relative ${small ? "h-7" : "h-8"} rounded-[100px] overflow-hidden mt-auto`}>
            <div className="absolute inset-0 bg-[#f2f2f2] rounded-[100px]" />
            <img alt="" src={A_BAR_TEXTURE} className="absolute left-0 top-1/2 -translate-y-1/2 max-w-none" style={{ width: 120, height: 32 }} />
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-white ${small ? "text-xs" : "text-sm"} font-black whitespace-nowrap`}>
                {goal} <span className="font-medium">Goal</span>
            </span>
            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_8px_0_rgba(0,48,96,0.08)] pointer-events-none" />
        </div>
    );
}

export default function CampaignCardsRow() {
    return (
        <div className="relative w-full">
            {/* Mobile / tablet — horizontal snap scroll */}
            <div className="lg:hidden w-full pb-2"
                style={{ overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
                <div className="flex gap-3 pl-4" style={{ width: "max-content", paddingRight: 16 }}>
                    {CARDS.map((c, i) => (
                        <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none"
                            style={{ width: 252, height: 346, scrollSnapAlign: "start" }}>
                            <div className="relative overflow-hidden flex-none" style={{ height: 170 }}>
                                <img alt={c.name} src={c.img} className="absolute inset-0 w-full h-full object-cover" />
                                {c.days && (
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                        <img alt="" src={A_TIMER_ICON} width={14} height={14} style={{ display: "block" }} />
                                        <span className="font-bold text-white text-[10px] tracking-[1px] uppercase">{c.days}</span>
                                    </div>
                                )}
                                <img alt="" src={A_CARD_GRADIENT} className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-none scale-y-[-1] pointer-events-none" style={{ width: 599, height: 200 }} />
                            </div>
                            <div className="flex flex-col gap-3 p-4 flex-1">
                                <div className="flex flex-col gap-2">
                                    <div className="inline-flex self-start bg-[#feece4] px-1.5 py-1 rounded-[6px]">
                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{c.tag}</span>
                                    </div>
                                    <p className="font-black text-[#003060] text-[15px] leading-snug line-clamp-2">{c.name}</p>
                                </div>
                                <GoalBar goal={c.goal} small />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop — staggered fixed layout */}
            <div className="hidden lg:block overflow-x-auto pb-2">
                <div className="flex items-end justify-center gap-4 px-4 min-w-max mx-auto">
                    {CARDS.map((c, i) => {
                        const isFeatured = i === 2;
                        const isEdge = i === 0 || i === 4;
                        const cardH = isEdge ? 370 : 400;
                        const cardW = isEdge ? 280 : 303;
                        const topOffset = isFeatured ? -30 : isEdge ? 30 : 0;
                        return (
                            <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none"
                                style={{
                                    width: cardW, height: cardH,
                                    marginTop: topOffset > 0 ? topOffset : 0,
                                    marginBottom: topOffset < 0 ? Math.abs(topOffset) : 0,
                                    boxShadow: isFeatured ? "0 20px 20px -12px rgba(2,120,222,0.3),0 50px 80px -16px rgba(2,120,222,0.3)" : undefined,
                                }}>
                                <div className="relative overflow-hidden flex-none" style={{ height: isEdge ? 185 : 200 }}>
                                    <img alt={c.name} src={c.img} className="absolute inset-0 w-full h-full object-cover" />
                                    {c.days && (
                                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                                            <img alt="" src={A_TIMER_ICON} width={16} height={16} style={{ display: "block" }} />
                                            <span className="font-bold text-white text-xs tracking-[1px] uppercase">{c.days}</span>
                                        </div>
                                    )}
                                    <img alt="" src={A_CARD_GRADIENT} className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-none scale-y-[-1] pointer-events-none" style={{ width: 599, height: 200 }} />
                                </div>
                                <div className="flex flex-col gap-5 p-5 flex-1">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="inline-flex self-start bg-[#feece4] px-1.5 py-1 rounded-[6px]">
                                            <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{c.tag}</span>
                                        </div>
                                        <p className="font-black text-[#003060] text-lg leading-snug">{c.name}</p>
                                    </div>
                                    <GoalBar goal={c.goal} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
