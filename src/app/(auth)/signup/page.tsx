"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z
    .object({
        first_name: z.string().min(1, "Required").max(100),
        last_name: z.string().min(1, "Required").max(100),
        email: z.string().email("Enter a valid email"),
        confirm_email: z.string().email(),
        phone: z.string().max(20).optional(),
        password: z.string().min(6, "Min. 6 characters"),
        confirm_password: z.string().min(6),
        terms: z.literal(true, { message: "You must agree to the terms" }),
    })
    .refine((d) => d.email === d.confirm_email, {
        message: "Emails do not match",
        path: ["confirm_email"],
    })
    .refine((d) => d.password === d.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPhotoError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) {
            setPhotoError("Only JPEG, PNG, WebP, or GIF allowed");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPhotoError("File must be under 5MB");
            return;
        }

        setPhotoFile(file);
        setPreview(URL.createObjectURL(file));
    }

    async function onSubmit(data: FormData) {
        setServerError(null);

        let profile_photo_url: string | undefined;

        if (photoFile) {
            const fd = new globalThis.FormData();
            fd.append("photo", photoFile);
            const uploadRes = await fetch("/api/v1/upload/profile-photo", {
                method: "POST",
                body: fd,
            });
            if (!uploadRes.ok) {
                const json = await uploadRes.json();
                setServerError(json.error ?? "Photo upload failed");
                return;
            }
            const { url } = await uploadRes.json();
            profile_photo_url = url;
        }

        const res = await fetch("/api/v1/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone || undefined,
                password: data.password,
                profile_photo_url,
            }),
        });

        if (!res.ok) {
            const json = await res.json();
            setServerError(json.error ?? "Signup failed");
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Create an <span className="underline decoration-orange-500">Account</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Join us today and unlock exclusive benefits! Sign up in just a few steps.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Profile Photo */}
                <div className="flex items-center gap-4 mb-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:border-orange-400 transition-colors shrink-0"
                    >
                        {preview ? (
                            <Image
                                src={preview}
                                alt="Profile preview"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl text-gray-400">+</span>
                        )}
                    </button>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Upload a profile photo</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full transition-colors"
                        >
                            Upload
                        </button>
                        {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Full Name
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                {...register("first_name")}
                                placeholder="First Name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                            {errors.first_name && (
                                <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>
                            )}
                        </div>
                        <div>
                            <input
                                {...register("last_name")}
                                placeholder="Last Name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                            {errors.last_name && (
                                <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Email Address
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="Enter a valid email address"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <input
                                {...register("confirm_email")}
                                type="email"
                                placeholder="Confirm valid email address"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                            {errors.confirm_email && (
                                <p className="text-xs text-red-500 mt-1">{errors.confirm_email.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Phone
                    </label>
                    <input
                        {...register("phone")}
                        type="tel"
                        placeholder="(214) 987-6543"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Password
                    </label>
                    <input
                        {...register("password")}
                        type="password"
                        placeholder="Enter a password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    {errors.password && (
                        <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Confirm Password
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

                {/* Terms */}
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        {...register("terms")}
                        type="checkbox"
                        className="mt-0.5 rounded"
                    />
                    <span>
                        By signing up, you confirm that you agree to FundByText&apos;s{" "}
                        <span className="text-orange-500 font-semibold">Terms of Service</span> and
                        acknowledge our{" "}
                        <span className="text-orange-500 font-semibold">Privacy Policy</span>.
                    </span>
                </label>
                {errors.terms && (
                    <p className="text-xs text-red-500">{errors.terms.message}</p>
                )}

                {serverError && (
                    <p className="text-sm text-red-500">{serverError}</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors tracking-widest uppercase text-sm"
                >
                    {isSubmitting ? "Creating account…" : "+ Create Your Account"}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 font-semibold hover:underline">
                    Sign In
                </Link>
            </p>
        </div>
    );
}
