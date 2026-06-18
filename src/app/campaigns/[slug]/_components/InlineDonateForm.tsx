"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import Link from "next/link";
import type { DonorPrefill } from "./CampaignDonateShell";
import type { ModalParticipant } from "./DonateModal";
import DonationSuccess from "./DonationSuccess";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
    }).format(n);
}

// ── Inner payment form (inside Elements) ──────────────────────────────────────

type FormProps = {
    campaignSlug:     string;
    accent:           string;
    targetMember:     ModalParticipant | null;
    donorPrefill:     DonorPrefill | null;
    maxDonationCents: number | null;
    onSuccess:        (amountCents: number, cardBrand: string | null, cardLast4: string | null) => void;
};

function InlinePaymentForm({ campaignSlug, accent, targetMember, donorPrefill, maxDonationCents, onSuccess }: FormProps) {
    const stripe   = useStripe();
    const elements = useElements();

    const [raw,        setRaw]        = useState("");
    const [firstName,  setFirstName]  = useState(donorPrefill?.firstName ?? "");
    const [lastName,   setLastName]   = useState(donorPrefill?.lastName  ?? "");
    const [email,      setEmail]      = useState(donorPrefill?.email     ?? "");
    const [phone,      setPhone]      = useState("");
    const [anonymous,  setAnonymous]  = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    const cents = Math.round((parseFloat(raw) || 0) * 100);

    // Keep Elements amount in sync
    useEffect(() => {
        if (cents >= 100) elements?.update({ amount: cents });
    }, [cents, elements]);

    const locked       = !!donorPrefill;
    const INPUT        = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400";
    const INPUT_LOCKED = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed select-none";

    const exceedsMax = maxDonationCents !== null && cents > maxDonationCents;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cents < 100)  { setError("Please enter at least $1."); return; }
        if (exceedsMax)   return; // inline error already shown under the amount input
        if (!firstName || !lastName) { setError("Please enter your first and last name."); return; }
        if (!email && !phone)        { setError("Please provide at least an email or phone number."); return; }
        if (!agreeTerms)             { setError("Please accept the terms."); return; }
        if (!stripe || !elements)    return;

        setSubmitting(true);
        setError(null);

        // 1. Submit Elements (validates card)
        const { error: submitErr } = await elements.submit();
        if (submitErr) {
            setError(submitErr.message ?? "Invalid card details.");
            setSubmitting(false);
            return;
        }

        // 2. Create PaymentIntent with full donor info
        let clientSecret: string;
        try {
            const res = await fetch("/api/v1/payments/intent", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_slug:     campaignSlug,
                    amount_cents:      cents,
                    member_id:         targetMember?.id ?? null,
                    campaign_donor_id: donorPrefill?.donorId ?? null,
                    donor_source:      donorPrefill && !donorPrefill.donorId ? "link_self" : null,
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
            const recordRes = await fetch("/api/v1/payments/record", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ payment_intent_id: intentId }),
            }).catch(() => null);
            const recordJson = await recordRes?.json().catch(() => ({})) ?? {};
            onSuccess(cents, recordJson.card_brand ?? null, recordJson.card_last4 ?? null);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount input */}
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={raw}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setRaw(v);
                        }}
                        className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl text-xl font-bold text-gray-900 placeholder-gray-200 focus:outline-none ${exceedsMax ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
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

            {/* Card */}
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
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="First" value={firstName} onChange={(e) => !locked && setFirstName(e.target.value)} readOnly={locked} className={locked ? INPUT_LOCKED : INPUT} required />
                    <input type="text" placeholder="Last"  value={lastName}  onChange={(e) => !locked && setLastName(e.target.value)}  readOnly={locked} className={locked ? INPUT_LOCKED : INPUT} required />
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
                    <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded" />
                <span className="text-xs text-gray-600">Keep my name anonymous on the campaign</span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded" required />
                <span className="text-xs text-gray-600">
                    I agree to FundByText&apos;s{" "}
                    <Link href="/terms" className="text-blue-600 underline">Terms</Link>{" "}
                    and <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>
                </span>
            </label>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
                type="submit"
                disabled={submitting || !stripe || cents < 100 || exceedsMax}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: accent }}
            >
                {submitting ? "Processing…" : cents >= 100 ? `Donate ${fmt(cents / 100)}` : "Donate"}
            </button>
        </form>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
    totalRaised:              number;
    goalAmount:               number | null;
    pct:                      number;
    daysLeft:                 number | null;
    donorCount:               number;
    campaignSlug:             string;
    campaignName:             string;
    campaignStory:            string | null;
    heroUrl:                  string | null;
    accent:                   string;
    targetMember:             ModalParticipant | null;
    donorPrefill:             DonorPrefill | null;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    maxDonationCents:         number | null;
    onDonationSuccess:        () => void;
};

