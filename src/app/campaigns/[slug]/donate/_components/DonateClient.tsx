"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DonateParticipant } from "../page";

type Props = {
    campaignSlug:  string;
    campaignName:  string;
    campaignStory: string | null;
    heroUrl:       string | null;
    accent:        string;
    participants:  DonateParticipant[];
    targetMember:  DonateParticipant | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function fmtAmount(n: number) {
    return n > 0
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
        : "$0.00";
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}

const INPUT = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

// ── Main component ────────────────────────────────────────────────────────────

export default function DonateClient({
    campaignSlug,
    campaignName,
    campaignStory,
    heroUrl,
    accent,
    participants,
    targetMember,
}: Props) {
    // Form state
    const [amount,       setAmount]       = useState("");
    const [cardNumber,   setCardNumber]   = useState("");
    const [expiry,       setExpiry]       = useState("");
    const [cvv,          setCvv]          = useState("");
    const [cardHolder,   setCardHolder]   = useState("");
    const [country,      setCountry]      = useState("United States");
    const [zip,          setZip]          = useState("");
    const [email,        setEmail]        = useState("");
    const [phone,        setPhone]        = useState("");
    const [firstName,    setFirstName]    = useState("");
    const [lastName,     setLastName]     = useState("");
    const [anonymous,    setAnonymous]    = useState(false);
    const [agreeTerms,   setAgreeTerms]   = useState(false);
    const [saveCard,     setSaveCard]     = useState(false);
    // Attribution: null = General Fund, string = member id
    const [attributedTo, setAttributedTo] = useState<string | null>(null);
    const [memberSearch, setMemberSearch] = useState("");
    const [attrOpen,     setAttrOpen]     = useState(true);
    const [submitted,    setSubmitted]    = useState(false);

    const numAmount = parseFloat(amount) || 0;

    const filteredParticipants = participants.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(memberSearch.toLowerCase())
    );

    // ── Success screen ────────────────────────────────────────────────────────

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#1a6fbf 0%,#1565C0 60%,#0d4fa8 100%)" }}>
                <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-500 text-sm mb-2">
                        Your donation of <span className="font-bold text-gray-800">{fmtAmount(numAmount)}</span> has been received.
                    </p>
                    <p className="text-gray-400 text-xs mb-8">A confirmation will be sent to your email.</p>
                    <Link
                        href={`/campaigns/${campaignSlug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
                        style={{ background: accent }}
                    >
                        ← Back to Campaign
                    </Link>
                </div>
            </div>
        );
    }

    // ── Main layout ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#1a6fbf 0%,#1565C0 60%,#0d4fa8 100%)" }}>

            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                        <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight hidden sm:block">FundByText</span>
                </Link>
                <Link
                    href={`/campaigns/${campaignSlug}`}
                    className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back to Campaign
                </Link>
            </nav>

            {/* Card */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="grid lg:grid-cols-[1fr_360px] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                        {/* ── Left: Form ──────────────────────────────────── */}
                        <div className="p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: "calc(100vh - 5rem)" }}>

                            {/* Title */}
                            <div className="flex items-center gap-3 mb-7">
                                {targetMember && (
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 shrink-0 flex items-center justify-center">
                                        {targetMember.profile_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={targetMember.profile_photo_url} alt={targetMember.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-blue-600 font-bold text-sm">
                                                {targetMember.first_name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <h1 className="text-lg font-bold text-gray-900 flex-1 leading-snug">
                                    {targetMember
                                        ? `Donate to ${targetMember.first_name} ${targetMember.last_name}'s Campaign`
                                        : "Donate to this campaign"}
                                </h1>
                                <Link href={`/campaigns/${campaignSlug}`} className="text-gray-300 hover:text-gray-500 shrink-0 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </Link>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">

                                {/* Amount */}
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg select-none">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        placeholder="000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 text-xl font-bold placeholder-gray-200 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Pay With */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Pay With</p>
                                        {/* Payment icons */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black italic text-white" style={{ background: "#1a1f71" }}>VISA</span>
                                            <span className="relative inline-flex items-center" style={{ width: 28, height: 18 }}>
                                                <span className="absolute left-0 top-0 w-[18px] h-[18px] rounded-full" style={{ background: "#eb001b", opacity: 0.9 }} />
                                                <span className="absolute left-2 top-0 w-[18px] h-[18px] rounded-full" style={{ background: "#f79e1b", opacity: 0.9 }} />
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black text-white" style={{ background: "#003087" }}>PP</span>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "#007bc1" }}>AMEX</span>
                                            <span className="px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 text-[9px] font-semibold bg-white">G Pay</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Card Option">
                                            <select className={INPUT}>
                                                <option>Credit/Debit</option>
                                                <option>Credit</option>
                                                <option>Debit</option>
                                            </select>
                                        </Field>
                                        <Field label="Card Number">
                                            <input
                                                type="text"
                                                placeholder="0123 4567 8910 1122"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                                                className={INPUT}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Expiration">
                                            <input
                                                type="text"
                                                placeholder="12/34"
                                                value={expiry}
                                                onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                                                className={INPUT}
                                            />
                                        </Field>
                                        <Field label="CVV">
                                            <input
                                                type="text"
                                                placeholder="···"
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                className={INPUT}
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Card Holder Name">
                                        <input
                                            type="text"
                                            placeholder="0123 4567 8910 112"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value)}
                                            className={INPUT}
                                        />
                                    </Field>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Location">
                                            <select
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className={INPUT}
                                            >
                                                <option>United States</option>
                                                <option>Canada</option>
                                                <option>United Kingdom</option>
                                                <option>Australia</option>
                                            </select>
                                        </Field>
                                        <Field label="ZIP">
                                            <input
                                                type="text"
                                                placeholder="—"
                                                value={zip}
                                                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                className={INPUT}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                {/* Email */}
                                <Field label="Email">
                                    <input
                                        type="email"
                                        placeholder="Enter a valid email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={INPUT}
                                    />
                                </Field>

                                {/* Phone */}
                                <Field label="Phone">
                                    <div className="flex">
                                        <span className="px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500 bg-gray-50">+1</span>
                                        <input
                                            type="tel"
                                            placeholder="(214) 761-6542"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </Field>

                                {/* Save card toggle — participant mode only */}
                                {targetMember && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm text-gray-700">Save card for future donations</span>
                                        <button
                                            type="button"
                                            onClick={() => setSaveCard((v) => !v)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${saveCard ? "bg-green-500" : "bg-gray-200"}`}
                                            aria-pressed={saveCard}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${saveCard ? "translate-x-6" : ""}`}
                                            />
                                        </button>
                                    </div>
                                )}

                                {/* Donator */}
                                <Field label="Donator">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className={INPUT}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className={INPUT}
                                        />
                                    </div>
                                </Field>

                                {/* Anonymous */}
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={anonymous}
                                        onChange={(e) => setAnonymous(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 shrink-0 rounded"
                                    />
                                    <span className="text-xs text-gray-600">
                                        Please keep my name anonymous on the campaign.
                                    </span>
                                </label>

                                {/* Terms */}
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 shrink-0 rounded"
                                    />
                                    <span className="text-xs text-gray-600">
                                        By signing up, you confirm that you agree to FundByText&apos;s{" "}
                                        <Link href="/terms" className="text-blue-600 underline">Terms of Service</Link>
                                        {" "}and acknowledge our{" "}
                                        <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
                                    </span>
                                </label>

                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                                    labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                                    laboris nisi ut aliquip ex ea commodo consequat.
                                </p>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
                                    style={{ background: "#f97316" }}
                                >
                                    Confirm and Donate
                                </button>
                            </form>
                        </div>

                        {/* ── Right: Summary ───────────────────────────────── */}
                        <div className="p-6 sm:p-8 bg-gray-50 flex flex-col gap-5">

                            {/* Campaign card */}
                            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                                <div className="relative h-36 bg-gradient-to-br from-blue-200 to-blue-400">
                                    {heroUrl && (
                                        <Image src={heroUrl} alt={campaignName} fill className="object-cover" unoptimized />
                                    )}
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-white/90 rounded-full">
                                        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                                        <span className="text-[10px] font-semibold text-gray-700">Active</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">{campaignName}</p>
                                    {campaignStory && (
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{campaignStory}</p>
                                    )}
                                </div>
                            </div>

                            {/* Donation details */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <p className="text-sm font-bold text-gray-800 mb-3">Donation Details</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Your donation</span>
                                    <span className="font-semibold text-gray-800">{fmtAmount(numAmount)}</span>
                                </div>
                                <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700">Total due today</span>
                                    <span className="text-sm font-extrabold text-gray-900">{fmtAmount(numAmount)}</span>
                                </div>
                            </div>

                            {/* Donation Attribution — general campaign only */}
                            {!targetMember && participants.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setAttrOpen((v) => !v)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                                            Donation Attribution
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform ${attrOpen ? "rotate-180" : ""}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </button>

                                    {attrOpen && (
                                        <div className="border-t border-gray-100 px-4 pb-4 space-y-3">
                                            <p className="text-xs text-gray-500 pt-3">
                                                Which Participant would you like to attribute this to?
                                            </p>

                                            {/* General Fund */}
                                            <button
                                                type="button"
                                                onClick={() => setAttributedTo(null)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                                style={{
                                                    background: attributedTo === null ? "#1565C0" : "#F3F4F6",
                                                    color:      attributedTo === null ? "#fff" : "#374151",
                                                }}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${attributedTo === null ? "bg-white/20" : "bg-gray-200"}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </svg>
                                                </div>
                                                General Fund
                                            </button>

                                            {/* Search */}
                                            <div className="relative">
                                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7 7 0 104.35 16.65 7 7 0 0016.65 16.65z"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search Participant"
                                                    value={memberSearch}
                                                    onChange={(e) => setMemberSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                            </div>

                                            {/* Participant list */}
                                            <ul className="space-y-1 max-h-48 overflow-y-auto">
                                                {filteredParticipants.map((p) => (
                                                    <li key={p.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttributedTo(p.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                attributedTo === p.id
                                                                    ? "bg-blue-50 text-blue-700"
                                                                    : "hover:bg-gray-50 text-gray-700"
                                                            }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                                {p.profile_photo_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={p.profile_photo_url} alt={p.first_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-gray-500">
                                                                        {p.first_name.charAt(0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="flex-1 text-left truncate">
                                                                {p.first_name} {p.last_name}
                                                            </span>
                                                            {attributedTo === p.id && (
                                                                <svg className="w-4 h-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
