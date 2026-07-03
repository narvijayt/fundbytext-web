"use client";

import { useEffect, useState } from "react";
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
    participants:             ModalParticipant[];
    targetMemberId:           string | null;
    donorPrefill?:            DonorPrefill | null;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    maxDonationCents:         number | null;
    daysLeft?:                number | null;
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const COUNTRIES: { code: string; label: string }[] = [
    { code: "US", label: "United States" }, { code: "CA", label: "Canada" }, { code: "GB", label: "United Kingdom" },
    { code: "AU", label: "Australia" }, { code: "IN", label: "India" }, { code: "DE", label: "Germany" },
    { code: "FR", label: "France" }, { code: "MX", label: "Mexico" }, { code: "BR", label: "Brazil" },
];

const STRIPE_STYLE = {
    base: {
        fontSize: "16px",
        color: "#003060",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontWeight: "500",
        "::placeholder": { color: "#aeb5bd" },
    },
    invalid: { color: "#e2483d" },
} as const;

// ── Shared field bits ──────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
    return <span className="text-[12px] font-black uppercase leading-none tracking-[1px] text-[#003060]">{children}</span>;
}
const FIELD = "flex h-14 w-full items-center gap-3 rounded-xl border border-[#d4dee7] bg-white px-5 text-[16px] font-medium text-[#003060] placeholder:text-[#aeb5bd] focus-within:border-[#0278de] focus:outline-none";

function StripeField({ children }: { children: React.ReactNode }) {
    return <div className={FIELD}><div className="flex-1 min-w-0">{children}</div></div>;
}

// ── Donation form (inside Stripe Elements) ──────────────────────────────────────
type FormProps = {
    campaignSlug:     string;
    campaignName:     string;
    campaignStory:    string | null;
    heroUrl:          string | null;
    accent:           string;
    daysLeft:         number | null;
    participants:     ModalParticipant[];
    targetMember:     ModalParticipant | null;
    onClose:          () => void;
    onSuccess:        (data: DonationSuccessData) => void;
    donorPrefill?:    DonorPrefill | null;
    maxDonationCents: number | null;
};

