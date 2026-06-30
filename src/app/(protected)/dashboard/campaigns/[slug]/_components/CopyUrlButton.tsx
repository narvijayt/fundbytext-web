"use client";

import { useEffect, useState } from "react";

export default function CopyUrlButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState(`/campaigns/${slug}`);

    useEffect(() => {
        setUrl(`${window.location.origin}/campaigns/${slug}`);
    }, [slug]);

    function copy() {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#e7e9eb] bg-white py-1.5 pl-3 pr-1.5 shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)]">
            {/* globe */}
            <svg className="h-4 w-4 shrink-0 text-[#9aa7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
            </svg>
            <span className="min-w-0 truncate font-mono text-[13px] text-[#7e8a96]">{url}</span>

            <button
                onClick={copy}
                title={copied ? "Copied!" : "Copy link"}
                className="shrink-0 rounded-md p-1 text-[#9aa7b8] transition-colors hover:bg-[#0268c0]/8 hover:text-[#003060]"
            >
                {copied ? (
                    <svg className="h-4 w-4 text-[#28c45d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>

            <span className="h-5 w-px shrink-0 bg-[#e7e9eb]" />

            <a
                href={`/campaigns/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-[#0268c0] transition-all duration-150 hover:bg-[#0268c0]/8 active:scale-[0.97]"
            >
                View
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
}
