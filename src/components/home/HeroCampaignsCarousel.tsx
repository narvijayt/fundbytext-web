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
 * The hero's campaign-card row, as a real Embla carousel: drag / swipe to move,
 * it snaps card-to-card and NEVER shows a scrollbar (the track is clipped with
 * overflow-hidden). The centred card is the featured one — it scales up + lifts so
 * it reads as "pulled out" of the row, exactly like the Figma; that selection
 * tracks the drag, so whichever card you land on becomes the hero.
 *
 * A slim "Browse all" link rides at the end of the track, revealed as you reach
 * the last card, so people can jump to the full campaigns list.
 */
export default function HeroCampaignsCarousel({
    cards, browseHref = "/campaigns",
}: { cards: HeroCard[]; browseHref?: string }) {
    if (cards.length === 0) return null;
    return (
        <div className="w-full">
            {/* Mobile / tablet — compact, one-size cards */}
            <div className="lg:hidden pb-2">
                <Row cards={cards} browseHref={browseHref} compact />
            </div>
            {/* Desktop — featured-centre cards */}
            <div className="hidden lg:block">
                <Row cards={cards} browseHref={browseHref} />
            </div>
        </div>
    );
}

function Row({ cards, browseHref, compact }: {
    cards: HeroCard[]; browseHref: string; compact?: boolean;
}) {
    // Which card starts centred: 1→1st, 2→2nd, 3→2nd, 4→3rd, 5→3rd. That's exactly
    // floor(n/2). Counted on the CARDS only — the "Browse all" slide never factors in.
    const centerIndex = Math.floor(cards.length / 2);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "center",
        startIndex: centerIndex,
        // containScroll off on BOTH so any selected card centres — including the
        // first and last. compact used to be a start-aligned strip (trimSnaps),
        // which on mobile left the first card flush-left and cut off; now the active
        // card sits dead-centre with its neighbours peeking either side.
        containScroll: false,
    });

    const [selected, setSelected] = useState(centerIndex);
    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    // The padding is headroom for the featured card's scale-up + lift + shadow; the
    // track clips, so without it the enlarged card would be cut off.
    return (
        <div className={`overflow-hidden ${compact ? "pb-8 pt-4" : "pb-10 pt-6"}`} ref={emblaRef}>
            {/* NO justify-content here. Embla positions the track with a transform;
                justify-center centres the children as a GROUP (card + "Browse all"),
                which fights that and left-shifted the card ~45px off centre on a short
                row. containScroll:false + align:"center" already centres the SELECTED
                card — over-scrolling into empty space when the row doesn't fill the
                viewport — which is what a 1–2 card row needs. */}
            <div className={`flex items-center ${compact ? "gap-3 px-4" : "gap-5 px-4"}`}>
                {cards.map((c, i) => {
                    // The centred card is always the featured one — at EVERY width, not
                    // just desktop, so tablet/mobile get the same raised, enlarged hero
                    // card as the browser view. A slightly gentler scale on compact: the
                    // card is already large next to a phone viewport.
                    const isFeatured = i === selected;
                    const up = compact ? "scale(1.06) translateY(-4px)" : "scale(1.1) translateY(-6px)";
                    return (
                        <div key={c.slug + i}
                            className="flex-none transition-[transform] duration-300 ease-out"
                            style={{
                                transform: isFeatured ? up : compact ? "scale(0.95)" : "scale(0.92)",
                                zIndex: isFeatured ? 10 : 1,
                            }}>
                            <Link href={c.slug} className="block">
                                <Card c={c} featured={isFeatured} compact={compact} />
                            </Link>
                        </div>
                    );
                })}
                {/* Browse-all link — the final slide, revealed at the end of the track. */}
                <BrowseAll href={browseHref} compact={compact} />
            </div>
        </div>
    );
}

function BrowseAll({ href, compact }: { href: string; compact?: boolean }) {
    return (
        <div className="flex-none flex items-center self-center pl-1">
            <Link href={href}
                className="group flex flex-col items-center gap-3 px-4 sm:px-6">
                <span className={`flex items-center justify-center rounded-full bg-white border border-[#eaeef3] shadow-[0_12px_20px_-6px_rgba(2,104,192,0.25)] transition-transform group-hover:scale-105 ${compact ? "w-12 h-12" : "w-14 h-14"}`}>
                    <svg width={compact ? 20 : 24} height={compact ? 20 : 24} viewBox="0 0 24 24" fill="none"
                        stroke="#0268c0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </span>
                <span className="font-black text-[#0268c0] text-xs tracking-[1px] uppercase whitespace-nowrap">
                    Browse all
                </span>
            </Link>
        </div>
    );
}

function Card({ c, featured, compact }: { c: HeroCard; featured: boolean; compact?: boolean }) {
    // The Figma cards are 300×404 on the 1920 board. Below 2xl they step down a
    // tier so the full five-card row fits a laptop (≈1440) without the outer cards
    // getting harshly clipped — the "made on larger screens" scaling caveat.
    // A soft, foggy drop shadow rather than the bright-blue one it had — brand blue
    // at 0.3 read as a hard colour-block, especially where the card overlaps the
    // white curved area (the login page). A darker, desaturated navy at low opacity
    // with a big blur diffuses instead, and reads as depth on both the blue hero and
    // the white below it.
    const shadow = featured
        ? "0 22px 44px -14px rgba(0,54,110,0.18),0 46px 90px -30px rgba(0,54,110,0.16)"
        : undefined;
    // 264-wide up to a wide desktop, then the Figma's 300 once the viewport is big
    // enough to seat all five at that size (~1680+). The jump waits for the room so
    // the full row never clips right at the breakpoint.
    const sizeCls = compact ? "" : "w-[264px] h-[356px] min-[1680px]:w-[300px] min-[1680px]:h-[404px]";
    const imgCls  = compact ? "" : "h-[176px] min-[1680px]:h-[200px]";
    return (
        <div className={`bg-white rounded-[16px] overflow-hidden border border-[#eaeef3] flex flex-col flex-none ${sizeCls}`}
            style={compact ? { width: 252, height: 346, boxShadow: shadow } : { boxShadow: shadow }}>
            <div className={`relative overflow-hidden flex-none ${imgCls}`} style={compact ? { height: 170 } : undefined}>
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
                    <div className={`relative ${compact ? "h-7 mt-auto" : "h-8 mt-auto"} rounded-[100px] overflow-hidden`}>
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
