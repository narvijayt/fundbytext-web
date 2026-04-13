"use client";

import { useEffect, useState } from "react";

export default function CopyUrlButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState(`/campaigns/${slug}`);

    useEffect(() => {
        setUrl(`${window.location.origin}/campaigns/${slug}`);
    }, [slug]);

    function copy() {
        navigator.clipboard.writeText(`${window.location.origin}/campaigns/${slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="flex items-center gap-1.5 mt-1">
            <a
                href={`/campaigns/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition-colors"
            >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View public page
            </a>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 font-mono truncate max-w-45">{url}</span>
            <button
                onClick={copy}
                title="Copy URL"
                className="ml-0.5 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
                {copied ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