export default function InlineDonateForm({
    totalRaised, goalAmount, pct, daysLeft, donorCount,
    campaignSlug, campaignName, campaignStory, heroUrl,
    accent, targetMember, donorPrefill,
    donationsEnabled, donationsDisabledMessage, maxDonationCents, onDonationSuccess,
}: Props) {
    const [successData, setSuccessData] = useState<{
        amountCents: number;
        cardBrand:   string | null;
        cardLast4:   string | null;
    } | null>(null);

    return (
        <>
        <div className="space-y-4 lg:sticky lg:top-20">
            {/* Campaign progress summary */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="text-2xl font-extrabold text-gray-900">{fmt(totalRaised)}</p>
                {goalAmount && (
                    <p className="text-sm text-gray-500 mt-0.5">
                        raised of <span className="font-semibold text-gray-700">{fmt(goalAmount)}</span> goal
                    </p>
                )}
                <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#22c55e" }} />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span><span className="font-bold text-gray-800">{donorCount}</span> donor{donorCount !== 1 ? "s" : ""}</span>
                    {daysLeft !== null && (
                        <span><span className="font-bold text-gray-800">{daysLeft}</span> day{daysLeft !== 1 ? "s" : ""} left</span>
                    )}
                    {pct >= 100 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">Goal reached!</span>
                    )}
                </div>
            </div>

            {/* Donate card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
                {/* Goal fully funded */}
                {maxDonationCents === 0 && (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-extrabold text-gray-900 mb-1">Goal Fully Funded!</h3>
                        <p className="text-gray-500 text-sm">This campaign has reached its goal. Thank you to everyone who donated!</p>
                    </div>
                )}

                {/* Donations paused state */}
                {maxDonationCents !== 0 && !donationsEnabled && (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-base font-extrabold text-gray-900 mb-1">Donations Paused</h3>
                        <p className="text-gray-500 text-sm">
                            {donationsDisabledMessage?.trim()
                                ? donationsDisabledMessage
                                : "This campaign is temporarily not accepting donations. Please check back soon."}
                        </p>
                    </div>
                )}

                {/* Participant banner */}
                {maxDonationCents !== 0 && donationsEnabled && targetMember && !successData && (
                    <div className="flex items-center gap-2.5 mb-5 px-3 py-2.5 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center shrink-0">
                            {targetMember.profile_photo_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={targetMember.profile_photo_url} alt={targetMember.first_name} className="w-full h-full object-cover" />
                                : <span className="text-orange-600 font-bold text-sm">{targetMember.first_name[0]}</span>
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Donating to</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{targetMember.first_name} {targetMember.last_name}</p>
                        </div>
                    </div>
                )}

                {maxDonationCents !== 0 && donationsEnabled && (
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
                        <InlinePaymentForm
                            campaignSlug={campaignSlug}
                            accent={accent}
                            targetMember={targetMember}
                            donorPrefill={donorPrefill}
                            maxDonationCents={maxDonationCents}
                            onSuccess={(cents, cardBrand, cardLast4) => {
                                setSuccessData({ amountCents: cents, cardBrand, cardLast4 });
                                onDonationSuccess();
                            }}
                        />
                    </Elements>
                )}
            </div>
        </div>

            {/* Success overlay */}
            {successData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
                >
                    <div className="w-full max-w-[460px]">
                        <DonationSuccess
                            amount={successData.amountCents / 100}
                            cardBrand={successData.cardBrand}
                            cardLast4={successData.cardLast4}
                            participant={targetMember}
                            campaignSlug={campaignSlug}
                            campaignName={campaignName}
                            campaignStory={campaignStory}
                            heroUrl={heroUrl}
                            accent={accent}
                            onClose={() => setSuccessData(null)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
