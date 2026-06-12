"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProgressBar } from "@/app/campaigns/[slug]/create/_components/WizardNav";
import { QuestionCard, PAGE_GRADIENT, VectorWallpaper, inputCls, inputErrCls } from "@/app/campaigns/[slug]/create/_components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
    campaign_type: z.enum(["individual", "organization"], { message: "Please select a campaign type" }),
    name: z.string().min(1, "Campaign name is required").max(50),
});

type FormData = z.infer<typeof schema>;

export default function AuthCreateCampaignForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [nameTaken, setNameTaken] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) });

    const selectedType = watch("campaign_type");
    const nameVal = watch("name") ?? "";

    async function onSubmit(data: FormData) {
        setServerError(null);
        setNameTaken(false);
        const [res] = await Promise.all([
            fetch("/api/v1/campaigns/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
            new Promise((r) => setTimeout(r, 800)),
        ]);
        const contentType = res.headers.get("content-type") ?? "";
        const json = contentType.includes("application/json")
            ? await res.json()
            : { error: "An unexpected error occurred. Please try again." };
        if (res.status === 409 && json.code === "name_taken") {
            setNameTaken(true);
            return;
        }
        if (!res.ok) {
            setServerError(json.error ?? "Something went wrong. Please try again.");
            return;
        }
        router.push(`/campaigns/${json.campaign.slug}/create`);
    }

    return (
        <div className="wizard-scale-90 relative isolate min-h-screen pb-24" style={{ background: PAGE_GRADIENT }}>

            <VectorWallpaper />

            {/* ── Top header bar + progress bar — single shared white background,
            so no seam/gap shows the page background between them ───────── */}
            <div className="relative z-40 bg-white w-full">
                <div className="h-15.5 md:h-22 mb-2 md:mb-4">
                    <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-10">
                        <Link href="/dashboard" className="flex items-center transition-opacity hover:opacity-70 shrink-0">
                            <Image
                                src="/assets/campaigns/app-logo.svg"
                                width={34}
                                height={48}
                                alt="FundbyText"
                                className="app-logo w-5.25 h-7.5 md:w-8.5 md:h-12"
                            />
                        </Link>
                        <h1
                            className="text-center font-black text-base md:text-[28.8px]"
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

            {/* ── Step banner ─────────────────────────────────────────── */}
            <div className="relative px-6 pt-8 pb-6 text-center">
                <div className="relative z-10 flex justify-center">
                    <Image
                        src="/assets/campaigns/header-title.png"
                        alt="Campaign Details — On your mark get set… Go!"
                        width={599}
                        height={182}
                        className="hidden sm:block w-auto h-auto max-w-full max-h-16 lg:max-h-24 xl:max-h-28"
                        priority
                    />
                    <Image
                        src="/assets/campaigns/header-title-mobile.png"
                        alt="Campaign Details — On your mark get set… Go!"
                        width={353}
                        height={144}
                        className="sm:hidden w-auto h-auto max-w-full max-h-14"
                        priority
                    />
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
                            : "Individual Campaigns are for a single person like yourself."
                    }
                >
                    <div>
                        <div className="flex flex-col lg:flex-row gap-[16px]">
                            {(["organization", "individual"] as const).map((type) => {
                                const active = selectedType === type;
                                const activeIcon   = type === "organization" ? "/assets/campaigns/organization-active.svg"     : "/assets/campaigns/individual-active.svg";
                                const inactiveIcon = type === "organization" ? "/assets/campaigns/organizational-icon.svg"     : "/assets/campaigns/individual-inactive.svg";
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setValue("campaign_type", type, { shouldValidate: true })}
                                        className="flex-1 min-w-0 h-15 lg:h-17 flex items-center justify-between bg-white text-left transition-all"
                                        style={{
                                            gap: "7.2px",
                                            borderRadius: "14.4px",
                                            paddingTop: "16.2px",
                                            paddingRight: "21.6px",
                                            paddingBottom: "16.2px",
                                            paddingLeft: "14.4px",
                                            border: active ? "1.8px solid transparent" : "1.8px solid rgba(212,222,231,1)",
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
                                                className="truncate text-[11.6px] lg:text-[13.4px] xl:text-[17px]"
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
                                                className="shrink-0"
                                                style={{
                                                    width: "14.4px",
                                                    height: "14.4px",
                                                    borderRadius: "90px",
                                                    border: "3.6px solid rgba(2,104,192,1)",
                                                    boxSizing: "border-box",
                                                }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.campaign_type && (
                            <p className="text-[9px] sm:text-xs text-red-500 mt-2">{errors.campaign_type.message}</p>
                        )}
                    </div>
                </QuestionCard>

                {/* Card 2: Campaign Name */}
                <QuestionCard
                    title="What's the name of your campaign?"
                    description="This will be the title that everyone sees. Make it clear and catchy!"
                    askBuddyText="Ask FundBuddy for your campaign description — our AI will suggest a great name based on your cause."
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
                                placeholder="e.g. Rising Stars Cricket Fund"
                                maxLength={50}
                                className={`${errors.name || nameTaken ? inputErrCls : inputCls} pr-16`}
                            />
                            <span className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-[9px] sm:text-xs text-gray-400 font-medium">
                                {nameVal.length}/50
                            </span>
                        </div>
                        {errors.name && <p className="text-[9px] sm:text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        {nameTaken && <p className="text-[9px] sm:text-xs text-red-500 mt-1">A campaign with this name already exists. Please choose a different name.</p>}
                    </div>
                </QuestionCard>

                {serverError && (
                    <p className="text-sm sm:text-base text-red-500 text-center">{serverError}</p>
                )}
            </div>

            {/* ── Fixed bottom nav ────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-[rgba(234,238,243,1)] px-4 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "rgba(0,64,149,1)" }}
                >
                    <span className="text-base leading-none">✕</span>
                    <span className="w-px h-4 bg-current opacity-30 shrink-0" />
                    <span className="hidden sm:inline">Exit</span>
                </Link>
                <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: "rgba(2,104,192,1)" }}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Creating…
                        </>
                    ) : (
                        "Next"
                    )}
                </button>
            </div>
        </div>
    );
}
