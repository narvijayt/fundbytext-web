"use client";

import { useEffect, useState } from "react";

const SOCIALS = [
    {
        label: "Facebook",
        color: "#1877F2",
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" /></svg>,
        href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        label: "X",
        color: "#000000",
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
        href: (url: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
    },
    {
        label: "WhatsApp",
        color: "#25D366",
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.586 3.842 1.592 5.395L2 22l4.766-1.562A9.953 9.953 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2zm0 18c-1.682 0-3.252-.484-4.578-1.32l-.328-.194-3.388 1.11 1.138-3.291-.215-.342A8.002 8.002 0 014 12c0-4.411 3.589-8 7.999-8C16.41 4 20 7.589 20 12s-3.59 8-8.001 8z"/></svg>,
        href: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
    },
    {
        label: "SMS",
        color: "#22c55e",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
        href: (url: string) => `sms:?body=${encodeURIComponent(url)}`,
    },
    {
        label: "Email",
        color: "#EA4335",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        href: (url: string) => `mailto:?subject=Support%20this%20campaign&body=${encodeURIComponent(url)}`,
    },
];

export default function CampaignHeaderShare({ slug }: { slug: string }) {
    const [url, setUrl] = useState(`/campaigns/${slug}`);
    useEffect(() => {
        setUrl(`${window.location.origin}/campaigns/${slug}`);
    }, [slug]);

    return (
        <div className="flex items-center gap-1.5">
            {SOCIALS.map((s) => (
                <a
                    key={s.label}
                    href={s.href(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Share on ${s.label}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80 shrink-0"
                    style={{ background: s.color }}
                >
                    {s.icon}
                </a>
            ))}
        </div>
    );
}
