"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProgressBar } from "@/app/campaigns/[slug]/create/_components/WizardNav";
import { QuestionCard, PAGE_GRADIENT, VectorWallpaper, StepBanner, inputCls, inputErrCls, AlertDialog } from "@/app/campaigns/[slug]/create/_components/ui";
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

export default function CreateCampaignForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [accountExists, setAccountExists] = useState(false);
    const [nameTaken, setNameTaken] = useState(false);

    const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) });

    // Until a campaign type is picked, the name/info cards aren't mounted — so a
    // full validation would flag those (undefined) fields with errors that then
    // surface inside the still-hidden cards. Validate only the type first.
    function handleNext() {
        if (!selectedType) {
            setError("campaign_type", { type: "manual", message: "Please select a campaign type" });
            scrollToFirstError();
            return;
        }
        handleSubmit(onSubmit, scrollToFirstError)();
    }

    const selectedType = watch("campaign_type");
    const nameVal = watch("name") ?? "";

    // On a failed submit, scroll the first inline field error into view
    // (errors are shown next to each field — no toast).
    function scrollToFirstError() {
        setTimeout(() => {
            document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
    }

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
        <div className="wizard-shell relative isolate min-h-screen pb-24" style={{ background: PAGE_GRADIENT }}>

            <VectorWallpaper />

            {/* ── Top header bar + progress bar — single shared white background,
            so no seam/gap shows the page background between them ───────── */}
            <div className="relative z-40 bg-white w-full">
                <div className="h-15.5 md:h-22 mb-2 md:mb-4">
                    <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-10">
                        <Link href="/" className="flex items-center transition-opacity hover:opacity-70 shrink-0">
                            <Image
                                src="/assets/campaigns/app-logo.svg"
                                width={34}
                                height={48}
                                alt="FundbyText"
                                className="app-logo w-5.25 h-7.5 md:w-8.5 md:h-12"
                            />
                        </Link>
                        <h1
                            className="text-center font-black text-base md:text-[24px]"
                            style={{ color: "rgba(0,79,149,1)", lineHeight: "115%", letterSpacing: 0 }}
                        >
                            Create Your Campaign
                        </h1>
                        <p className="shrink-0 text-right font-sans font-black text-[9px] md:text-sm leading-none tracking-[1px] uppercase text-[rgba(87,114,141,1)]">
                            STEP{" "}
                            <span className="text-[#26BA58]">0</span>
                            {" "}/{" "}
                            <span>5</span>
                        </p>
                    </div>
                </div>

                <ProgressBar step={0} maxStep={0} isOrg={false} />
            </div>

            {/* ── Step banner — CSS plaque + ribbon ───────────────────── */}
            <div className="relative px-6 pt-8 pb-6">
                <div className="relative z-10 flex justify-center">
                    <StepBanner title="Let's Get Started" subtitle="Ready, set, create!" />
                </div>
            </div>

            {/* ── Form cards ──────────────────────────────────────────── */}
            <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 pt-5 space-y-4 sm:space-y-6 lg:space-y-8">

                {/* Card 1: Campaign Type */}
                <QuestionCard
                    title="What type of campaign are you running?"
                    description="Choose the campaign type that best fits your fundraising goal."
                    askBuddyText={
                        selectedType === "organization"
                            ? "Organizational Campaigns are for groups of people, like sports teams, bands, clubs, schools — you name it."
                            : selectedType === "individual"
                                ? "Individual Campaigns are for a single person like yourself."
                                : "Not sure which to pick? Choose an option above and I'll explain what it means!"
                    }
                >
                    <div>
                        <div className="flex flex-col lg:flex-row gap-[16px]">
                            {(["organization", "individual"] as const).map((type) => {
                                const active = selectedType === type;
                                const activeIcon = type === "organization" ? "/assets/campaigns/organization-active.svg" : "/assets/campaigns/individual-active.svg";
                                const inactiveIcon = type === "organization" ? "/assets/campaigns/organizational-icon.svg" : "/assets/campaigns/individual-inactive.svg";
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setValue("campaign_type", type, { shouldValidate: true })}
                                        className="flex-1 min-w-0 h-15 lg:h-17 flex items-center justify-between bg-white text-left transition-all"
                                        style={{
                                            gap: "8px",
                                            borderRadius: "16px",
                                            paddingTop: "18px",
                                            paddingRight: "24px",
                                            paddingBottom: "18px",
                                            paddingLeft: "16px",
                                            border: active ? "2px solid transparent" : "2px solid rgba(212,222,231,1)",
                                            backgroundImage: active
                                                ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                                                : undefined,
                                            backgroundOrigin: active ? "border-box" : undefined,
                                            backgroundClip: active ? "padding-box, border-box" : undefined,
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="shrink-0 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center">
                                                <Image
                                                    src={active ? activeIcon : inactiveIcon}
                                                    width={32}
                                                    height={32}
                                                    alt=""
                                                    className="w-6 h-6 lg:w-8 lg:h-8"
                                                />
                                            </span>
                                            <span
                                                className="truncate text-[14px] sm:text-[17px]"
                                                style={{
                                                    fontFamily: "var(--font-sans)",
                                                    fontWeight: 500,
                                                    lineHeight: "150%",
                                                    letterSpacing: 0,
                                                    color: "rgba(0,48,96,1)",
                                                }}
                                            >
                                                {type === "organization" ? "Organization Campaign" : "Individual Campaign"}
                                            </span>
                                        </div>
                                        {active && (
                                            <span
                                                className="shrink-0 flex items-center justify-center rounded-full"
                                                style={{ width: "18px", height: "18px", border: "2px solid rgba(2,104,192,1)", boxSizing: "border-box" }}
                                            >
                                                <span className="rounded-full" style={{ width: "8px", height: "8px", background: "rgba(2,104,192,1)" }} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.campaign_type && (
                            <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-2">{errors.campaign_type.message}</p>
                        )}
                    </div>
                </QuestionCard>

                {/* The remaining questions reveal once a campaign type is chosen. */}
                {selectedType && (
                <div className="reveal-up space-y-4 sm:space-y-6 lg:space-y-8">

                {/* Card 2: Campaign Name */}
                <QuestionCard
                    title="What's the name of your campaign?"
                    description="This will be the title that everyone sees. Make it clear and catchy!"
                    askBuddyText="Ask FundBuddy for your campaign description."
                    askBuddySuggestionsHeading="Hey there buddy, here are some great campaign name suggestions!"
                    askBuddySuggestions={[
                        "New Gear for Samuel's Soccer Team",
                        "Fund John's Wrestling Team's Travel Expenses",
                        "New Uniforms for Jason's Little League Team",
                    ]}
                >
                    <div>
                        <div className="relative">
                            <input
                                {...register("name")}
                                placeholder="e.g. New Helmets for the Bears Football Team!"
                                maxLength={50}
                                className={`${errors.name || nameTaken ? inputErrCls : inputCls} pr-16`}
                            />
                            <span className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-[12px] sm:text-[14px] text-[#8f98a3] font-medium">
                                Max. {50 - nameVal.length}
                            </span>
                        </div>
                        {errors.name && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        {nameTaken && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">A campaign with this name already exists. Please choose a different name.</p>}
                    </div>
                </QuestionCard>

                {/* Card 3: Your Info */}
                <QuestionCard
                    title="Tell us about yourself"
                    description="We'll use this to create your account and get your campaign started."
                >
                    <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <input
                                    {...register("first_name")}
                                    placeholder="First name"
                                    aria-label="First Name"
                                    className={errors.first_name ? inputErrCls : inputCls}
                                />
                                {errors.first_name && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <input
                                    {...register("last_name")}
                                    placeholder="Last name"
                                    aria-label="Last Name"
                                    className={errors.last_name ? inputErrCls : inputCls}
                                />
                                {errors.last_name && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                            </div>
                        </div>
                        <div>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="you@example.com"
                                aria-label="Email Address"
                                className={errors.email ? inputErrCls : inputCls}
                            />
                            {errors.email && <p data-field-error className="text-[9px] sm:text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>
                    </div>
                </QuestionCard>

                <p className="text-center text-sm sm:text-base text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-700 font-semibold hover:underline">Log In</Link>
                </p>
                </div>
                )}
            </div>

            {/* ── Fixed bottom nav ────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-[rgba(234,238,243,1)] px-4 md:px-10 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <Link
                    href="/"
                    className="flex items-center gap-3 transition-opacity hover:opacity-70 text-[rgba(0,48,96,1)] rounded-xl px-0.5 pt-3 pb-3.5"
                >
                    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                        <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                    <span className="w-px h-5 bg-[rgba(212,222,231,1)] shrink-0" />
                    <span className="hidden sm:inline text-base font-medium leading-[1.4]">Exit</span>
                </Link>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 transition active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100"
                    style={{
                        minWidth: 114, height: 42, borderRadius: 12, paddingLeft: 16, paddingRight: 16,
                        background: "rgba(2, 104, 192, 1)",
                        fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 16,
                        lineHeight: "100%", letterSpacing: "0.15px", color: "rgba(255, 255, 255, 1)",
                    }}
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
                        "Next"
                    )}
                </button>
            </div>

            {/* Account-exists notice + any server error — surfaced in the shared
                create-flow modal (same dialog used for errors elsewhere). */}
            {accountExists && (
                <AlertDialog
                    variant="info"
                    title="You already have an account"
                    message="An account with this email already exists. Log in to continue creating your campaign."
                    action={{ label: "Log In", onClick: () => router.push("/login") }}
                    onClose={() => setAccountExists(false)}
                />
            )}
            {serverError && (
                <AlertDialog message={serverError} onClose={() => setServerError(null)} />
            )}
        </div>
    );
}
