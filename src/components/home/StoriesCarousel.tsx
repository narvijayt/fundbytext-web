"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export type Story = {
    img: string;
    tag: string;
    title: string;
    desc: string;
};

/**
 * "How people use FundbyText" — Embla carousel matching the Figma
 * Story Cards frame: 368px white cards (24px pad/radius-16/#eaeef3 border),
 * the centered card carries the big blue drop shadow, and the pagination
 * dots below are 8px #0268c0 @15% with a 24px full-opacity active pill.
 */
export default function StoriesCarousel({ stories, dotTone = "blue" }: {
    stories: Story[];
    /** Pagination pill colour. "white" for the About page, where the dots sit on
     *  the blue wash; "blue" (default) for the home page's white backdrop. */
    dotTone?: "blue" | "white";
}) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "center",
        startIndex: 1,
        containScroll: false,
        skipSnaps: true,
    });
    const [selected, setSelected] = useState(1);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

    return (
        <div className="w-full flex flex-col items-center gap-4 lg:gap-6">
            {/* Carousel — overflow hidden (no scrollbar), drag/swipe to browse */}
            <div className="overflow-hidden w-full" ref={emblaRef}>
                {/* The featured card's drop-shadows are offset downward only, and the
                    embla wrapper clips, so the room they need is all on the BOTTOM —
                    a matching top pad was just dead space under the section heading. */}
                <div className="flex items-center gap-6 pt-3 pb-14">
                    {stories.map((s, i) => {
                        const featured = i === selected;
                        return (
                            <div key={s.title}
                                className="bg-white border border-[#eaeef3] flex flex-col gap-6 items-center p-6 rounded-[16px] flex-none w-[300px] sm:w-[368px] transition-[filter,transform] duration-300"
                                style={{
                                    filter: featured
                                        ? "drop-shadow(0 20px 10px rgba(0,91,172,0.15)) drop-shadow(0 50px 40px rgba(0,91,172,0.15))"
                                        : "none",
                                }}>
                                <div className="bg-white h-[180px] sm:h-[220px] overflow-hidden relative rounded-[14px] shadow-[0_20px_20px_-12px_rgba(2,120,222,0.15)] w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt={s.title} src={s.img} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-2 items-start w-full">
                                    <div className="bg-[#feece4] flex items-center justify-center px-1.5 pt-[5px] pb-1.5 rounded-[6px]">
                                        <span className="font-black text-[#f47435] text-[10px] tracking-[1px] uppercase leading-none">{s.tag}</span>
                                    </div>
                                    <p className="font-black text-[#003060] text-[20px] sm:text-[22px] leading-[1.25] w-full">{s.title}</p>
                                    <p className="font-normal text-[#2f3a45] text-base sm:text-lg leading-[1.4] w-full">{s.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center gap-4">
                {stories.map((s, i) => (
                    <button key={s.title} aria-label={`Go to story ${i + 1}`}
                        onClick={() => scrollTo(i)}
                        className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                            width: i === selected ? 24 : 8,
                            background: dotTone === "white" ? "#ffffff" : "#0268c0",
                            // White dots sit on the blue wash, so the resting state needs
                            // more presence than the blue-on-white variant's 15%.
                            opacity: i === selected ? 1 : (dotTone === "white" ? 0.45 : 0.15),
                        }} />
                ))}
            </div>
        </div>
    );
}
