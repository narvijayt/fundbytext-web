"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import type { DonorPrefill } from "./CampaignDonateShell";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Donation form (inside Stripe Elements) ─────────────────────────────────────

type FormProps = {
    campaignSlug:     string;
    campaignName:     string;
    campaignStory:    string | null;
    heroUrl:          string | null;
    accent:           string;
    participants:     ModalParticipant[];
    targetMember:     ModalParticipant | null;
    onClose:          () => void;
    onSuccess:        (amount: number) => void;
    donorPrefill?:    DonorPrefill | null;
    maxDonationCents: number | null;
};

function DonateForm({
    campaignSlug, campaignName, campaignStory, heroUrl, accent,
    participants, targetMember: initialTargetMember, onClose, onSuccess, donorPrefill,
    maxDonationCents,
}: FormProps) {
    const stripe   = useStripe();
    const elements = useElements();

    const [raw,          setRaw]          = useState("");
    const [firstName,    setFirstName]    = useState(donorPrefill?.firstName ?? "");
    const [lastName,     setLastName]     = useState(donorPrefill?.lastName  ?? "");
    const [email,        setEmail]        = useState(donorPrefill?.email     ?? "");
    const [phone,        setPhone]        = useState("");
    const [anonymous,    setAnonymous]    = useState(false);
    const [agreeTerms,   setAgreeTerms]   = useState(false);
    const [attributedTo, setAttributedTo] = useState<string | null>(initialTargetMember?.id ?? null);
    const [memberSearch, setMemberSearch] = useState("");
    const [submitting,   setSubmitting]   = useState(false);
    const [error,        setError]        = useState<string | null>(null);

    const cents = Math.round((parseFloat(raw) || 0) * 100);

    // Keep Elements amount in sync so Stripe shows correct value
    useEffect(() => {
        if (cents >= 100) elements?.update({ amount: cents });
    }, [cents, elements]);

    const filteredParticipants = participants.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const exceedsMax = maxDonationCents !== null && cents > maxDonationCents;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cents < 100)  { setError("Please enter at least $1."); return; }
        if (exceedsMax)   return; // inline error already shown under the amount input
        if (!firstName || !lastName) { setError("Please enter your first and last name."); return; }
        if (!email && !phone)        { setError("Please provide at least an email or phone number."); return; }
        if (!agreeTerms)             { setError("Please accept the terms."); return; }
        if (!stripe || !elements) return;

        setSubmitting(true);
        setError(null);

        // 1. Submit Elements (validates card fields)
        const { error: submitErr } = await elements.submit();
        if (submitErr) {
            setError(submitErr.message ?? "Invalid card details.");
            setSubmitting(false);
            return;
        }

        // 2. Create PaymentIntent with complete donor info (no PATCH needed)
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
                    donor_first_name:  firstName,
                    donor_last_name:   lastName,
                    donor_email:       email || null,
                    donor_phone:       phone || null,
                    is_anonymous:      anonymous,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to create payment intent");
            clientSecret = data.client_secret;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSubmitting(false);
            return;
        }

        // 3. Confirm payment
        const { error: stripeErr } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/campaigns/${campaignSlug}?donated=1`,
                payment_method_data: {
                    billing_details: {
                        name:  `${firstName} ${lastName}`,
                        email: email || undefined,
                        phone: phone || undefined,
                    },
                },
                receipt_email: email || undefined,
            },
            redirect: "if_required",
        });

        if (stripeErr) {
            setError(stripeErr.message ?? "Payment failed. Please try again.");
            setSubmitting(false);
        } else {
            const intentId = clientSecret.split("_secret_")[0];
            await fetch("/api/v1/payments/record", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ payment_intent_id: intentId }),
            }).catch(() => {});
            onSuccess(parseFloat(raw) || 0);
        }
    }

    const locked = !!donorPrefill;
    const INPUT        = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
    const INPUT_LOCKED = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed select-none";

    return (
        <form onSubmit={handleSubmit} className="contents">
            {/* Left column */}
            <div className="overflow-y-auto min-h-0 p-6 sm:p-8 space-y-5">

                {/* Amount */}
                <div>
                    <div className="flex items-baseline justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900">Donation Amount</p>
                        {maxDonationCents !== null && maxDonationCents > 0 && (
                            <button
                                type="button"
                                onClick={() => setRaw(String(maxDonationCents / 100))}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Max: {fmt(maxDonationCents / 100)}
                            </button>
                        )}
                    </div>
                    <div className="relative mb-3">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={raw}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setRaw(v);
                            }}
                            className={`w-full pl-9 pr-4 py-3 border-2 rounded-xl text-2xl font-bold text-gray-900 placeholder-gray-200 focus:outline-none ${exceedsMax ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
                            autoComplete="off"
                            autoFocus
                        />
                    </div>
                    {exceedsMax && (
                        <p className="text-xs text-red-500 -mt-2 mb-1">
                            Exceeds remaining goal of {fmt(maxDonationCents! / 100)}
                        </p>
                    )}
                </div>

                {/* Stripe PaymentElement */}
                <div>
                    <p className="text-sm font-bold text-gray-900 mb-3">Pay With Card</p>
                    <PaymentElement
                        options={{
                            layout:             "tabs",
                            paymentMethodOrder: ["card"],
                            wallets:            { googlePay: "never", applePay: "never" },
                            fields:             { billingDetails: { address: { country: "auto", postalCode: "auto" } } },
                        }}
                    />
                </div>

                {/* Donor info */}
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Name <span className="text-red-400">*</span></label>
                        {locked && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Pre-filled</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => !locked && setFirstName(e.target.value)} readOnly={locked} className={locked ? INPUT_LOCKED : INPUT} required />
                        <input type="text" placeholder="Last Name"  value={lastName}  onChange={(e) => !locked && setLastName(e.target.value)}  readOnly={locked} className={locked ? INPUT_LOCKED : INPUT} required />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email <span className="text-red-400">*</span></label>
                        {locked && donorPrefill?.email && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Pre-filled</span>}
                    </div>
                    <input type="email" placeholder="your@email.com" value={email} onChange={(e) => !(locked && donorPrefill?.email) && setEmail(e.target.value)} readOnly={!!(locked && donorPrefill?.email)} className={(locked && donorPrefill?.email) ? INPUT_LOCKED : INPUT} />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone <span className="text-red-400">*</span></label>
                    <p className="text-[10px] text-gray-400 mb-1">At least email or phone is required</p>
                    <div className="flex">
                        <span className="px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500 bg-gray-50">+1</span>
                        <input type="tel" placeholder="(214) 761-6542" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded" />
                    <span className="text-xs text-gray-600">Please keep my name anonymous on the campaign.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded" required />
                    <span className="text-xs text-gray-600">
                        By donating you agree to FundByText&apos;s{" "}
                        <Link href="/terms" className="text-blue-600 underline">Terms of Service</Link>{" "}
                        and <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
                    </span>
                </label>

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting || !stripe || cents < 100 || exceedsMax}
                    className="w-full py-4 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#f97316" }}
                >
                    {submitting ? "Processing…" : cents >= 100 ? `Donate ${fmt(cents / 100)}` : "Donate"}
                </button>
            </div>

            {/* Right column — campaign summary + attribution */}
            <div className="hidden lg:block overflow-y-auto min-h-0 bg-gray-50">
                <div className="flex flex-col gap-5 p-6 sm:p-8">
                    {/* Campaign card */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        <div className="relative h-36 bg-linear-to-br from-blue-200 to-blue-400">
                            {heroUrl && <Image src={heroUrl} alt={campaignName} fill className="object-cover" unoptimized />}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-white/90 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                                <span className="text-[10px] font-semibold text-gray-700">Active</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-bold text-gray-900 mb-1.5">{campaignName}</p>
                            {campaignStory && (
                                <div
                                    className="text-xs text-gray-500 line-clamp-4 story-content"
                                    dangerouslySetInnerHTML={{ __html: campaignStory }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Donation details */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-3">Donation Details</p>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">Your donation</span>
                            <span className="font-semibold">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Total due today</span>
                            <span className="text-sm font-extrabold">{cents >= 100 ? fmt(cents / 100) : "—"}</span>
                        </div>
                    </div>

                    {/* Attribution — only shown when no participant pre-selected */}
                    {!initialTargetMember && participants.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Donation Attribution</p>
                            <p className="text-xs text-gray-500">Which participant would you like to attribute this to?</p>
                            <button
                                type="button"
                                onClick={() => setAttributedTo(null)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                style={{ background: attributedTo === null ? "#1565C0" : "#F3F4F6", color: attributedTo === null ? "#fff" : "#374151" }}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${attributedTo === null ? "bg-white/20" : "bg-gray-200"}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                General Fund
                            </button>
                            <input
                                type="text"
                                placeholder="Search participant…"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <ul className="space-y-1">
                                {filteredParticipants.map((p) => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => setAttributedTo(p.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${attributedTo === p.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                {p.profile_photo_url
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={p.profile_photo_url} alt={p.first_name} className="w-full h-full object-cover" />
                                                    : <span className="text-xs font-bold text-gray-500">{p.first_name[0]}</span>
                                                }
                                            </div>
                                            <span className="flex-1 text-left truncate">{p.first_name} {p.last_name}</span>
                                            {attributedTo === p.id && (
                                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function DonateModal({
    isOpen, onClose, onDonationSuccess,
    campaignSlug, campaignName, campaignStory, heroUrl,
    accent, participants, targetMemberId, donorPrefill,
    donationsEnabled, donationsDisabledMessage, maxDonationCents,
}: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const targetMember = targetMemberId
        ? (participants.find((p) => p.id === targetMemberId) ?? null)
        : null;

    useEffect(() => {
        if (isOpen) setIsSuccess(false);
    }, [isOpen]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={(e) => { e.stopPropagation(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
                    {targetMember && (
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 shrink-0 flex items-center justify-center">
                            {targetMember.profile_photo_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={targetMember.profile_photo_url} alt={targetMember.first_name} className="w-full h-full object-cover" />
                                : <span className="text-blue-600 font-bold text-sm">{targetMember.first_name[0]}</span>
                            }
                        </div>
                    )}
                    <h2 className="flex-1 text-base font-bold text-gray-900">
                        {targetMember
                            ? `Donate to ${targetMember.first_name} ${targetMember.last_name}'s Campaign`
                            : "Donate to this campaign"}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                {!donationsEnabled ? (
                    <div className="flex-1 flex items-center justify-center p-10">
                        <div className="text-center max-w-sm">
                            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
                                <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Donations Paused</h3>
                            <p className="text-gray-500 text-sm mb-8">
                                {donationsDisabledMessage?.trim()
                                    ? donationsDisabledMessage
                                    : "This campaign is temporarily not accepting donations. Please check back soon."}
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : !isSuccess ? (
                    <div className="flex-1 overflow-hidden grid lg:grid-cols-[1fr_340px] divide-x divide-gray-100 min-h-0">
                        <Elements
                            stripe={stripePromise}
                            options={{
                                mode:               "payment",
                                amount:             100,
                                currency:           "usd",
                                paymentMethodTypes: ["card"],
                                appearance:         { theme: "stripe" },
                            }}
                        >
                            <DonateForm
                                campaignSlug={campaignSlug}
                                campaignName={campaignName}
                                campaignStory={campaignStory}
                                heroUrl={heroUrl}
                                accent={accent}
                                participants={participants}
                                targetMember={targetMember}
                                onClose={onClose}
                                onSuccess={(amt) => { setIsSuccess(true); onDonationSuccess?.(amt); }}
                                donorPrefill={donorPrefill}
                                maxDonationCents={maxDonationCents}
                            />
                        </Elements>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-10">
                        <div className="text-center max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Thank You!</h3>
                            <p className="text-gray-500 text-sm mb-1">Your donation has been received.</p>
                            <p className="text-gray-400 text-xs mb-8">A receipt will be sent to your email.</p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl text-white font-bold text-sm"
                                style={{ background: accent }}
                            >
                                Back to Campaign
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
