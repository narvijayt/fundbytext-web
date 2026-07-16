"use client";

import { useState } from "react";

const A_VID_PLAY_GLOW = "/figma/vid-play-glow.svg";

/**
 * Small in-card video player: fills its parent, shows the poster with a play
 * button, and on click swaps in the real <video> playing the same default
 * campaign video the hero player uses. A card-sized sibling of HowItWorksVideo —
 * no fixed aspect of its own, so it takes the shape of the slot it's dropped in.
 *
 * Uses the SAME glowing play button as the hero (vid-play-glow.svg): the Figma
 * "made easy" cards carry that button too. It's rendered exactly as the hero does
 * it — a square span sized to the visible white circle, with the glow SVG at 270%
 * / -85% so the halo spills beyond. Sizing the button off the container WIDTH
 * (aspect-square) keeps it ~22% wide like the Figma's 72px-on-320px, and big
 * enough to sit cleanly over card 1's busy illustration instead of leaving the
 * runner poking out beside a too-small circle.
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
                <span className="relative flex aspect-square items-center justify-center transition-transform duration-200 group-hover:scale-105"
                    style={{ width: "clamp(56px,22%,78px)" }}>
                    {/* Glow extends far beyond the button (Figma: inset -85%). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_VID_PLAY_GLOW} className="absolute max-w-none"
                        style={{ width: "270%", height: "270%", left: "-85%", top: "-85%" }} />
                </span>
            </button>
        </>
    );
}
