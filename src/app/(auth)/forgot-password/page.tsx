"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Forgot your Password?</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Enter your email address below and we&apos;ll send you a link to reset your
                    password.
                </p>
            </div>

            {submitted ? (
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-700">
                        If that email exists, a reset link has been sent.
                    </p>
                    {devUrl && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                            <p className="text-xs font-semibold text-yellow-700 mb-1">
                                Dev mode — reset link:
                            </p>
                            <a
                                href={devUrl}
                                className="text-xs text-sky-600 break-all hover:underline"
                            >
                                {devUrl}
                            </a>
                        </div>
                    )}
                    <Link
                        href="/login"
                        className="block text-sm text-orange-500 font-semibold hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            placeholder="thea@creativenomads.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors tracking-widest uppercase text-sm"
                    >
                        {isSubmitting ? "Sending…" : "Reset Password"}
                    </button>
                </form>
            )}

            {!submitted && (
                <p className="text-center text-sm text-gray-500 mt-6">
                    Want to start a fundraiser?{" "}
                    <Link href="/campaigns/create" className="text-orange-500 font-semibold hover:underline">
                        Create a Campaign
                    </Link>
                </p>
            )}
        </div>
    );
}
