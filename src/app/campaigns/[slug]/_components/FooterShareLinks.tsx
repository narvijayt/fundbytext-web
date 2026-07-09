"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const A = "/assets/marketing";
const SHARE_TEXT = "Support this campaign on FundbyText";

/* Telegram + WhatsApp share buttons for the footer. Share the current
 * campaign page — the absolute URL is only known on the client, so this is
 * a small client island (same pattern as SpreadTheWord). */
export default function FooterShareLinks() {
    const [url, setUrl] = useState("");
    useEffect(() => {
        // Drop any ?ref/#hash so the shared link is clean.
        setUrl(window.location.href.split(/[?#]/)[0]);
    }, []);

    const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`;

    return (
        <div className="flex gap-[8px] items-center shrink-0 w-full md:w-[235px] xl:w-[300px]">
            <a
                href={url ? telegram : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Telegram"
                aria-disabled={!url}
                className="rounded-full transition-opacity hover:opacity-80"
            >
                <Image src={`${A}/footer/social-1.svg`} alt="Telegram" width={40} height={40} className="size-[40px]" />
            </a>
            <a
                href={url ? whatsapp : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                aria-disabled={!url}
                className="rounded-full transition-opacity hover:opacity-80"
            >
                <Image src={`${A}/footer/social-2.svg`} alt="WhatsApp" width={40} height={40} className="size-[40px]" />
            </a>
        </div>
    );
}
