"use client";

import { useState } from "react";

const A_VID_THUMB     = "/figma/vid-thumb.png";
const A_VID_PLAY_GLOW = "/figma/vid-play-glow.svg";

/**
 * The "See How It Works" player. Shows the Figma thumbnail + glowing play
 * button; on click it swaps in a real <video> playing the same default
 * campaign video that campaign pages use (app-settings default).
 */
export default function HowItWorksVideo({ videoUrl, poster }: {
    videoUrl: string | null;
    poster: string | null;
}) {
    const [playing, setPlaying] = useState(false);

    return (
        <div className="relative z-10 w-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_20px_20px_-14px_rgba(2,104,192,0.2),0_40px_40px_-16px_rgba(2,104,192,0.2)]"
            style={{ maxWidth: 1152, aspectRatio: "1152/500", background: "#f2f2f2" }}>
            {playing && videoUrl ? (
                <video
                    src={videoUrl}
                    poster={poster ?? A_VID_THUMB}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                />
            ) : (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="FundByText in action" src={poster ?? A_VID_THUMB}
                        className="absolute w-full h-full object-cover pointer-events-none" />
                    <button
                        aria-label="Play video"
                        onClick={() => videoUrl && setPlaying(true)}
                        className={`absolute inset-0 flex items-center justify-center group ${videoUrl ? "cursor-pointer" : "cursor-default"}`}
                    >
                        <span className="relative flex items-center justify-center group-hover:scale-105 transition-transform"
                            style={{ width: "clamp(60px,8vw,94px)", height: "clamp(60px,8vw,94px)" }}>
                            {/* Glow extends far beyond the 94px button (Figma: inset -85%) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="" src={A_VID_PLAY_GLOW} className="absolute max-w-none"
                                style={{ width: "270%", height: "270%", left: "-85%", top: "-85%" }} />
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
