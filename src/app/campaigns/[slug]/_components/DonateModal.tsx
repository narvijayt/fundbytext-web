"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import type { DonorPrefill } from "./CampaignDonateShell";
import { prefilledAmountRaw } from "./CampaignDonateShell";
import DonationSuccess, { type DonationSuccessData } from "./DonationSuccess";
import DonationFailed, { type DonationFailure } from "./DonationFailed";
import CountrySelect from "./CountrySelect";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const M = "/assets/marketing";

export type ModalParticipant = {
    id:                string;
    first_name:        string;
    last_name:         string;
    profile_photo_url: string | null;
};

type Props = {
    isOpen:                   boolean;
    onClose:                  () => void;
    onDonationSuccess?:       (amount: number) => void;
    campaignSlug:             string;
    campaignName:             string;
    campaignStory:            string | null;
    heroUrl:                  string | null;
    accent:                   string;
    /* Selected background-theme pattern (matches the marketing page bands). */
    patternImage?:            string | null;
    patternSize?:             string;
    patternCover?:            boolean;
    participants:             ModalParticipant[];
    targetMemberId:           string | null;
    donorPrefill?:            DonorPrefill | null;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    maxDonationCents:         number | null;
    daysLeft?:                number | null;
    /** Heading for the closed-state card (e.g. "Campaign ended", "Goal fully funded!"). */
    closedTitle?:             string;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const STRIPE_STYLE = {
    base: {
        fontSize: "15px",
        color: "#003060",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontWeight: "500",
        "::placeholder": { color: "#aeb5bd" },
    },
    invalid: { color: "#e2483d" },
} as const;

// ── Shared field bits ──────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
    return <span className="text-[11px] font-black uppercase leading-none tracking-[1px] text-[#003060]">{children}</span>;
}
const FIELD = "flex h-[52px] w-full items-center gap-3 rounded-xl border border-[#d4dee7] bg-white px-4 text-[15px] font-medium text-[#003060] placeholder:text-[#aeb5bd] focus-within:border-[#0278de] focus:outline-none";

