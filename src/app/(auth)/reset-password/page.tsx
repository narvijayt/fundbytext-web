"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthField from "../_components/AuthField";

const schema = z
    .object({
        password: z.string().min(6, "Min. 6 characters"),
        confirm_password: z.string().min(6, "Min. 6 characters"),
    })
    .refine((d) => d.password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type FormData = z.infer<typeof schema>;

// Shared card chrome — identical to the login / forgot-password cards. The Figma is
// a 1920-board design, so paddings/gaps/sizes step down below sm for phones.
const CARD =
    "w-full max-w-[502px] bg-white border border-[#eaeef3] rounded-[24px] p-6 sm:p-10 lg:p-14 flex flex-col gap-6 sm:gap-8 lg:gap-10 shadow-[0_30px_60px_-20px_rgba(0,48,96,0.25)]";
const CTA =
    "w-full h-12 sm:h-14 rounded-[16px] bg-[#f47435] text-white font-black text-[13px] sm:text-sm tracking-[1px] uppercase shadow-[0px_20px_20px_-14px_rgba(234,103,37,0.2),0px_20px_40px_-16px_rgba(244,116,53,0.2)] hover:brightness-105 disabled:opacity-60 transition flex items-center justify-center";

function ResetPasswordForm() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    const [serverError, setServerError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    async function onSubmit(data: FormData) {
        setServerError(null);
        const res = await fetch("/api/v1/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, token, password: data.password }),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setServerError(json.error ?? "Reset failed. Please try again.");
            return;
        }

        // Show a branded success beat, then hand off to login.
        setDone(true);
        setTimeout(() => router.push("/login"), 1400);
    }

    // ── Invalid / missing link ────────────────────────────────────────────────
    if (!token || !email) {
        return (
            <div className={CARD}>
                <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#feece4]">
                        <svg className="h-7 w-7 text-[#f47435]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.3 4.3a2.4 2.4 0 0 1 3.4 0l6 6a2.4 2.4 0 0 1 0 3.4l-3.6 3.6a2.4 2.4 0 0 1-3.4 0M13.7 19.7a2.4 2.4 0 0 1-3.4 0l-6-6a2.4 2.4 0 0 1 0-3.4l1.6-1.6" />
                            <path d="M15 9l-6 6" />
                        </svg>
                    </span>
                    <h1 className="text-[22px] sm:text-[32px] font-black text-[#003060] tracking-[-1px] leading-[1.15]">
                        This link isn&apos;t valid
                    </h1>
                    <p className="text-[#003060] text-[14px] sm:text-lg leading-[1.4]">
                        Your reset link is invalid or has expired. Request a fresh one and we&apos;ll email it to you.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
                    <Link href="/forgot-password" className={CTA}>Request a new link</Link>
                    <p className="text-[14px] sm:text-[16px] text-center">
                        <span className="font-medium text-[#8f98a3]">Remembered it? </span>
                        <Link href="/login" className="font-bold text-[#0268c0] hover:underline">Log In</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className={CARD}>
                <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ee]">
                        <svg className="h-7 w-7 text-[#26ba58]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>
                    <h1 className="text-[22px] sm:text-[32px] font-black text-[#003060] tracking-[-1px] leading-[1.15]">
                        Password updated!
                    </h1>
                    <p className="text-[#003060] text-[14px] sm:text-lg leading-[1.4]">
                        Your password has been changed. Taking you to login…
                    </p>
                </div>
                <Link href="/login" className="font-bold text-[#0268c0] hover:underline text-[14px] sm:text-[16px] text-center">
                    Go to Login now
                </Link>
            </div>
        );
    }

    // ── Set-password form ─────────────────────────────────────────────────────
    return (
        <div className={CARD}>
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                <h1 className="text-[22px] sm:text-[32px] font-black text-[#003060] tracking-[-1px] leading-[1.15]">
                    Set a new Password
                </h1>
                <p className="text-[#003060] text-[14px] sm:text-lg leading-[1.4]">
                    Choose a strong password to secure your account.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full">
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-6 w-full">
                        <AuthField
                            label="New Password" icon="lock" type="password" autoComplete="new-password"
                            placeholder="Min. 6 characters"
                            error={errors.password?.message}
                            {...register("password")}
                        />
                        <AuthField
                            label="Confirm Password" icon="lock" type="password" autoComplete="new-password"
                            placeholder="Re-enter your password"
                            error={errors.confirm_password?.message}
                            {...register("confirm_password")}
                        />
                    </div>
                    {serverError && <p className="text-sm text-red-500 text-center">{serverError}</p>}
                </div>

                <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
                    <button type="submit" disabled={isSubmitting} className={CTA}>
                        {isSubmitting ? "Updating…" : "Set New Password"}
                    </button>
                    <p className="text-[14px] sm:text-[16px] text-center">
                        <span className="font-medium text-[#8f98a3]">Remember your password? </span>
                        <Link href="/login" className="font-bold text-[#0268c0] hover:underline">Log In</Link>
                    </p>
                </div>
            </form>
        </div>
    );
}

// Branded skeleton for the brief useSearchParams suspense — mirrors the card so it
// doesn't flash a bare "Loading…".
function ResetSkeleton() {
    return (
        <div className={`${CARD} animate-pulse`} aria-hidden>
            <div className="flex flex-col items-center gap-3 w-full">
                <div className="h-7 w-3/5 rounded-full bg-[#eaeef3]" />
                <div className="h-4 w-4/5 rounded-full bg-[#eaeef3]" />
            </div>
            <div className="flex flex-col gap-6 w-full">
                <div className="h-12 sm:h-14 w-full rounded-[12px] bg-[#eaeef3]" />
                <div className="h-12 sm:h-14 w-full rounded-[12px] bg-[#eaeef3]" />
            </div>
            <div className="h-12 sm:h-14 w-full rounded-[16px] bg-[#f2f2f2]" />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetSkeleton />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
