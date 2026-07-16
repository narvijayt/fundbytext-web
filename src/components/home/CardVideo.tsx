"use client";

import { useState } from "react";

const A_VID_PLAY_GLOW = "/figma/vid-play-glow.svg";

/**
 * Small in-card video player: fills its parent, shows the poster with a glowing
 * play button, and on click swaps in the real <video> playing the same default
 * campaign video the hero player uses. A card-sized sibling of HowItWorksVideo —
 * no fixed aspect of its own, so it takes the shape of the slot it's dropped in.
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
                <span className="relative flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ width: "clamp(46px,18%,68px)", height: "clamp(46px,18%,68px)" }}>
                    {/* Glow reaches well beyond the button (Figma inset -85%), scaled
                        down here for the smaller card button. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={A_VID_PLAY_GLOW} className="absolute max-w-none"
                        style={{ width: "230%", height: "230%", left: "-65%", top: "-65%" }} />
                </span>
            </button>
        </>
    );
}