function DonateForm({
    campaignSlug, campaignName, campaignStory, heroUrl, accent, daysLeft,
    participants, targetMember, onClose, onSuccess, donorPrefill, maxDonationCents,
}: FormProps) {
    const stripe   = useStripe();
    const elements = useElements();

    const [raw,        setRaw]        = useState(() => prefilledAmountRaw(donorPrefill, maxDonationCents));
    const [holderName, setHolderName] = useState(donorPrefill ? `${donorPrefill.firstName} ${donorPrefill.lastName}`.trim() : "");
    const [country,    setCountry]    = useState("US");
    const [zip,        setZip]        = useState("");
    const [email,      setEmail]      = useState(donorPrefill?.email ?? "");
    const [phone,      setPhone]      = useState("");
    const [anonymous,  setAnonymous]  = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [attributedTo, setAttributedTo] = useState<string | null>(targetMember?.id ?? null);
    const [memberSearch, setMemberSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    const cents = Math.round((parseFloat(raw) || 0) * 100);
    const exceedsMax = maxDonationCents !== null && cents > maxDonationCents;
    const lockedName  = !!donorPrefill;
    const lockedEmail = !!(donorPrefill?.email);

    const filteredParticipants = participants.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(memberSearch.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cents < 100) { setError("Please enter at least $1."); return; }
        if (exceedsMax)  return;
        const nameParts = holderName.trim().split(/\s+/);
        if (nameParts.length < 2) { setError("Please enter the full name on the card (first and last)."); return; }
        if (!email && !phone) { setError("Please provide at least an email or phone number."); return; }
        if (!agreeTerms) { setError("Please accept the terms to continue."); return; }
        if (!stripe || !elements) return;
        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) { setError("Card details are not ready yet."); return; }

        setSubmitting(true);
        setError(null);

        const firstName = nameParts[0];
        const lastName  = nameParts.slice(1).join(" ");

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
                    donor_first_name:  firstName,
                    donor_last_name:   lastName,
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
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSubmitting(false);
            return;
        }

        // 2. Confirm the card payment (Stripe handles 3-D Secure inline).
        const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumber,
                billing_details: {
                    name:  holderName.trim(),
                    email: email || undefined,
                    phone: phone || undefined,
                    address: { country, postal_code: zip || undefined },
                },
            },
            receipt_email: email || undefined,
        });

        if (stripeErr || paymentIntent?.status !== "succeeded") {
            setError(stripeErr?.message ?? "Payment failed. Please try again.");
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

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-[1100px] max-h-[92vh] flex-col overflow-y-auto rounded-3xl bg-white shadow-[0px_40px_80px_-20px_rgba(0,48,96,0.45)] lg:flex-row lg:overflow-hidden">
            {/* ── Left column (form) ── */}
            <div className="flex min-w-0 flex-col lg:flex-1 lg:overflow-y-auto">
                {/* Blue header band — title + amount + Pay With */}
                <div className="relative shrink-0 overflow-hidden px-6 pt-6 pb-7 sm:px-9" style={{ background: `linear-gradient(150deg, ${accent} 0%, ${accent} 60%, color-mix(in srgb, ${accent} 75%, #000) 130%)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${M}/leaderboard/bg-pattern.png`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.12] pointer-events-none" />
                    <div className="relative flex items-center gap-3">
                        {targetMember && (
                            <span className="size-9 shrink-0 overflow-hidden rounded-full bg-white/20">
                                {targetMember.profile_photo_url
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={targetMember.profile_photo_url} alt="" className="size-full object-cover" />
                                    : <span className="flex size-full items-center justify-center font-bold text-white">{targetMember.first_name.charAt(0)}</span>}
                            </span>
                        )}
                        <h2 className="text-[22px] font-black leading-[1.2] text-white">
                            {targetMember ? `Donate to ${targetMember.first_name} ${targetMember.last_name}'s Campaign` : "Donate to this campaign"}
                        </h2>
                    </div>

                    {/* Amount */}
                    <div className="relative mt-5">
                        <div className={`flex h-14 w-full items-center gap-2 rounded-xl border bg-white px-5 ${exceedsMax ? "border-red-400" : "border-white/40"}`}>
                            <span className="text-[20px] font-black text-[#003060]">$</span>
                            <input
                                type="text" inputMode="decimal" placeholder="0.00" value={raw} autoFocus autoComplete="off"
                                onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setRaw(v); }}
                                className="min-w-0 flex-1 bg-transparent text-[20px] font-black text-[#003060] placeholder:text-[#aeb5bd] focus:outline-none"
                            />
                            {maxDonationCents !== null && maxDonationCents > 0 && (
                                <button type="button" onClick={() => setRaw(String(maxDonationCents / 100))} className="shrink-0 text-[12px] font-bold text-[#0268c0] hover:underline">Max {fmt(maxDonationCents / 100)}</button>
                            )}
                        </div>
                        {exceedsMax && <p className="mt-1 text-[12px] font-medium text-red-200">Exceeds remaining goal of {fmt(maxDonationCents! / 100)}</p>}
                    </div>

                    {/* Pay With + card brands */}
                    <div className="relative mt-5 flex items-end justify-between gap-3">
                        <p className="text-[20px] font-black text-white">Pay With</p>
                        <div className="flex items-center gap-3">
                            {["visa", "mastercard", "paypal", "jcb", "swift"].map((b) => (
                                <Image key={b} src={`${M}/footer/${b}.svg`} alt={b} width={32} height={32} className="size-7 sm:size-8" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* White card form */}
                <div className="flex flex-col gap-6 px-6 py-7 sm:px-9">
                    {/* Card Option + Card Number */}
                    <div className="flex flex-col gap-6 sm:flex-row">
                        <div className="flex flex-col gap-3 sm:w-[210px] sm:shrink-0">
                            <FieldLabel>Card Option</FieldLabel>
                            <div className={`${FIELD} justify-between cursor-default`}>
                                <span className="flex items-center gap-2.5 text-[15px]">
                                    <Image src={`${M}/footer/mastercard.svg`} alt="" width={24} height={24} className="size-6" />
                                    Credit / Debit
                                </span>
                                <svg className="size-4 text-[#aeb5bd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <FieldLabel>Card Number</FieldLabel>
                            <StripeField><CardNumberElement options={{ style: STRIPE_STYLE, placeholder: "0123 4567 8910 1112" }} /></StripeField>
                        </div>
                    </div>

                    {/* Expiration + CVV */}
                    <div className="flex gap-6">
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <FieldLabel>Expiration</FieldLabel>
                            <StripeField><CardExpiryElement options={{ style: STRIPE_STYLE }} /></StripeField>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <FieldLabel>CVV</FieldLabel>
                            <StripeField><CardCvcElement options={{ style: STRIPE_STYLE }} /></StripeField>
                        </div>
                    </div>

                    {/* Card Holder Name */}
                    <div className="flex flex-col gap-3">
                        <FieldLabel>Card Holder Name</FieldLabel>
                        <input type="text" value={holderName} readOnly={lockedName} placeholder="Full name on card"
                            onChange={(e) => !lockedName && setHolderName(e.target.value)}
                            className={`${FIELD} ${lockedName ? "bg-[#f4f8f9] text-[#8f98a3]" : ""}`} />
                    </div>

                    {/* Location + ZIP */}
                    <div className="flex gap-6">
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <FieldLabel>Location</FieldLabel>
                            <div className={`${FIELD} relative p-0`}>
                                <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-full w-full appearance-none bg-transparent px-5 pr-10 text-[16px] font-medium text-[#003060] focus:outline-none">
                                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                                </select>
                                <svg className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#aeb5bd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <FieldLabel>ZIP</FieldLabel>
                            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" maxLength={10} className={FIELD} />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-3">
                        <FieldLabel>Email</FieldLabel>
                        <input type="email" value={email} readOnly={lockedEmail} placeholder="your@email.com"
                            onChange={(e) => !lockedEmail && setEmail(e.target.value)}
                            className={`${FIELD} ${lockedEmail ? "bg-[#f4f8f9] text-[#8f98a3]" : ""}`} />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-3">
                        <FieldLabel>Phone</FieldLabel>
                        <div className={FIELD}>
                            <span className="text-[16px] font-medium text-[#8f98a3]">+1</span>
                            <span className="h-7 w-px bg-[#d4dee7]" />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(214) 761-6542" className="min-w-0 flex-1 bg-transparent focus:outline-none" />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col gap-[18px] border-y border-[#e7e9eb] py-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-[17px] shrink-0 rounded-[3px] accent-[#0268c0]" />
                            <span className="text-[14px] text-[#57728d]">Please keep my name anonymous on the campaign.</span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 size-[17px] shrink-0 rounded-[3px] accent-[#0268c0]" required />
                            <span className="text-[14px] text-[#57728d]">By placing this donation you agree to FundbyText&apos;s <Link href="/terms" className="text-[#0268c0] underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#0268c0] underline">Privacy Policy</Link>.</span>
                        </label>
                    </div>

                    {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[14px] text-[#C9261D]">{error}</p>}

                    <button type="submit" disabled={submitting || !stripe || cents < 100 || exceedsMax}
                        className="flex h-14 w-full items-center justify-center rounded-2xl text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
                        style={{ background: "linear-gradient(180deg, #F47435 0%, #EA6725 100%)", boxShadow: "0px 20px 40px -16px rgba(244,116,53,0.5)" }}>
                        <span className="text-[14px] font-black uppercase tracking-[1px]">{submitting ? "Processing…" : cents >= 100 ? `Confirm & Donate ${fmt(cents / 100)}` : "Confirm and Donate"}</span>
                    </button>
                </div>
            </div>

            {/* ── Right column (summary) ── */}
            <div className="flex shrink-0 flex-col gap-6 bg-[#f9f9fc] px-6 py-7 sm:px-7 lg:w-[372px] lg:overflow-y-auto">
                {/* Campaign card */}
                <div className="shrink-0 overflow-hidden">
                    <div className="relative h-[200px] shrink-0 overflow-hidden rounded-[12px] bg-[#e7e9eb]">
                        {heroUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={heroUrl} alt={campaignName} className="size-full object-cover" />
                        )}
                        {daysLeft != null && (
                            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur">
                                <span className="size-1.5 rounded-full bg-[#f47435]" />
                                <span className="text-[12px] font-bold text-[#003060]">{daysLeft} Days</span>
                            </span>
                        )}
                    </div>
                    <p className="mt-3.5 text-[18px] font-black leading-[1.25] text-[#003060]">{campaignName}</p>
                    {campaignStory && (
                        <div className="story-content mt-2 line-clamp-3 text-[14px] text-[#7e8a96]" dangerouslySetInnerHTML={{ __html: campaignStory }} />
                    )}
                </div>

                {/* Donation details */}
                <div className="flex shrink-0 flex-col gap-4 border-y border-[#e7e9eb] py-6">
                    <p className="text-[12px] font-black uppercase tracking-[1px] text-[#aeb5bd]">Donation Details</p>
                    <div className="flex items-center justify-between text-[16px]">
                        <span className="font-medium text-[#7e8a96]">Your donation</span>
                        <span className="font-bold text-[#003060]">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[16px] font-black text-[#003060]">Total due today</span>
                        <span className="text-[18px] font-black text-[#003060]">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                    </div>
                </div>

                {/* Attribution (only when no participant is pre-selected) */}
                {!targetMember && participants.length > 0 && (
                    <div className="flex shrink-0 flex-col gap-3">
                        <p className="text-[12px] font-black uppercase tracking-[1px] text-[#aeb5bd]">Donation Attribution</p>
                        <p className="text-[13px] text-[#7e8a96]">Which participant would you like to attribute this to?</p>
                        <button type="button" onClick={() => setAttributedTo(null)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-bold transition-colors"
                            style={{ background: attributedTo === null ? accent : "#eef2f7", color: attributedTo === null ? "#fff" : "#003060" }}>
                            <span className={`flex size-7 items-center justify-center rounded-full ${attributedTo === null ? "bg-white/20" : "bg-white"}`}>
                                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                            </span>
                            General Fund
                        </button>
                        {participants.length > 4 && (
                            <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search participant…"
                                className="rounded-lg border border-[#d4dee7] px-3 py-2 text-[14px] placeholder:text-[#aeb5bd] focus:border-[#0278de] focus:outline-none" />
                        )}
                        <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
                            {filteredParticipants.map((p) => {
                                const sel = attributedTo === p.id;
                                return (
                                    <li key={p.id}>
                                        <button type="button" onClick={() => setAttributedTo(p.id)}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors ${sel ? "" : "text-[#003060] hover:bg-[#eef2f7]"}`}
                                            style={sel ? { background: `${accent}1a`, color: accent } : undefined}>
                                            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef2f7]">
                                                {p.profile_photo_url
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={p.profile_photo_url} alt="" className="size-full object-cover" />
                                                    : <span className="text-[13px] font-bold text-[#7e8a96]">{p.first_name.charAt(0)}</span>}
                                            </span>
                                            <span className="flex-1 truncate text-left">{p.first_name} {p.last_name}</span>
                                            {sel && <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </form>
    );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function DonateModal({
    isOpen, onClose, onDonationSuccess,
    campaignSlug, campaignName, campaignStory, heroUrl,
    accent, participants, targetMemberId, donorPrefill,
    donationsEnabled, donationsDisabledMessage, maxDonationCents, daysLeft = null,
}: Props) {
    const [successData, setSuccessData] = useState<DonationSuccessData | null>(null);

    const targetMember = targetMemberId ? (participants.find((p) => p.id === targetMemberId) ?? null) : null;

    // Reset success → form on close (not in an effect) so a fresh open shows the form.
    const handleClose = () => { setSuccessData(null); onClose(); };

    useEffect(() => { document.body.style.overflow = isOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isOpen]);
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setSuccessData(null); onClose(); } };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" style={{ background: "rgba(0,30,60,0.55)", backdropFilter: "blur(3px)" }} onClick={handleClose}>
            <div className="relative w-full max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
                {/* Close — top-right (form state; the success view carries its own). */}
                {donationsEnabled && !successData && (
                    <button type="button" onClick={handleClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/35">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {!donationsEnabled ? (
                    <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-10 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-amber-100">
                                <svg className="size-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="mb-2 text-xl font-extrabold text-gray-900">Donations Paused</h3>
                            <p className="mb-8 text-sm text-gray-500">{donationsDisabledMessage?.trim() || "This campaign is temporarily not accepting donations. Please check back soon."}</p>
                            <button onClick={handleClose} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50">Close</button>
                        </div>
                    </div>
                ) : !successData ? (
                    <Elements stripe={stripePromise}>
                        <DonateForm
                            campaignSlug={campaignSlug} campaignName={campaignName} campaignStory={campaignStory}
                            heroUrl={heroUrl} accent={accent} daysLeft={daysLeft} participants={participants} targetMember={targetMember}
                            onClose={handleClose}
                            onSuccess={(data) => { setSuccessData(data); onDonationSuccess?.(data.amount); }}
                            donorPrefill={donorPrefill} maxDonationCents={maxDonationCents}
                        />
                    </Elements>
                ) : (
                    <div className="mx-auto w-full max-w-[460px]">
                        <DonationSuccess {...successData} campaignSlug={campaignSlug} campaignName={campaignName} campaignStory={campaignStory} heroUrl={heroUrl} accent={accent} daysLeft={daysLeft} onClose={handleClose} />
                    </div>
                )}
            </div>
        </div>
    );
}
