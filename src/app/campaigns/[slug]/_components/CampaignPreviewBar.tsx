"use client";

import Link from "next/link";
import { useState } from "react";

/* A floating status pill (bottom-centre) that flags a campaign as a draft
   and/or private without a full-width banner breaking the top of the page.
   The page itself renders exactly like a live campaign; this just sits above it. */
export default function CampaignPreviewBar({
    isDraft, isPrivate, isOrganizer, slug,
}: {
    isDraft: boolean;
    isPrivate: boolean;
    isOrganizer: boolean;
    slug: string;
}) {
    const [open, setOpen] = useState(true);
    if (!isDraft && !isPrivate) return null;

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Show preview status"
                className="fixed bottom-5 left-1/2 z-40 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-[#0f1d43] text-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.5)] ring-1 ring-white/10 transition-transform hover:scale-105"
            >
                {isDraft
                    ? <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 px-3">
            <div className="flex items-center gap-3 rounded-full bg-[#0f1d43] py-2 pl-4 pr-2 text-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.55)] ring-1 ring-white/10 backdrop-blur">
                {isDraft && (
                    <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                        </span>
                        <span className="text-[13px] font-semibold">Draft preview</span>
                    </span>
                )}

                {isDraft && isPrivate && <span className="h-4 w-px bg-white/20" />}

                {isPrivate && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span className="text-[13px] font-semibold">Private</span>
                    </span>
                )}

                {isDraft && isOrganizer && (
                    <Link
                        href={`/campaigns/${slug}/edit`}
                        className="ml-1 whitespace-nowrap rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
                    >
                        Back to editor
                    </Link>
                )}

                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Hide preview status"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
            </div>
        </div>
    );
}
