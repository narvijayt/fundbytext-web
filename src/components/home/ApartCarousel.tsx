"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export type ApartCard = {
    img: string;
    title: string;
    body: string;
};

/**
 * "See It In Action" — the What Sets Us Apart carousel. Same Embla setup as the
 * Stories one, but the Figma's card is inverted: copy on top, image beneath
 * (368px card, 24px pad/gap, radius-24, a 336/193 image at radius-12).
 *
 * Cards stretch to a common height here, unlike the Stories carousel: the Figma
 * draws all five at the same 341.8px and our bodies vary far more in length than
 * its placeholder copy does, so centring ragged cards would read as a mistake.
 * The image is pushed to the bottom so it still lines up across cards.
 */
export default function ApartCarousel({ cards }: { cards: ApartCard[] }) {
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
        <div className="w-full flex flex-col items-center gap-8">
            {/* Capped at the Figma's 1152 container (three 368px cards + two 24px
                gaps), so three fill it at desktop and the rest clip against the
                container rather than the window. overflow-x-clip keeps the cross axis
                genuinely visible — see StoriesCarousel for why `hidden` can't be used
                on one axis alone. */}
            <div className="overflow-x-clip overflow-y-visible w-full max-w-[1152px]" ref={emblaRef}>
                <div className="flex items-stretch gap-6">
                    {cards.map((c) => (
                        <div key={c.title}
                            className="bg-white border border-[#eaeef3] rounded-[24px] p-6 flex flex-col gap-6 flex-none w-[300px] sm:w-[368px]">
                            <div className="flex flex-col gap-2">
                                <p className="font-black text-[#003060] text-[18px] lg:text-[20px] 2xl:text-[22px] leading-[1.25]">{c.title}</p>
                                <p className="font-normal text-[#2f3a45] text-[15px] lg:text-base 2xl:text-[18px] leading-[1.4]">{c.body}</p>
                            </div>
                            <div className="mt-auto w-full rounded-[12px] overflow-hidden bg-[#f2f2f2] aspect-[336/193]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" src={c.img} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {cards.map((c, i) => (
                    <button key={c.title} aria-label={`Go to slide ${i + 1}`}
                        onClick={() => scrollTo(i)}
                        className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                            width: i === selected ? 24 : 8,
                            background: "#0268c0",
                            opacity: i === selected ? 1 : 0.15,
                        }} />
                ))}
            </div>
        </div>
    );
}
