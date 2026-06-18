"use client";

import Image from "next/image";
import type { ModalParticipant } from "./DonateModal";
import { SHARE_EVENT } from "./HelpSpreadModal";

const M = "/assets/marketing";

export type DonationSuccessData = {
    amount:      number;             // dollars
    cardBrand:   string | null;
    cardLast4:   string | null;
    receiptUrl?: string | null;      // Stripe-hosted receipt (omitted on the inline ?ref= path)
    participant: ModalParticipant | null;
};

type Props = DonationSuccessData & {
    campaignSlug:  string;
    campaignName:  string;
    campaignStory: string | null;
    heroUrl:       string | null;
    accent:        string;
    daysLeft?:     number | null;
    onClose?:      () => void;
};

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function CardBadge({ brand }: { brand: string | null }) {
    const b = (brand ?? "").toLowerCase();
    if (b === "visa")       return <Image src={`${M}/footer/visa.svg`} alt="Visa" width={24} height={24} className="size-6" />;
    if (b === "mastercard") return <Image src={`${M}/footer/mastercard.svg`} alt="Mastercard" width={24} height={24} className="size-6" />;
    if (b === "amex")       return <span className="inline-flex items-center rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-black leading-none tracking-wide text-white">AMEX</span>;
    if (b === "discover")   return <span className="inline-flex items-center rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-black leading-none tracking-wide text-white">DISC</span>;
    return <Image src={`${M}/footer/mastercard.svg`} alt="" width={24} height={24} className="size-6" />;
}

/* Green check badge — a light ring around a green circle with a white check. */
function CheckBadge({ className = "size-16" }: { className?: string }) {
    return (
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-white/25 ${className}`}>
            <span className="flex size-[78%] items-center justify-center rounded-full bg-[#28c45d]">
                <svg className="size-[55%] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </span>
        </span>
    );
}

export default function DonationSuccess({
    amount, cardBrand, cardLast4, receiptUrl, participant,
    campaignSlug, campaignName, campaignStory, heroUrl, accent, daysLeft = null, onClose,
}: Props) {
    const openShare = () => window.dispatchEvent(new CustomEvent(SHARE_EVENT));

    return (
        <div className="flex max-h-[92vh] flex-col overflow-y-auto overflow-x-hidden rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)]">
            {/* ── Themed header band ── */}
            <div className="relative shrink-0 overflow-hidden px-6 pt-8 pb-9 text-center" style={{ background: `linear-gradient(150deg, ${accent} 0%, ${accent} 55%, color-mix(in srgb, ${accent} 72%, #000) 130%)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${M}/leaderboard/bg-pattern.png`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.12] pointer-events-none" />
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/35">
                        <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {/* Success icon — avatar + check for a targeted donation, just the check otherwise */}
                <div className="relative mb-4 flex items-center justify-center">
                    {participant && (
                        <span className="-mr-3 size-16 shrink-0 overflow-hidden rounded-full border-2 border-white/40 bg-white/25">
                            {participant.profile_photo_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={participant.profile_photo_url} alt="" className="size-full object-cover" />
                                : <span className="flex size-full items-center justify-center text-xl font-black text-white">{participant.first_name.charAt(0)}</span>}
                        </span>
                    )}
                    <CheckBadge className="size-16" />
                </div>

                <h2 className="relative text-[26px] font-black leading-[1.2] text-white">Thank you for your<br />Generous Support!</h2>
                <p className="relative mt-2 text-[14px] text-white/80">Your contribution helps us all get closer to the goal!</p>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col gap-5 p-6">
                {/* Payment details */}
                <div className="rounded-2xl border border-[#e7e9eb] p-5">
                    <p className="mb-4 text-[16px] font-black text-[#003060]">Payment details</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[14px]">
                            <span className="text-[#aeb5bd]">Total amount paid</span>
                            <span className="font-bold text-[#003060]">{fmtUSD(amount)}</span>
                        </div>
                        {cardLast4 && (
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="text-[#aeb5bd]">Payment method</span>
                                <span className="flex items-center gap-2 font-medium text-[#003060]"><CardBadge brand={cardBrand} /> {cardLast4}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Download receipt */}
                {receiptUrl && (
                    <a href={receiptUrl} target="_blank" rel="noreferrer"
                        className="flex h-14 w-full items-center justify-center rounded-2xl text-white transition hover:brightness-105 active:scale-[0.99]"
                        style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)", boxShadow: "0px 20px 40px -16px rgba(244,116,53,0.5)" }}>
                        <span className="text-[14px] font-black uppercase tracking-[1px]">Download Receipt</span>
                    </a>
                )}

                {/* Share row */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#e7e9eb] px-5 py-4">
                    <p className="flex-1 text-[14px] font-medium leading-snug text-[#003060]">Help us reach more people by sharing this campaign</p>
                    <button type="button" onClick={openShare} title="Share"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-105 active:scale-95"
                        style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)" }}>
                        <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
                    </button>
                </div>

                {/* Campaign card */}
                <div className="flex gap-3 overflow-hidden rounded-2xl border border-[#e7e9eb] p-3">
                    <div className="relative size-[88px] shrink-0 overflow-hidden rounded-xl bg-[#e7e9eb]">
                        {heroUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={heroUrl} alt={campaignName} className="size-full object-cover" />
                        )}
                        {daysLeft != null && (
                            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 backdrop-blur">
                                <span className="size-1 rounded-full bg-[#f47435]" />
                                <span className="text-[9px] font-bold text-[#003060]">{daysLeft} Days</span>
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-black leading-[1.25] text-[#003060] line-clamp-2">{campaignName}</p>
                        {campaignStory && (
                            <div className="story-content mt-1 line-clamp-2 text-[12px] text-[#7e8a96]" dangerouslySetInnerHTML={{ __html: campaignStory }} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
