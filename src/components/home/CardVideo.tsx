"use client";

import { useState } from "react";

/**
 * Small in-card video player: fills its parent, shows the poster with a play
 * button, and on click swaps in the real <video> playing the same default
 * campaign video the hero player uses. A card-sized sibling of HowItWorksVideo —
 * no fixed aspect of its own, so it takes the shape of the slot it's dropped in.
 *
 * The button is drawn in CSS (white circle + the Figma's #0278DE triangle + a
 * soft shadow) rather than the hero's glow PNG: that glow is a 94px button inside
 * a 254px blurred box, and scaling it down to card size shrank the blur into a
 * hard second ring — the "doubled circle" look.
 */
export default function CardVideo({ videoUrl, poster }: {
    videoUrl: string | null;
    poster: string;
}) {
    const [playing, setPlaying] = useState(false);

    if (playing && videoUrl) {
        return (
            <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full bg-black object-cover"
            />
        );
    }

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={poster} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <button
                type="button"
                aria-label="Play video"
                onClick={() => videoUrl && setPlaying(true)}
                className={`group absolute inset-0 flex items-center justify-center ${videoUrl ? "cursor-pointer" : "cursor-default"}`}
            >
                <span className="flex items-center justify-center rounded-full bg-white/90 shadow-[0_10px_26px_-6px_rgba(0,48,96,0.45)] backdrop-blur-[2px] transition-transform duration-200 group-hover:scale-105"
                    style={{ width: "clamp(46px,18%,64px)", height: "clamp(46px,18%,64px)" }}>
                    <svg viewBox="0 0 24 24" fill="#0278DE" className="h-[38%] w-[38%] translate-x-[8%]" aria-hidden>
                        <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.14-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14z" />
                    </svg>
                </span>
            </button>
        </>
    );
}
