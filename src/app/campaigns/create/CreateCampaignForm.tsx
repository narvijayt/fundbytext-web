"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProgressBar } from "@/app/campaigns/[slug]/create/_components/WizardNav";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
    campaign_type: z.enum(["individual", "organization"], { message: "Please select a campaign type" }),
    name: z.string().min(1, "Campaign name is required").max(50),
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-gray-400";
const inputErrCls =
    "w-full border border-red-400 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400";

function OrgIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}
function PersonIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}
function CheckCircleIcon() {
    return (
        <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm4.7 7.3a1 1 0 00-1.4-1.4L11 12.18l-2.3-2.3a1 1 0 00-1.4 1.42l3 3a1 1 0 001.4 0l5-5z" clipRule="evenodd" />
        </svg>
    );
}


export default function CreateCampaignForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [accountExists, setAccountExists] = useState(false);
    const [nameTaken, setNameTaken] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) });

    const selectedType = watch("campaign_type");
    const nameVal = watch("name") ?? "";

    async function onSubmit(data: FormData) {
        setServerError(null);
        setAccountExists(false);
        setNameTaken(false);

        const [res] = await Promise.all([
            fetch("/api/v1/campaigns/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
            new Promise((r) => setTimeout(r, 800)),
        ]);

        const json = await res.json();

        if (res.status === 409 && json.code === "account_exists") {
            setAccountExists(true);
            return;
        }
        if (res.status === 409 && json.code === "name_taken") {
            setNameTaken(true);
            return;
        }
        if (!res.ok) {
            setServerError(json.error ?? "Something went wrong. Please try again.");
            return;
        }

        router.push(`/campaigns/${json.campaign.slug}/create`);
        router.refresh();
    }

    return (
        <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #2196F3 0%, #1565C0 100%)" }}>

            {/* ── Top header bar ──────────────────────────────────────── */}
            <div className="bg-white" style={{ height: 78 }}>
                <div
                    className="h-full max-w-5xl mx-auto flex items-center justify-between"
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                >
                    <Link href="/" className="flex items-center transition-opacity hover:opacity-70 shrink-0">
                        <Image src="/assets/campaigns/app-logo.svg" width={30} height={43} alt="FundbyText" />
                    </Link>
                    <h1
                        className="text-center font-black"
                        style={{ color: "rgba(0,79,149,1)", fontSize: 32, lineHeight: "115%", letterSpacing: 0 }}
                    >
                        Create Your Campaign
                    </h1>
                    <p className="shrink-0 text-right font-sans font-black text-sm leading-none tracking-[1px] uppercase text-[rgba(87,114,141,1)]">
                        STEP{" "}
                        <span className="text-[#26BA58]">0</span>
                        {" "}/{" "}
                        <span>5</span>
                    </p>
                </div>
            </div>

            {/* ── Progress bar — full width ────────────────────────────── */}
            <div className="bg-white w-full">
                <ProgressBar step={0} maxStep={0} isOrg={false} />
            </div>

            {/* ── Step banner ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center">
                <div
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext x='10' y='44' font-size='40' font-family='sans-serif' fill='white'%3E%3F%3C/text%3E%3C/svg%3E")`,
                        backgroundSize: "60px 60px",
                    }}
                />
                <div className="relative z-10 flex justify-center">
                    <div
                        className="px-10 py-4 text-center min-w-65"
                        style={{
                            background: "linear-gradient(180deg, #1A3F8F 0%, #0D2860 100%)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                        }}
                    >
                        <h2 className="text-2xl font-extrabold text-white tracking-wide">Start Your Campaign</h2>
                        <div className="flex items-center justify-center gap-2 mt-1.5">
                            <span className="text-blue-300 text-sm select-none">—</span>
                            <p className="text-blue-200 text-xs font-medium">Tell us a bit about yourself to get started.</p>
                            <span className="text-blue-300 text-sm select-none">—</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Form cards ──────────────────────────────────────────── */}
            <div className="w-full max-w-2xl mx-auto px-4 pt-5 space-y-4">

                {/* Card 1: Campaign Type */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-center px-6 pt-6 pb-4">
                        <div className="flex justify-center mb-2 text-blue-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <rect x="3" y="8" width="18" height="12" rx="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8V4M8 4h8M9 14h.01M15 14h.01M9 18h6" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">What type of campaign are you running?</h3>
                        <p className="text-xs text-gray-500 mt-1">This will be the title that everyone sees. Make it clear and catchy!</p>
                    </div>
                    <div className="h-px bg-gray-100 mx-5" />
                    <div className="px-5 py-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {(["organization", "individual"] as const).map((type) => {
                                const active = selectedType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setValue("campaign_type", type, { shouldValidate: true })}
                                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all text-left ${active
                                            ? "bg-blue-700 border-blue-700 text-white shadow-md"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                                            }`}
                                    >
                                        {type === "organization" ? <OrgIcon active={active} /> : <PersonIcon active={active} />}
                                        <span className="flex-1">{type === "organization" ? "Organization Campaign" : "Individual Campaign"}</span>
                                        {active && <CheckCircleIcon />}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.campaign_type && (
                            <p className="text-xs text-red-500 mt-2">{errors.campaign_type.message}</p>
                        )}
                    </div>
                    {/* FundBuddy bar */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border-t border-orange-100">
                        <svg className="w-9 h-9 shrink-0" viewBox="0 0 48 48" fill="none">
                            <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
                            <circle cx="24" cy="16" r="11" fill="#F97316" />
                            <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
                            <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
                            <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
                            <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
                            <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
                            <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
                        </svg>
                        <p className="text-[11px] text-gray-600 flex-1 leading-relaxed">
                            {selectedType === "organization"
                                ? "Organizational Campaigns are for groups of people, like sports teams, bands, clubs, schools — you name it."
                                : "Individual Campaigns are for a single person like yourself."}
                        </p>
                    </div>
                </div>

                {/* Card 2: Campaign Name */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-center px-6 pt-6 pb-4">
                        <div className="flex justify-center mb-2 text-blue-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <rect x="3" y="8" width="18" height="12" rx="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8V4M8 4h8M9 14h.01M15 14h.01M9 18h6" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">What&apos;s the name of your campaign?</h3>
                        <p className="text-xs text-gray-500 mt-1">This will be the title that everyone sees. Make it clear and catchy!</p>
                    </div>
                    <div className="h-px bg-gray-100 mx-5" />
                    <div className="px-5 py-4">
                        <div className="relative">
                            <input
                                {...register("name")}
                                placeholder="e.g. New Helmets for the Bears Football Team!"
                                maxLength={50}
                                className={`${errors.name || nameTaken ? inputErrCls : inputCls} pr-16`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                                {nameVal.length}/50
                            </span>
                        </div>
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        {nameTaken && <p className="text-xs text-red-500 mt-1">A campaign with this name already exists. Please choose a different name.</p>}
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border-t border-orange-100">
                        <svg className="w-9 h-9 shrink-0" viewBox="0 0 48 48" fill="none">
                            <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
                            <circle cx="24" cy="16" r="11" fill="#F97316" />
                            <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
                            <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
                            <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
                            <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
                            <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
                            <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
                        </svg>
                        <p className="text-[11px] text-gray-600 flex-1 leading-relaxed">
                            Ask FundBuddy for your campaign description — our AI will suggest a great name based on your cause.
                        </p>
                        <button type="button" className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-full transition-colors">
                            Ask FundBuddy
                        </button>
                    </div>
                </div>

                {/* Card 3: Your Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-center px-6 pt-6 pb-4">
                        <div className="flex justify-center mb-2 text-blue-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Tell us about yourself</h3>
                        <p className="text-xs text-gray-500 mt-1">We&apos;ll use this to create your account and get your campaign started.</p>
                    </div>
                    <div className="h-px bg-gray-100 mx-5" />
                    <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    First Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    {...register("first_name")}
                                    placeholder="First name"
                                    className={errors.first_name ? inputErrCls : inputCls}
                                />
                                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Last Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    {...register("last_name")}
                                    placeholder="Last name"
                                    className={errors.last_name ? inputErrCls : inputCls}
                                />
                                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Email Address <span className="text-red-400">*</span>
                            </label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="you@example.com"
                                className={errors.email ? inputErrCls : inputCls}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    {accountExists && (
                        <div className="mx-5 mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                            <p className="font-semibold mb-1">You already have an account.</p>
                            <p className="text-blue-600">
                                Please{" "}
                                <Link href="/login" className="font-semibold underline hover:text-blue-800">log in</Link>
                                {" "}to continue creating your campaign.
                            </p>
                        </div>
                    )}
                    {serverError && (
                        <p className="text-sm text-red-500 mx-5 mb-4">{serverError}</p>
                    )}
                </div>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-700 font-semibold hover:underline">Log In</Link>
                </p>
            </div>

            {/* ── Fixed bottom nav ────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shadow-lg">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <span className="w-5 h-5 flex items-center justify-center rounded border border-gray-300 text-gray-400 text-[10px] font-bold shrink-0">✕</span>
                    <span className="hidden sm:inline">Exit</span>
                </Link>
                <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-7 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Setting up…
                        </>
                    ) : (
                        <>
                            Next
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