function StripeField({ children, onFocusRequest }: { children: React.ReactNode; onFocusRequest?: () => void }) {
    // A Stripe field is an iframe centred in a padded box; clicking the padding
    // wouldn't focus it, so forward those clicks to the element (but let clicks
    // inside the iframe position the caret themselves).
    return (
        <div
            className={`${FIELD} cursor-text`}
            onMouseDown={onFocusRequest ? (e) => { if ((e.target as HTMLElement).tagName !== "IFRAME") { e.preventDefault(); onFocusRequest(); } } : undefined}
        >
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

// ── Donation form (inside Stripe Elements) ──────────────────────────────────────
type FormProps = {
    campaignSlug:     string;
    campaignName:     string;
    campaignStory:    string | null;
    heroUrl:          string | null;
    accent:           string;
    patternImage:     string | null;
    patternSize:      string;
    patternCover:     boolean;
    daysLeft:         number | null;
    participants:     ModalParticipant[];
    targetMember:     ModalParticipant | null;
    onClose:          () => void;
    onSuccess:        (data: DonationSuccessData) => void;
    onFailure:        (failure: DonationFailure, amount: number) => void;
    dirtyRef:         React.MutableRefObject<boolean>;
    donorPrefill?:    DonorPrefill | null;
    maxDonationCents: number | null;
};

function DonateForm({
    campaignSlug, campaignName, campaignStory, heroUrl, accent, patternImage, patternSize, patternCover, daysLeft,
    participants, targetMember, onClose, onSuccess, onFailure, dirtyRef, donorPrefill, maxDonationCents,
}: FormProps) {
    const stripe   = useStripe();
    const elements = useElements();

    const [raw,        setRaw]        = useState(() => prefilledAmountRaw(donorPrefill, maxDonationCents));
    // Donator identity (recorded against the donation) — separate from the name on
    // the card. Prefilled + locked when the donor came from an invite link.
    const [firstName,  setFirstName]  = useState(donorPrefill?.firstName ?? "");
    const [lastName,   setLastName]   = useState(donorPrefill?.lastName ?? "");
    const [holderName, setHolderName] = useState(donorPrefill ? `${donorPrefill.firstName} ${donorPrefill.lastName}`.trim() : "");
    const [country,    setCountry]    = useState("US");
    const [zip,        setZip]        = useState("");
    const [email,      setEmail]      = useState(donorPrefill?.email ?? "");
    const [phone,      setPhone]      = useState("");
    const [anonymous,  setAnonymous]  = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [attributedTo, setAttributedTo] = useState<string | null>(targetMember?.id ?? null);
    const [memberSearch, setMemberSearch] = useState("");
    const [attrOpen,   setAttrOpen]   = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    // Defer mounting the Stripe card iframes until just after the modal's enter
    // animation — creating them synchronously on open blocks the first frames and
    // makes the modal appear to "stick" before it animates in.
    const [cardReady,  setCardReady]  = useState(false);
    useEffect(() => { const t = setTimeout(() => setCardReady(true), 240); return () => clearTimeout(t); }, []);
    // Stripe card iframes can't be read back, so track whether the donor has typed
    // into any of them (flipped from each element's onChange below).
    const [cardTouched, setCardTouched] = useState(false);

    // "Dirty" = the donor has entered/changed anything that would be lost on close.
    // Snapshot the seed values once (so a realtime prop refresh, e.g. a changing
    // remaining-goal, can't make an untouched — incl. invite-prefilled — form look
    // dirty); such a form still closes freely on an outside click.
    const initial = useRef<{ raw: string; first: string; last: string; holder: string; email: string } | null>(null);
    initial.current ??= { raw, first: firstName, last: lastName, holder: holderName, email };
    const dirty =
        raw        !== initial.current.raw    ||
        firstName  !== initial.current.first  ||
        lastName   !== initial.current.last   ||
        holderName !== initial.current.holder ||
        email      !== initial.current.email  ||
        zip.trim() !== "" || phone.trim() !== "" ||
        anonymous || agreeTerms || cardTouched;
    // Expose to the parent (which owns the backdrop/Escape close handlers) via a ref
    // so a stray dismissal can be blocked without re-rendering on every keystroke.
    useEffect(() => { dirtyRef.current = dirty; }, [dirty, dirtyRef]);
    useEffect(() => () => { dirtyRef.current = false; }, [dirtyRef]);

    const cents = Math.round((parseFloat(raw) || 0) * 100);
    const exceedsMax = maxDonationCents !== null && cents > maxDonationCents;
    const lockedFirst = !!donorPrefill?.firstName;
    const lockedLast  = !!donorPrefill?.lastName;
    const lockedEmail = !!(donorPrefill?.email);
    const showAttribution = !targetMember && participants.length > 0;

    const filteredParticipants = participants.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(memberSearch.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cents < 100) { setError("Please enter at least $1."); return; }
        if (exceedsMax)  return;
        if (!firstName.trim() || !lastName.trim()) { setError("Please enter your first and last name."); return; }
        if (!zip.trim()) { setError("Please enter your ZIP / postal code."); return; }
        // Card holder name, email and phone are optional — the payment works without
        // them (email/phone only power the receipt + donation emails).
        if (!agreeTerms) { setTermsError(true); setError("Please accept the terms to continue."); return; }
        setTermsError(false);
        if (!stripe || !elements) return;
        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) { setError("Card details are not ready yet."); return; }

        setSubmitting(true);
        setError(null);

        // 1. Create the PaymentIntent with full donor info + attribution.
        let clientSecret: string;
        try {
            const res = await fetch("/api/v1/payments/intent", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_slug:     campaignSlug,
                    amount_cents:      cents,
                    member_id:         attributedTo ?? null,
                    campaign_donor_id: donorPrefill?.donorId ?? null,
                    donor_source:      donorPrefill && !donorPrefill.donorId ? "link_self" : null,
                    donor_first_name:  firstName.trim(),
                    donor_last_name:   lastName.trim(),
                    donor_email:       email || null,
                    donor_phone:       phone || null,
                    is_anonymous:      anonymous,
                    donor_country:     country,
                    donor_zip:         zip || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to start payment.");
            clientSecret = data.client_secret;
        } catch (err) {
            onFailure({ message: err instanceof Error ? err.message : "Something went wrong." }, parseFloat(raw) || 0);
            setSubmitting(false);
            return;
        }

        // 2. Confirm the card payment (Stripe handles 3-D Secure inline).
        const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumber,
                billing_details: {
                    name:  holderName.trim() || undefined,
                    email: email || undefined,
                    phone: phone || undefined,
                    address: { country, postal_code: zip || undefined },
                },
            },
            receipt_email: email || undefined,
        });

        if (stripeErr || paymentIntent?.status !== "succeeded") {
            onFailure({ code: stripeErr?.code ?? null, declineCode: stripeErr?.decline_code ?? null, message: stripeErr?.message ?? null }, parseFloat(raw) || 0);
            setSubmitting(false);
            return;
        }

        // 3. Record the donation (best-effort; webhook is the source of truth).
        const recordRes = await fetch("/api/v1/payments/record", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ payment_intent_id: paymentIntent.id }),
        }).catch(() => null);
        const recordJson = (await recordRes?.json().catch(() => ({}))) ?? {};
        const resolvedParticipant = targetMember ?? participants.find((p) => p.id === attributedTo) ?? null;
        onSuccess({
            amount:      parseFloat(raw) || 0,
            cardBrand:   recordJson.card_brand ?? null,
            cardLast4:   recordJson.card_last4 ?? null,
            receiptUrl:  recordJson.receipt_url ?? null,
            participant: resolvedParticipant,
        });
    }

    // ── Legal note + submit — rendered at the bottom of the form on desktop and
    //    between the summary and attribution when the modal is stacked. ──────────
    const submitBlock = (
        <div className="flex flex-col gap-4">
            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-[#C9261D]">{error}</p>}
            <p className="px-2 text-center text-[12px] leading-[1.6] text-[#aeb5bd]">
                Your donation is processed securely through Stripe. We never store your card details. A receipt is emailed
                to you as soon as the payment is confirmed.
            </p>
            <button type="submit" disabled={submitting || !stripe || cents < 100 || exceedsMax}
                className="flex h-[52px] w-full items-center justify-center rounded-2xl text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
                style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)", boxShadow: "0px 20px 40px -16px rgba(244,116,53,0.5)" }}>
                <span className="text-[13px] font-black uppercase tracking-[1px]">{submitting ? "Processing…" : cents >= 100 ? `Confirm & Donate ${fmt(cents / 100)}` : "Confirm and Donate"}</span>
            </button>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)]">
          {/* Inner scroll wrapper — the form clips to its rounded corners
              (overflow-hidden) so the scrollbar never spills past the radius. The
              bar shows on mobile like a normal scroll and is hidden on desktop. */}
          <div className="modal-scroll flex w-full flex-1 flex-col overflow-y-auto">
            {/* ── Blue header band — spans the full width; content stays in the left
                 column so the summary card can float over the band on desktop. ── */}
            <div
                className="relative shrink-0 overflow-hidden px-5 pt-5 pb-6 sm:px-8 lg:pb-[10px]"
                style={{
                    // Base accent gradient + two soft "halo" glows (color-dodge) that
                    // brighten the top-left and right, matching the Figma header.
                    backgroundImage: `radial-gradient(58% 190% at 6% -34%, rgba(158,208,255,0.55), rgba(158,208,255,0) 60%), radial-gradient(50% 200% at 98% 128%, rgba(158,208,255,0.5), rgba(158,208,255,0) 58%), linear-gradient(150deg, ${accent} 0%, ${accent} 58%, color-mix(in srgb, ${accent} 80%, #000) 128%)`,
                    backgroundBlendMode: "color-dodge, color-dodge, normal",
                }}
            >
                {/* Selected background-theme pattern — same watermark treatment as the
                    marketing hero band, so the modal reflects the campaign's theme. */}
                {(patternImage ?? `${M}/leaderboard/bg-pattern.png`) && (
                    <div
                        aria-hidden
                        className={`pointer-events-none absolute inset-0 ${patternCover ? "opacity-[0.16]" : "opacity-[0.12]"}`}
                        style={{
                            backgroundImage: `url('${patternImage ?? `${M}/leaderboard/bg-pattern.png`}')`,
                            backgroundRepeat: patternCover ? "no-repeat" : "repeat",
                            backgroundSize: patternImage ? patternSize : "cover",
                            backgroundPosition: patternCover ? "center" : undefined,
                        }}
                    />
                )}
                <div className="relative lg:pr-[344px]">
                    <div className="flex items-center gap-2.5">
                        {targetMember && (
                            <span className="size-9 shrink-0 overflow-hidden rounded-full bg-white/25 ring-2 ring-white/50">
                                {targetMember.profile_photo_url
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={targetMember.profile_photo_url} alt="" className="size-full object-cover" />
                                    : <span className="flex size-full items-center justify-center font-bold text-white">{targetMember.first_name.charAt(0)}</span>}
                            </span>
                        )}
                        <h2 className="text-[18px] font-black leading-[1.2] text-white sm:text-[21px]">
                            {targetMember ? `Donate to ${targetMember.first_name} ${targetMember.last_name}'s Campaign` : "Donate to this campaign"}
                        </h2>
                    </div>

                    {/* Amount */}
                    <div className="mt-4">
                        <label className={`flex h-[52px] w-full cursor-text items-center gap-2.5 rounded-xl bg-white pl-4 pr-4 ${exceedsMax ? "ring-2 ring-red-400" : ""}`}>
                            <span className="text-[18px] font-black text-[#003060]">$</span>
                            <span className="h-6 w-px shrink-0 bg-[#d4dee7]" />
                            <input
                                type="text" inputMode="decimal" placeholder="0.00" value={raw} autoFocus autoComplete="off"
                                onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setRaw(v); }}
                                className="min-w-0 flex-1 bg-transparent text-[18px] font-black text-[#003060] placeholder:font-medium placeholder:text-[#aeb5bd] focus:outline-none"
                            />
                            {maxDonationCents !== null && maxDonationCents > 0 && (
                                <button type="button" onClick={() => setRaw(String(maxDonationCents / 100))} className="shrink-0 text-[12px] font-bold text-[#0268c0] hover:underline">Max {fmt(maxDonationCents / 100)}</button>
                            )}
                        </label>
                        {exceedsMax && <p className="mt-1 text-[12px] font-medium text-red-200">Exceeds remaining goal of {fmt(maxDonationCents! / 100)}</p>}
                    </div>

                    {/* Pay With + card brands */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-[17px] font-black text-white sm:text-[19px]">Pay With</p>
                        <div className="flex items-center gap-2.5">
                            {["visa", "mastercard", "paypal", "jcb", "swift"].map((b) => (
                                <Image key={b} src={`${M}/footer/${b}.svg`} alt={b} width={32} height={32} className="size-6 sm:size-7" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body — two columns on desktop, stacked below ── */}
            <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
                {/* LEFT — the form */}
                <div className="flex min-w-0 flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-1">
                    {/* Card Option + Card Number */}
                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="flex flex-col gap-2.5 sm:w-[184px] sm:shrink-0">
                            <FieldLabel>Card Option</FieldLabel>
                            {/* Only one payment method today, so this is a static
                                indicator (no dropdown affordance) rather than a select. */}
                            <div className={`${FIELD} cursor-default gap-2 bg-[#f8fafc] text-[14px]`}>
                                <Image src={`${M}/footer/mastercard.svg`} alt="" width={24} height={24} className="size-5 shrink-0" />
                                <span className="truncate whitespace-nowrap">Credit / Debit</span>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <FieldLabel>Card Number</FieldLabel>
                            <StripeField onFocusRequest={() => elements?.getElement(CardNumberElement)?.focus()}>{cardReady ? <CardNumberElement options={{ style: STRIPE_STYLE, placeholder: "0123 4567 8910 1112" }} onChange={(e) => { if (!e.empty) setCardTouched(true); if (e.complete) elements?.getElement(CardExpiryElement)?.focus(); }} /> : <span className="text-[#aeb5bd]">0123 4567 8910 1112</span>}</StripeField>
                        </div>
                    </div>

                    {/* Expiration + CVV */}
                    <div className="flex gap-3 sm:gap-5">
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <FieldLabel>Expiration</FieldLabel>
                            <StripeField onFocusRequest={() => elements?.getElement(CardExpiryElement)?.focus()}>{cardReady ? <CardExpiryElement options={{ style: STRIPE_STYLE }} onChange={(e) => { if (!e.empty) setCardTouched(true); if (e.complete) elements?.getElement(CardCvcElement)?.focus(); }} /> : <span className="text-[#aeb5bd]">MM / YY</span>}</StripeField>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <FieldLabel>CVV</FieldLabel>
                            <StripeField onFocusRequest={() => elements?.getElement(CardCvcElement)?.focus()}>{cardReady ? <CardCvcElement options={{ style: STRIPE_STYLE }} onChange={(e) => { if (!e.empty) setCardTouched(true); }} /> : <span className="text-[#aeb5bd]">CVC</span>}</StripeField>
                        </div>
                    </div>

                    {/* Card Holder Name */}
                    <div className="flex flex-col gap-2.5">
                        <FieldLabel>Card Holder Name</FieldLabel>
                        <input type="text" value={holderName} placeholder="Full name on card"
                            onChange={(e) => setHolderName(e.target.value)} className={FIELD} />
                    </div>

                    {/* Location + ZIP */}
                    <div className="flex gap-3 sm:gap-5">
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <FieldLabel>Location</FieldLabel>
                            <CountrySelect value={country} onChange={setCountry} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                            <FieldLabel>ZIP</FieldLabel>
                            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" maxLength={10} className={FIELD} />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2.5">
                        <FieldLabel>Email</FieldLabel>
                        <input type="email" value={email} readOnly={lockedEmail} placeholder="Enter a valid email address"
                            onChange={(e) => !lockedEmail && setEmail(e.target.value)}
                            className={`${FIELD} ${lockedEmail ? "bg-[#f4f8f9] text-[#8f98a3]" : ""}`} />
                        <p className="flex items-center gap-1.5 text-[12px] text-[#8f98a3]">
                            <svg className="size-3.5 shrink-0 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Optional — we&rsquo;ll email your donation receipt to this address.
                        </p>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2.5">
                        <FieldLabel>Phone</FieldLabel>
                        <label className={`${FIELD} cursor-text`}>
                            <span className="text-[15px] font-medium text-[#8f98a3]">+1</span>
                            <span className="h-6 w-px bg-[#d4dee7]" />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(214) 987-6543" className="min-w-0 flex-1 bg-transparent focus:outline-none" />
                        </label>
                    </div>

                    {/* Donator name */}
                    <div className="flex flex-col gap-2.5">
                        <FieldLabel>Donator</FieldLabel>
                        <div className="flex gap-3 sm:gap-5">
                            <input type="text" value={firstName} readOnly={lockedFirst} placeholder="First Name"
                                onChange={(e) => !lockedFirst && setFirstName(e.target.value)}
                                className={`${FIELD} ${lockedFirst ? "bg-[#f4f8f9] text-[#8f98a3]" : ""}`} />
                            <input type="text" value={lastName} readOnly={lockedLast} placeholder="Last Name"
                                onChange={(e) => !lockedLast && setLastName(e.target.value)}
                                className={`${FIELD} ${lockedLast ? "bg-[#f4f8f9] text-[#8f98a3]" : ""}`} />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col gap-4 border-t border-[#e7e9eb] pt-5">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-4 shrink-0 rounded-[4px] accent-[#0268c0]" />
                            <span className="text-[13px] text-[#57728d]">Please keep my name anonymous on the campaign.</span>
                        </label>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={agreeTerms} onChange={(e) => { setAgreeTerms(e.target.checked); if (e.target.checked) setTermsError(false); }} className={`mt-0.5 size-4 shrink-0 rounded-[4px] accent-[#0268c0] ${termsError ? "ring-2 ring-red-400 ring-offset-1" : ""}`} />
                            <span className={`text-[13px] leading-[1.5] ${termsError ? "text-[#C9261D]" : "text-[#57728d]"}`}>By signing up, you confirm that you agree to FundByText&apos;s <Link href="/terms" className="text-[#0268c0] underline">Terms of Service</Link> and acknowledge our <Link href="/privacy" className="text-[#0268c0] underline">Privacy Policy</Link>.</span>
                        </label>
                    </div>

                    {/* Legal + submit (desktop position) */}
                    <div className="mt-auto hidden lg:block">{submitBlock}</div>
                </div>

                {/* RIGHT — summary + attribution (stacked below the form on tablet/mobile) */}
                <div className="flex shrink-0 flex-col gap-4 px-5 pb-6 sm:px-8 lg:w-[344px] lg:py-0 lg:pl-0 lg:pr-6">
                    {/* Summary card — floats over the blue band on desktop. `relative`
                        so the whole white card (not just the positioned hero image)
                        paints on top of the positioned blue header it overlaps. */}
                    <div className="relative flex flex-col rounded-2xl bg-white p-4 shadow-[0px_16px_40px_-16px_rgba(0,48,96,0.22)] ring-1 ring-[#eef1f6] lg:-mt-[64px]">
                        <div className="relative h-[164px] shrink-0 overflow-hidden rounded-[12px] bg-[#e7e9eb]">
                            {heroUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={heroUrl} alt={campaignName} className="size-full object-cover" />
                            )}
                            {daysLeft != null && (
                                <span className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur">
                                    <span className="size-1.5 rounded-full bg-[#f47435]" />
                                    <span className="text-[12px] font-bold text-[#003060]">{daysLeft} Days</span>
                                </span>
                            )}
                        </div>
                        <p className="mt-3.5 text-[16px] font-black leading-[1.25] text-[#003060]">{campaignName}</p>
                        {campaignStory && (
                            <div className="story-content mt-1.5 line-clamp-3 text-[13px] leading-[1.5] text-[#8f98a3]" dangerouslySetInnerHTML={{ __html: campaignStory }} />
                        )}

                        {/* Donation details */}
                        <div className="mt-4 border-t border-[#e7e9eb] pt-4">
                            <p className="text-[15px] font-black text-[#003060]">Donation Details</p>
                            <div className="mt-3.5 flex items-center justify-between text-[14px]">
                                <span className="font-medium text-[#8f98a3]">Your donation</span>
                                <span className="font-semibold text-[#8f98a3]">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                            </div>
                        </div>
                        <div className="mt-3.5 flex items-center justify-between border-t border-[#e7e9eb] pt-3.5">
                            <span className="text-[15px] font-black text-[#003060]">Total due today</span>
                            <span className="text-[18px] font-black text-[#003060]">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                        </div>
                    </div>

                    {/* Legal + submit (stacked position — between summary and attribution) */}
                    <div className="lg:hidden">{submitBlock}</div>

                    {/* Attribution card */}
                    {showAttribution && (
                        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-[0px_16px_40px_-16px_rgba(0,48,96,0.22)] ring-1 ring-[#eef1f6]">
                            <button type="button" onClick={() => setAttrOpen((o) => !o)} className="flex items-center justify-between gap-3 text-left">
                                <span className="text-[12px] font-black uppercase tracking-[1px] text-[#003060]">Donation Attribution</span>
                                <svg className={`size-5 shrink-0 text-[#8f98a3] transition-transform ${attrOpen ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                            {attrOpen && (
                                <>
                                    <p className="mt-2 text-[14px] leading-[1.4] text-[#003060]">Which Participant would you like to attribute this to?</p>
                                    <button type="button" onClick={() => setAttributedTo(null)}
                                        className="mt-3.5 flex items-center gap-2.5 rounded-full px-2.5 py-2 text-[14px] font-bold transition-colors"
                                        style={{ background: attributedTo === null ? accent : "#eef2f7", color: attributedTo === null ? "#fff" : "#003060" }}>
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">
                                            <svg className="size-4 text-[#0268c0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                                        </span>
                                        General Fund
                                    </button>
                                    {participants.length > 4 && (
                                        <div className="relative mt-2.5">
                                            <svg className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#aeb5bd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                                            <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search Participant"
                                                className="w-full rounded-xl border border-[#d4dee7] py-2.5 pl-10 pr-3 text-[13px] text-[#003060] placeholder:text-[#aeb5bd] focus:border-[#0278de] focus:outline-none" />
                                        </div>
                                    )}
                                    <ul className="mt-2.5 flex max-h-[232px] flex-col gap-1 overflow-y-auto [scrollbar-width:thin]">
                                        {filteredParticipants.map((p) => {
                                            const sel = attributedTo === p.id;
                                            return (
                                                <li key={p.id}>
                                                    <button type="button" onClick={() => setAttributedTo(p.id)}
                                                        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-[14px] font-medium transition-colors ${sel ? "" : "text-[#57728d] hover:bg-[#f4f6fa]"}`}
                                                        style={sel ? { background: `${accent}14`, color: accent } : undefined}>
                                                        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef2f7]">
                                                            {p.profile_photo_url
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                ? <img src={p.profile_photo_url} alt="" className="size-full object-cover" />
                                                                : <span className="text-[12px] font-bold uppercase text-[#8f98a3]">{p.first_name.charAt(0)}{p.last_name.charAt(0)}</span>}
                                                        </span>
                                                        <span className="flex-1 truncate text-left">{p.first_name} {p.last_name}</span>
                                                        {sel && <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </form>
    );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function DonateModal({
    isOpen, onClose, onDonationSuccess,
    campaignSlug, campaignName, campaignStory, heroUrl,
    accent, patternImage = null, patternSize = "", patternCover = false,
    participants, targetMemberId, donorPrefill,
    donationsEnabled, donationsDisabledMessage, maxDonationCents, daysLeft = null, closedTitle,
}: Props) {
    const [successData, setSuccessData] = useState<DonationSuccessData | null>(null);
    // A payment failure swaps the form for the failure screen. The form stays
    // mounted (hidden) underneath so "Try Again" keeps everything the donor typed.
    const [failureData, setFailureData] = useState<{ failure: DonationFailure; amount: number } | null>(null);
    // Only treat it as an outside-click when the press *started* on the backdrop,
    // so selecting text inside an input and releasing on the backdrop won't close.
    const downOnBackdrop = useRef(false);
    // Set by the form while the donor has entered anything (card fields included).
    // Used to block a stray outside-click / Escape from discarding a started form.
    const dirtyRef = useRef(false);
    const [nudge, setNudge] = useState(false);
    const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const targetMember = targetMemberId ? (participants.find((p) => p.id === targetMemberId) ?? null) : null;

    // Enter/exit animation (same pattern as the other modals): keep mounted through
    // the exit transition, and only flip `shown` after the mount paints so the enter
    // transition plays. The success→form reset happens after the exit completes so
    // the closing view doesn't flash back to the form.
    const [render, setRender] = useState(isOpen);
    const [shown,  setShown]  = useState(false);
    useEffect(() => {
        if (isOpen) { setRender(true); return; }
        setShown(false);
        const t = setTimeout(() => { setRender(false); setSuccessData(null); setFailureData(null); }, 200);
        return () => clearTimeout(t);
    }, [isOpen]);
    useEffect(() => {
        if (!render || !isOpen) return;
        const raf = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(raf);
    }, [render, isOpen]);

    const handleClose = () => onClose();

    // Quick-dismiss (outside click / Escape). If the donor has started filling the
    // form, protect it: nudge the modal instead of closing so an accidental click
    // can't wipe their card + details. The ✕ button still closes outright.
    const tryDismiss = () => {
        if (dirtyRef.current && !successData && !failureData) {
            setNudge(true);
            if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
            nudgeTimer.current = setTimeout(() => setNudge(false), 450);
            return;
        }
        handleClose();
    };
    // Keep the latest tryDismiss reachable from the (stable) key listener.
    const tryDismissRef = useRef(tryDismiss);
    tryDismissRef.current = tryDismiss;

    // Key scroll-lock on the mount lifetime (`render`), not `isOpen`, so the page
    // stays locked through the exit animation while the modal is still visible.
    useEffect(() => { document.body.style.overflow = render ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [render]);
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") tryDismissRef.current(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, []);

    if (!render) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-opacity duration-200 ease-out motion-reduce:transition-none sm:p-6 ${shown ? "opacity-100" : "opacity-0"}`} style={{ background: "rgba(0,30,60,0.55)", backdropFilter: "blur(3px)" }} onMouseDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }} onClick={(e) => { if (downOnBackdrop.current && e.target === e.currentTarget) tryDismiss(); }}>
            <div className={`relative w-full max-w-[940px] transition-all duration-200 ease-out motion-reduce:transition-none ${nudge ? "modal-nudge" : ""} ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`} onClick={(e) => e.stopPropagation()}>
                {/* Close — top-right (form state; the success/failure views carry their own). */}
                {donationsEnabled && !successData && !failureData && (
                    <button type="button" onClick={handleClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center text-white transition-opacity hover:opacity-70">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {!donationsEnabled ? (
                    <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-10 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-amber-100">
                                <svg className="size-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="mb-2 text-xl font-extrabold text-gray-900">{closedTitle || "Donations Paused"}</h3>
                            <p className="mb-8 text-sm text-gray-500">{donationsDisabledMessage?.trim() || "This campaign is temporarily not accepting donations. Please check back soon."}</p>
                            <button onClick={handleClose} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50">Close</button>
                        </div>
                    </div>
                ) : !successData ? (
                    <>
                        {/* The form stays mounted (hidden) while the failure screen shows, so
                            the Stripe card fields + entered details survive a "Try Again". */}
                        <div className={failureData ? "hidden" : "contents"}>
                            <Elements stripe={stripePromise}>
                                <DonateForm
                                    campaignSlug={campaignSlug} campaignName={campaignName} campaignStory={campaignStory}
                                    heroUrl={heroUrl} accent={accent} patternImage={patternImage} patternSize={patternSize} patternCover={patternCover}
                                    daysLeft={daysLeft} participants={participants} targetMember={targetMember}
                                    onClose={handleClose}
                                    onSuccess={(data) => { setSuccessData(data); onDonationSuccess?.(data.amount); }}
                                    onFailure={(f, amt) => setFailureData({ failure: f, amount: amt })}
                                    dirtyRef={dirtyRef}
                                    donorPrefill={donorPrefill} maxDonationCents={maxDonationCents}
                                />
                            </Elements>
                        </div>
                        {failureData && (
                            <div className="mx-auto w-full max-w-[460px]">
                                <DonationFailed
                                    amount={failureData.amount}
                                    accent={accent} patternImage={patternImage} patternSize={patternSize} patternCover={patternCover}
                                    failure={failureData.failure}
                                    onRetry={() => setFailureData(null)}
                                    onClose={handleClose}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mx-auto w-full max-w-[460px]">
                        <DonationSuccess {...successData} campaignSlug={campaignSlug} campaignName={campaignName} campaignStory={campaignStory} heroUrl={heroUrl} accent={accent} patternImage={patternImage} patternSize={patternSize} patternCover={patternCover} daysLeft={daysLeft} onClose={handleClose} />
                    </div>
                )}
            </div>
        </div>
    );
}
