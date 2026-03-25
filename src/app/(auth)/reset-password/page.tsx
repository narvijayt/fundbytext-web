"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense } from "react";

const schema = z
    .object({
        password: z.string().min(6, "Min. 6 characters"),
        confirm_password: z.string().min(6),
    })
    .refine((d) => d.password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    const [serverError, setServerError] = useState<string | null>(null);

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
            const json = await res.json();
            setServerError(json.error ?? "Reset failed");
            return;
        }

        router.push("/login");
    }

    if (!token || !email) {
        return (
            <div className="text-center text-sm text-gray-600">
                Invalid reset link.{" "}
                <Link href="/forgot-password" className="text-orange-500 hover:underline">
                    Request a new one
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    New Password
                </label>
                <input
                    {...register("password")}
                    type="password"
                    placeholder="Min. 6 characters"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Confirm New Password
                </label>
                <input
                    {...register("confirm_password")}
                    type="password"
                    placeholder="Confirm password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                {errors.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
                )}
            </div>

            {serverError && <p className="text-sm text-red-500">{serverError}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors tracking-widest uppercase text-sm"
            >
                {isSubmitting ? "Updating…" : "Set New Password"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Choose a strong password for your account.
                </p>
            </div>
            <Suspense fallback={<p className="text-sm text-gray-500 text-center">Loading…</p>}>
                <ResetPasswordForm />
            </Suspense>
            <p className="text-center text-sm text-gray-500 mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-orange-500 font-semibold hover:underline">
                    Log In
                </Link>
            </p>
        </div>
    );
}
