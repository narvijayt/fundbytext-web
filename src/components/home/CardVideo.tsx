"use client";

import { useState, type CSSProperties } from "react";

/**
 * Small in-card video player: fills its parent with the poster and, on click,
 * swaps in the real <video> playing the same default campaign video the hero
 * player uses.
 *
 * No play-button overlay of its own: the "made easy" poster PNGs are full Figma
 * mockups with a play button already baked in, so an overlay would double it. The
 * whole poster is the click target instead. `posterStyle` lets a card zoom/shift
 * its poster (object-cover + a transform) to crop the blue frame off the photos
 * that ship letterboxed inside it.
 */
export default function CardVideo({ videoUrl, poster, posterStyle }: {
    videoUrl: string | null;
    poster: string;
    posterStyle?: CSSProperties;
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
        <button
            type="button"
            aria-label="Play video"
            onClick={() => videoUrl && setPlaying(true)}
            className={`absolute inset-0 overflow-hidden ${videoUrl ? "cursor-pointer" : "cursor-default"}`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={poster} className="absolute inset-0 h-full w-full object-cover" style={posterStyle} />
        </button>
    );
}
