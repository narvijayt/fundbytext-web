"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthField from "../_components/AuthField";
import CampaignCardsRow from "../_components/CampaignCardsRow";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
    remember_me: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    async function onSubmit(data: FormData) {
        setServerError(null);
        const res = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email, password: data.password, remember_me: data.remember_me ?? false }),
        });

        if (!res.ok) {
            const json = await res.json();
            setServerError(json.error ?? "Login failed");
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <>
            <div className="w-full max-w-[502px] bg-white border border-[#eaeef3] rounded-[24px] p-7 sm:p-10 lg:p-14 flex flex-col gap-8 lg:gap-10 shadow-[0_30px_60px_-20px_rgba(0,48,96,0.25)]">
            {/* Title. The Figma is drawn at 1920, so its 32px H1 / 18px body only apply
                from sm up — on a phone they're oversized for a ~300px-wide card and step
                down. (The field inputs stay at 16px regardless: below that, iOS zooms the
                page in on focus.) */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
                <h1 className="text-[22px] sm:text-[32px] font-black text-[#003060] tracking-[-1px] text-center leading-[1.15]">
                    Login to your{" "}
                    <span className="relative inline-block">
                        account<span className="font-normal text-[#f47435]">!</span>
                        <img alt="" src="/figma/underline.svg" className="absolute left-0 -bottom-2.5 w-full h-auto pointer-events-none" />
                    </span>
                </h1>
                <p className="text-[#003060] text-[14px] sm:text-lg text-center leading-[1.4]">
                    Welcome back! Login to access your account.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 lg:gap-10 w-full">
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-6 w-full">
                        <AuthField
                            label="Email" icon="mail" type="email" autoComplete="email"
                            placeholder="hello@website.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />
                        <AuthField
                            label="Password" icon="lock" type="password" autoComplete="current-password"
                            placeholder="Min. 6 characters"
                            error={errors.password?.message}
                            rightSlot={
                                <Link href="/forgot-password" className="text-[14px] font-medium text-[#8f98a3] hover:text-[#0268c0] transition-colors whitespace-nowrap">
                                    Forgot password?
                                </Link>
                            }
                            {...register("password")}
                        />
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer w-fit">
                        <input {...register("remember_me")} type="checkbox" className="w-4 h-4 rounded border-[#d4dee7] accent-[#0268c0]" />
                        <span className="text-[14px] sm:text-[16px] font-medium text-[#003060]">Remember me</span>
                    </label>

                    {serverError && <p className="text-sm text-red-500">{serverError}</p>}
                </div>

                <div className="flex flex-col items-center gap-6 w-full">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-[16px] bg-[#f47435] text-white font-black text-sm tracking-[1px] uppercase shadow-[0px_20px_20px_-14px_rgba(234,103,37,0.2),0px_20px_40px_-16px_rgba(244,116,53,0.2)] hover:brightness-105 disabled:opacity-60 transition"
                    >
                        {isSubmitting ? "Logging in…" : "Log In"}
                    </button>
                    {/* There is no public sign-up to send people to — an account is created
                        for you as you build your first campaign, so "Sign Up" promised a
                        page that doesn't exist. The link always pointed at /campaigns/create;
                        the label now says so, matching the header's "Start a Campaign" CTA. */}
                    <p className="text-[14px] sm:text-[16px] text-center leading-[1.4]">
                        <span className="font-medium text-[#8f98a3]">New to FundbyText? </span>
                        <Link href="/campaigns/create" className="font-bold text-[#0268c0] hover:underline">Start a Campaign</Link>
                        <span className="block text-[12px] sm:text-[13px] font-medium text-[#aeb5bd] mt-1">
                            We&apos;ll set up your account as you go — no separate sign-up.
                        </span>
                    </p>
                </div>
            </form>
            </div>

            <CampaignCardsRow />
        </>
    );
}
