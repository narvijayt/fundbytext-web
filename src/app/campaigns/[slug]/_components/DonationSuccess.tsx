"use client";

import Image from "next/image";
import type { ModalParticipant } from "./DonateModal";
import { SHARE_EVENT } from "./HelpSpreadModal";

const M = "/assets/marketing";
const C = "/assets/campaigns";

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
    patternImage?: string | null;
    patternSize?:  string;
    patternCover?: boolean;
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

/* The exact Figma success mark — a green ring + check on a frosted-gray circle. */
function CheckCircle({ className = "size-16" }: { className?: string }) {
    return (
        <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f2f2f2] to-[#dde0e3] ${className}`}>
            <Image src={`${C}/success-check.svg`} alt="" width={60} height={60} className="size-[72%]" />
        </span>
    );
}

export default function DonationSuccess({
    amount, cardBrand, cardLast4, receiptUrl, participant,
    campaignSlug, campaignName, campaignStory, heroUrl, accent,
    patternImage = null, patternSize = "", patternCover = false, daysLeft = null, onClose,
}: Props) {
    const openShare = () => window.dispatchEvent(new CustomEvent(SHARE_EVENT));
    const pat = patternImage ?? `${M}/leaderboard/bg-pattern.png`;

    return (
        <div className="modal-scroll flex max-h-[92vh] flex-col overflow-y-auto overflow-x-hidden rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)]">
            {/* ── Themed header band — accent gradient + centred color-dodge halo,
                 with the campaign's selected theme pattern as a watermark. ── */}
            <div
                className="relative shrink-0 overflow-hidden px-6 pt-9 pb-8 text-center sm:px-8"
                style={{
                    backgroundImage: `radial-gradient(58% 72% at 50% 16%, rgba(160,210,255,0.6), rgba(160,210,255,0) 62%), linear-gradient(160deg, ${accent} 0%, ${accent} 52%, color-mix(in srgb, ${accent} 74%, #000) 120%)`,
                    backgroundBlendMode: "color-dodge, normal",
                }}
            >
                {/* Selected background-theme pattern watermark (same as the donate modal). */}
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 ${patternCover ? "opacity-[0.16]" : "opacity-[0.12]"}`}
                    style={{
                        backgroundImage: `url('${pat}')`,
                        backgroundRepeat: patternCover ? "no-repeat" : "repeat",
                        backgroundSize: patternImage ? patternSize : "cover",
                        backgroundPosition: patternCover ? "center" : undefined,
                    }}
                />
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center text-white transition-opacity hover:opacity-70">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {/* Success mark — participant avatar + check for a targeted donation, just the check otherwise */}
                <div className="relative flex items-center justify-center">
                    {participant && (
                        <span className="-mr-3.5 size-16 shrink-0 rounded-full bg-gradient-to-b from-[#f2f2f2] to-[#dde0e3] p-[3px]">
                            <span className="block size-full overflow-hidden rounded-full bg-white/25">
                                {participant.profile_photo_url
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={participant.profile_photo_url} alt="" className="size-full object-cover" />
                                    : <span className="flex size-full items-center justify-center text-xl font-black text-[#8f98a3]">{participant.first_name.charAt(0)}</span>}
                            </span>
                        </span>
                    )}
                    <CheckCircle className="size-16" />
                </div>

                <h2 className="relative mt-4 text-[22px] font-black leading-[1.2] text-white sm:text-[25px]">
                    Thank you for your<br />Generous Support!
                </h2>
                <p className="relative mt-2 text-[13px] text-white/85 sm:text-[14px]">Your contribution help us all get closer to the goal!</p>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col gap-4 p-5 sm:gap-5 sm:p-6">
                {/* Payment details */}
                <div className="rounded-2xl border border-[#e7e9eb] p-5">
                    <p className="mb-4 text-[15px] font-black text-[#003060]">Payment details</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[14px]">
                            <span className="text-[#aeb5bd]">Total amount paid</span>
                            <span className="font-semibold text-[#003060]">{fmtUSD(amount)}</span>
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
                        className="flex h-[52px] w-full items-center justify-center rounded-2xl text-white transition hover:brightness-105 active:scale-[0.99]"
                        style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)", boxShadow: "0px 20px 40px -16px rgba(244,116,53,0.5)" }}>
                        <span className="text-[13px] font-black uppercase tracking-[1px]">Download Receipt</span>
                    </a>
                )}

                {/* Share + campaign — one bordered card, split by a divider. */}
                <div className="flex flex-col rounded-2xl border border-[#e7e9eb] p-5">
                    <div className="flex items-center gap-3">
                        <p className="flex-1 text-[14px] font-medium leading-snug text-[#003060]">Help us reach more people by sharing this campaign</p>
                        <button type="button" onClick={openShare} title="Share"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-105 active:scale-95"
                            style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)" }}>
                            <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
                        </button>
                    </div>
                    <div className="my-4 border-t border-[#eef1f4]" />
                    <div className="flex gap-3.5">
                        <div className="relative size-[92px] shrink-0 overflow-hidden rounded-xl bg-[#e7e9eb]">
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
                                <div className="story-content mt-1 line-clamp-3 text-[12px] leading-[1.5] text-[#8f98a3]" dangerouslySetInnerHTML={{ __html: campaignStory }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
