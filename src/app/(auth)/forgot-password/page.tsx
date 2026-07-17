"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthField from "../_components/AuthField";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [devUrl, setDevUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    async function onSubmit(data: FormData) {
        const res = await fetch("/api/v1/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await res.json();
        if (json.reset_url) setDevUrl(json.reset_url);
        setSubmitted(true);
    }

    return (
        <div className="w-full max-w-[502px] bg-white border border-[#eaeef3] rounded-[24px] p-6 sm:p-10 lg:p-14 flex flex-col gap-6 sm:gap-8 lg:gap-10 shadow-[0_30px_60px_-20px_rgba(0,48,96,0.25)]">
            {/* Title. The Figma is drawn at 1920, so its 32px H1 / 18px body only apply
                from sm up — on a phone they're oversized for a ~300px-wide card and step
                down, matching the login card. (The AuthField input stays at 16px at every
                width: below that, iOS zooms the page in on focus.) */}
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                <h1 className="text-[22px] sm:text-[32px] font-black text-[#003060] tracking-[-1px] leading-[1.15]">
                    Forgot your Password?
                </h1>
                <p className="text-[#003060] text-[14px] sm:text-lg leading-[1.4]">
                    Enter your email address below and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            {submitted ? (
                <div className="flex flex-col items-center gap-6 w-full text-center">
                    <div className="w-full rounded-[12px] bg-[#eaf6ee] border border-[#bfe3cd] p-4">
                        <p className="text-sm text-[#1c7a43] font-medium">
                            If that email exists, a reset link has been sent. Check your inbox.
                        </p>
                    </div>
                    {devUrl && (
                        <div className="w-full bg-[#fff7e6] border border-[#ffe2a8] rounded-[12px] p-3 text-left">
                            <p className="text-xs font-bold text-[#b97400] mb-1 uppercase tracking-[1px]">Dev mode — reset link</p>
                            <a href={devUrl} className="text-xs text-[#0268c0] break-all hover:underline">{devUrl}</a>
                        </div>
                    )}
                    <Link href="/login" className="font-bold text-[#0268c0] hover:underline text-[14px] sm:text-[16px]">Back to Login</Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full">
                    <AuthField
                        label="Email" icon="mail" type="email" autoComplete="email"
                        placeholder="thea@creativenomads.com"
                        error={errors.email?.message}
                        {...register("email")}
                    />

                    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 sm:h-14 rounded-[16px] bg-[#f47435] text-white font-black text-[13px] sm:text-sm tracking-[1px] uppercase shadow-[0px_20px_20px_-14px_rgba(234,103,37,0.2),0px_20px_40px_-16px_rgba(244,116,53,0.2)] hover:brightness-105 disabled:opacity-60 transition"
                        >
                            {isSubmitting ? "Sending…" : "Reset Password"}
                        </button>
                        <p className="text-[14px] sm:text-[16px] text-center">
                            <span className="font-medium text-[#8f98a3]">Remember your password? </span>
                            <Link href="/login" className="font-bold text-[#0268c0] hover:underline">Log In</Link>
                        </p>
                    </div>
                </form>
            )}
        </div>
    );
}
