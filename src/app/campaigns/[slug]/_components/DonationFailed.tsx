"use client";

import Image from "next/image";

const M = "/assets/marketing";
const C = "/assets/campaigns";

/* What Stripe (or our own intent route) told us went wrong. `code` /
   `declineCode` come from stripe.confirmCardPayment's error; `message` is the
   raw fallback used when we have no recognised code. */
export type DonationFailure = {
    code?:        string | null;
    declineCode?: string | null;
    message?:     string | null;
};

type Props = {
    amount:        number;             // dollars attempted
    accent:        string;             // kept for API parity with the success screen
    patternImage?: string | null;
    patternSize?:  string;
    patternCover?: boolean;
    failure:       DonationFailure;
    onRetry:       () => void;
    onClose?:      () => void;
};

const RED = "#E5484D";

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/* Map a Stripe decline/error code onto a plain-language reason + next step.
   We prefer decline_code (the bank's reason) over the higher-level code. */
function describe(f: DonationFailure): { title: string; detail: string } {
    const key = (f.declineCode || f.code || "").toLowerCase();
    const MAP: Record<string, [string, string]> = {
        insufficient_funds:  ["Insufficient funds", "Your card doesn’t have enough available funds for this donation. Try a different card."],
        card_declined:       ["Card declined", "Your bank declined this payment. Try another card, or contact your bank."],
        generic_decline:     ["Card declined", "Your bank declined this payment. Try another card, or contact your bank."],
        do_not_honor:        ["Card declined", "Your bank declined this payment. Try another card, or contact your bank."],
        transaction_not_allowed: ["Card not supported", "This card can’t be used for this payment. Please try a different card."],
        lost_card:           ["Card declined", "This card can’t be used. Please try a different card."],
        stolen_card:         ["Card declined", "This card can’t be used. Please try a different card."],
        expired_card:        ["Card expired", "This card has expired. Please try a different card."],
        incorrect_cvc:       ["Incorrect security code", "The card’s security code (CVC) looks wrong. Please check it and try again."],
        invalid_cvc:         ["Incorrect security code", "The card’s security code (CVC) looks wrong. Please check it and try again."],
        incorrect_number:    ["Invalid card number", "The card number looks wrong. Please check it and try again."],
        invalid_number:      ["Invalid card number", "The card number looks wrong. Please check it and try again."],
        incorrect_zip:       ["Billing ZIP mismatch", "The billing ZIP / postal code doesn’t match your card. Please check it and try again."],
        processing_error:    ["Processing error", "Something went wrong while processing your card. Please try again in a moment."],
        payment_intent_authentication_failure: ["Verification failed", "We couldn’t verify this payment with your bank. Please try again, or use another card."],
        authentication_required: ["Verification needed", "Your bank needs to verify this payment. Please try again and complete the verification."],
        api_connection_error: ["Connection problem", "We couldn’t reach the payment network. Check your connection and try again."],
    };
    if (key && MAP[key]) return { title: MAP[key][0], detail: MAP[key][1] };
    return { title: "Payment unsuccessful", detail: f.message?.trim() || "We couldn’t process your payment. Please try again." };
}

export default function DonationFailed({
    amount, patternImage = null, patternSize = "", patternCover = false, failure, onRetry, onClose,
}: Props) {
    const { title, detail } = describe(failure);
    const pat = patternImage ?? `${M}/leaderboard/bg-pattern.png`;

    return (
        <div className="modal-scroll flex max-h-[92dvh] flex-col overflow-y-auto overflow-x-hidden rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)]">
            {/* ── Themed header band — red gradient + centred color-dodge halo, with the
                 campaign's theme pattern as a watermark (mirrors the success screen). ── */}
            <div
                className="relative shrink-0 overflow-hidden px-6 pt-9 pb-8 text-center sm:px-8"
                style={{
                    backgroundImage: `radial-gradient(58% 72% at 50% 16%, rgba(255,205,196,0.55), rgba(255,205,196,0) 62%), linear-gradient(160deg, ${RED} 0%, ${RED} 52%, color-mix(in srgb, ${RED} 72%, #000) 120%)`,
                    backgroundBlendMode: "color-dodge, normal",
                }}
            >
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 ${patternCover ? "opacity-[0.14]" : "opacity-[0.10]"}`}
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

                {/* Fail mark — frosted-gray circle + red ring/cross (mirrors the success check) */}
                <div className="relative flex items-center justify-center">
                    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f2f2f2] to-[#dde0e3]">
                        <Image src={`${C}/payment-failed.svg`} alt="" width={60} height={60} className="size-[72%]" />
                    </span>
                </div>

                <h2 className="relative mt-4 text-[22px] font-black leading-[1.2] text-white sm:text-[25px]">
                    Payment Unsuccessful
                </h2>
                <p className="relative mt-2 text-[13px] text-white/85 sm:text-[14px]">Don’t worry — you haven’t been charged. Please try again.</p>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col gap-4 p-5 sm:gap-5 sm:p-6">
                {/* What went wrong */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#f6d6d6] bg-[#fdf4f4] p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fbe4e4]">
                        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                    </span>
                    <div className="min-w-0">
                        <p className="text-[14px] font-black text-[#c0362f]">{title}</p>
                        <p className="mt-0.5 text-[13px] leading-[1.5] text-[#a56b68]">{detail}</p>
                    </div>
                </div>

                {amount > 0 && (
                    <div className="flex items-center justify-between rounded-2xl border border-[#e7e9eb] px-5 py-3.5 text-[14px]">
                        <span className="text-[#aeb5bd]">Amount attempted</span>
                        <span className="font-semibold text-[#003060]">{fmtUSD(amount)}</span>
                    </div>
                )}

                {/* Try again */}
                <button type="button" onClick={onRetry}
                    className="flex h-[52px] w-full items-center justify-center rounded-2xl text-white transition hover:brightness-105 active:scale-[0.99]"
                    style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)", boxShadow: "0px 20px 40px -16px rgba(244,116,53,0.5)" }}>
                    <span className="text-[13px] font-black uppercase tracking-[1px]">Try Again</span>
                </button>

                {onClose && (
                    <button type="button" onClick={onClose} className="mx-auto text-[13px] font-bold text-[#8f98a3] transition-colors hover:text-[#003060]">
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
