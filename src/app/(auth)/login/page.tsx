"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Login to your <span className="underline decoration-orange-500">account!</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Welcome back! Login to access your account.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register("email")}
                        type="email"
                        placeholder="hello@website.com"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-gray-500 hover:text-sky-600"
                        >
                            Forgot password?
                        </Link>
                    </div>
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

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input {...register("remember_me")} type="checkbox" className="rounded" />
                    Remember me
                </label>

                {serverError && (
                    <p className="text-sm text-red-500">{serverError}</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors tracking-widest uppercase text-sm"
                >
                    {isSubmitting ? "Logging in…" : "Log In"}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                New to FundbyText?{" "}
                <Link href="/signup" className="text-orange-500 font-semibold hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>
    );
}
