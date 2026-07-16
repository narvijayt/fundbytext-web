"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import CountdownBadge from "@/components/CountdownBadge";

const A_CARD_GRADIENT = "/figma/card-gradient.svg";
const A_BAR_TEXTURE   = "/figma/bar-texture.svg";
const A_TIMER_ICON    = "/figma/timer-icon.svg";

export type HeroCard = {
    img: string | null;
    tag: string;
    name: string;
    goal: string | null;
    slug: string;
    status: string;
    endDate: string | null;
};

/**
 * The hero's staggered campaign-card row, as an Embla carousel:
 * drag/swipe to scroll, never a scrollbar. Only real campaigns are shown.
 * The middle card is featured (raised + glow), the outermost are shorter,
 * matching the Figma stagger.
 */
export default function HeroCampaignsCarousel({ cards }: { cards: HeroCard[] }) {
    const mid = Math.floor(cards.length / 2);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "center",
        startIndex: mid,
        containScroll: false,
        skipSnaps: true,
    });

    // Whichever card is centred is the featured one — it updates as you drag, so
    // the popped-out card is always the one in the middle, not a fixed index.
    const [selected, setSelected] = useState(mid);
    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    if (cards.length === 0) return null;

    return (
        <div className="w-full">
            {/* Mobile / tablet — compact cards */}
            <div className="lg:hidden pb-6">
                <MobileRow cards={cards} />
            </div>

            {/* Desktop — Embla row (no scrollbar). One card size; the centred card
                scales up + lifts so it reads as "pulled out", the rest sit back. A
                transform (not a width/height change) keeps Embla's centring stable as
                the featured card changes. */}
            <div className="hidden lg:block overflow-hidden pb-10 pt-6" ref={emblaRef}>
                <div className="flex items-center gap-5 px-4"
                    style={{ justifyContent: cards.length <= 5 ? "center" : "flex-start" }}>
                    {cards.map((c, i) => {
                        const isFeatured = i === selected && cards.length >= 3;
                        return (
                            <div key={c.slug + i}
                                className="flex-none transition-[transform,filter] duration-300 ease-out"
                                style={{
                                    transform: isFeatured ? "scale(1.13) translateY(-6px)" : "scale(0.92)",
                                    zIndex: isFeatured ? 10 : 1,
                                }}>
                                <Link href={c.slug} className="block">
                                    <Card c={c} w={300} h={404} imgH={200} featured={isFeatured} offset={0} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function MobileRow({ cards }: { cards: HeroCard[] }) {
    const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
    return (
        <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-3 px-4">
                {cards.map((c, i) => (
                    <Link key={c.slug + i} href={c.slug} className="flex-none">
                        <Card c={c} w={252} h={346} imgH={170} featured={false} offset={0} compact />
                    </Link>
                ))}
            </div>
        </div>
    );
}

function Card({ c, w, h, imgH, featured, offset, compact }: {
    c: HeroCard; w: number; h: number; imgH: number;
    featured: boolean; offset: number; compact?: boolean;
}) {
    return (
        <div className="bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none"
            style={{
                width: w, height: h,
                marginTop: offset > 0 ? offset : 0,
                marginBottom: offset < 0 ? Math.abs(offset) : 0,
                boxShadow: featured
                    ? "0 20px 20px -12px rgba(2,120,222,0.3),0 50px 80px -16px rgba(2,120,222,0.3)"
                    : undefined,
            }}>
            <div className="relative overflow-hidden flex-none" style={{ height: imgH }}>
                {c.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={c.name} src={c.img} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400" />
                )}
                {c.status === "active" && c.endDate && (
                    <div className={`absolute ${compact ? "bottom-3 left-3" : "bottom-4 left-4"} flex items-center gap-1.5`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" src={A_TIMER_ICON} width={compact ? 14 : 16} height={compact ? 14 : 16} style={{ display: "block" }} />
                        <CountdownBadge date={c.endDate} mode="left"
                            className={`font-bold text-white ${compact ? "text-[10px]" : "text-xs"} tracking-[1px] uppercase`} />
                    </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={A_CARD_GRADIENT}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-none scale-y-[-1] pointer-events-none"
                    style={{ width: 599, height: 200 }} />
            </div>
            <div className={`flex flex-col ${compact ? "gap-3 p-4" : "gap-5 p-5"} flex-1`}>
                <div className={`flex flex-col ${compact ? "gap-2" : "gap-2.5"}`}>
                    <div className="inline-flex self-start bg-[#feece4] px-1.5 py-1 rounded-[6px]">
                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase">{c.tag}</span>
                    </div>
                    <p className={`font-black text-[#003060] ${compact ? "text-[15px] line-clamp-2" : "text-lg"} leading-snug`}>{c.name}</p>
                </div>
                {c.goal && (
                    <div className={`relative ${compact ? "h-7 mt-auto" : "h-8"} rounded-[100px] overflow-hidden`}>
                        <div className="absolute inset-0 bg-[#f2f2f2] rounded-[100px]" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" src={A_BAR_TEXTURE}
                            className="absolute left-0 top-1/2 -translate-y-1/2 max-w-none"
                            style={{ width: 120, height: 32 }} />
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-white ${compact ? "text-xs" : "text-sm"} font-black whitespace-nowrap`}>
                            {c.goal} <span className="font-medium">Goal</span>
                        </span>
                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_8px_0_rgba(0,48,96,0.08)] pointer-events-none" />
                    </div>
                )}
            </div>
        </div>
    );
}
