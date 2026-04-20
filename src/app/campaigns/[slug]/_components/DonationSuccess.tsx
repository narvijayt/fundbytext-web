"use client";

import { useState } from "react";
import Image from "next/image";
import type { ModalParticipant } from "./DonateModal";

export type DonationSuccessData = {
    amount:      number;             // dollars
    cardBrand:   string | null;
    cardLast4:   string | null;
    participant: ModalParticipant | null;
};

type Props = DonationSuccessData & {
    campaignSlug:  string;
    campaignName:  string;
    campaignStory: string | null;
    heroUrl:       string | null;
    accent:        string;
    onClose?:      () => void;
};

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function CardBadge({ brand }: { brand: string | null }) {
    const b = (brand ?? "").toLowerCase();
    if (b === "visa") return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide bg-blue-700 text-white leading-none">
            VISA
        </span>
    );
    if (b === "mastercard") return (
        <span className="inline-flex items-center">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block" style={{ marginRight: "-6px" }} />
            <span className="w-4 h-4 rounded-full bg-amber-400 inline-block opacity-90" />
        </span>
    );
    if (b === "amex") return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide bg-sky-500 text-white leading-none">
            AMEX
        </span>
    );
    if (b === "discover") return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide bg-orange-500 text-white leading-none">
            DISC
        </span>
    );
    return (
        <svg className="w-6 h-4 text-gray-400" viewBox="0 0 32 20" fill="none">
            <rect width="32" height="20" rx="3" fill="#E5E7EB" />
            <rect y="6" width="32" height="5" fill="#9CA3AF" />
        </svg>
    );
}

export default function DonationSuccess({
    amount, cardBrand, cardLast4, participant,
    campaignSlug, campaignName, campaignStory, heroUrl, accent, onClose,
}: Props) {
    const [copied, setCopied] = useState(false);

    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/campaigns/${campaignSlug}`;

    async function handleShare() {
        if (navigator.share) {
            try {
                await navigator.share({ title: campaignName, url: shareUrl });
                return;
            } catch { /* user cancelled */ }
        }
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { /* ignore */ }
    }

    // Avatar: participant photo if available, else campaign hero, else placeholder
    const avatarSrc = participant?.profile_photo_url ?? heroUrl ?? null;
    const avatarAlt = participant ? `${participant.first_name} ${participant.last_name}` : campaignName;

    return (
        <div className="flex flex-col overflow-y-auto">
            {/* ── Blue gradient header ── */}
            <div
                className="relative flex flex-col items-center pt-10 pb-8 px-6 text-white text-center shrink-0"
                style={{ background: "linear-gradient(160deg,#0d47a1 0%,#1565c0 55%,#1976d2 100%)" }}
            >
                {/* X close */}
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Avatar + green checkmark badge */}
                <div className="relative mb-5">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-white/20 flex items-center justify-center shrink-0">
                        {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarSrc} alt={avatarAlt} className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-9 h-9 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        )}
                    </div>
                    {/* Green checkmark ring */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-[22px] h-[22px] rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <h2 className="text-[1.35rem] font-extrabold leading-snug mb-2">
                    Thank you for your<br />Generous Support!
                </h2>
                <p className="text-sm text-white/75">
                    Your contribution help us all get closer to the goal!
                </p>
            </div>

            {/* ── White body ── */}
            <div className="p-5 space-y-4 bg-white">
                {/* Payment details */}
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment details</p>
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total amount paid</span>
                            <span className="font-semibold text-gray-800">{fmtUSD(amount)}</span>
                        </div>
                        {cardLast4 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Payment method</span>
                                <span className="flex items-center gap-1.5 text-gray-700">
                                    <CardBadge brand={cardBrand} />
                                    <span className="font-medium">•••• {cardLast4}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Share row */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="flex-1 text-sm text-gray-700 leading-snug">
                        Help us reach more people by sharing this campaign
                    </p>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95 relative"
                        style={{ background: accent }}
                        title={copied ? "Link copied!" : "Share campaign"}
                    >
                        {copied ? (
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        )}
                    </button>
                </div>
                {copied && (
                    <p className="text-xs text-center text-green-600 -mt-2">Link copied to clipboard!</p>
                )}

                {/* Campaign card */}
                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    {heroUrl && (
                        <div className="relative h-28">
                            <Image src={heroUrl} alt={campaignName} fill className="object-cover" unoptimized sizes="400px" />
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-white/90 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                                <span className="text-[10px] font-semibold text-gray-700">Active</span>
                            </div>
                        </div>
                    )}
                    <div className="p-3">
                        <p className="text-sm font-bold text-gray-900 mb-1">{campaignName}</p>
                        {campaignStory && (
                            <div
                                className="text-xs text-gray-400 line-clamp-2 story-content"
                                dangerouslySetInnerHTML={{ __html: campaignStory }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
