"use client";

import { useEffect, useState } from "react";

const A_FOOTER_TG = "/figma/footer-tg.svg";
const A_FOOTER_WA = "/figma/footer-wa.svg";

// Shares FundByText itself, not a campaign — the marketing footer shows on pages
// with nothing campaign-specific to share, so these point at the site root. The
// absolute URL is only known on the client, so this is a small client island
// (same pattern as the campaign page's FooterShareLinks).
const SHARE_TEXT = "Check out FundByText — text-driven fundraising made simple.";

export default function FooterSocialShare() {
    const [url, setUrl] = useState("");
    // Deferred a frame so it isn't a synchronous setState inside the effect
    // (which the React Compiler flags as a cascading render).
    useEffect(() => {
        const raf = requestAnimationFrame(() => setUrl(window.location.origin));
        return () => cancelAnimationFrame(raf);
    }, []);

    const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`;

    return (
        <div className="flex items-center gap-2 sm:w-[300px] shrink-0">
            <a
                href={url ? telegram : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share FundByText on Telegram"
                aria-disabled={!url}
                className="block size-10 transition hover:brightness-110"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={A_FOOTER_TG} className="size-10" />
            </a>
            <a
                href={url ? whatsapp : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share FundByText on WhatsApp"
                aria-disabled={!url}
                className="block size-10 transition hover:brightness-110"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={A_FOOTER_WA} className="size-10" />
            </a>
        </div>
    );
}
