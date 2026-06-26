"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const INQUIRY_TYPES = [
    "General Inquiry",
    "Campaign Support",
    "Partnership",
    "Feedback",
    "Press & Media",
    "Other",
] as const;

const schema = z.object({
    inquiry_type: z.enum(INQUIRY_TYPES),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    message: z.string().min(1, "Please enter a message"),
});

type FormData = z.infer<typeof schema>;

const fieldBox = "w-full h-14 px-5 rounded-[12px] border bg-white text-[16px] font-medium text-[#003060] placeholder:text-[#aeb5bd] placeholder:font-medium outline-none transition-all";
const fieldOk = "border-[#d4dee7] focus:border-[#0278de] focus:border-2 focus:shadow-[0px_8px_16px_-4px_rgba(2,104,192,0.16)]";
const fieldErr = "border-red-400 border-2";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <span className="font-black text-[12px] text-[#003060] tracking-[1px] uppercase">
            {children}{required && <span className="text-[#f47435]">*</span>}
        </span>
    );
}

export default function ContactForm() {
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { inquiry_type: "General Inquiry" },
    });

    async function onSubmit(data: FormData) {
        setServerError(null);
        const res = await fetch("/api/v1/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            setServerError("Something went wrong. Please try again.");
            return;
        }
        reset();
        setSubmitted(true);
    }

    return (
        <div className="w-full max-w-[698px] bg-white border border-[#eaeef3] rounded-[24px] p-6 sm:p-10 lg:p-14 shadow-[0_12px_12px_0_rgba(0,48,96,0.04),0_32px_40px_0_rgba(2,104,192,0.16)] flex flex-col gap-10">

            {submitted ? (
                <div className="flex flex-col items-center text-center gap-4 py-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(to bottom,#28c45d,#22a350)" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <h2 className="font-black text-[#003060] text-2xl tracking-[-0.5px]">Message sent!</h2>
                    <p className="text-[#57728d] text-base leading-relaxed max-w-[420px]">Thanks for reaching out — we&apos;ve received your message and will get back to you soon.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-1 font-bold text-[#0268c0] hover:underline">Send another message</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full">
                    {/* Inquiry Type */}
                    <div className="flex flex-col gap-3 w-full">
                        <Label required>Inquiry Type</Label>
                        <div className="relative">
                            <select {...register("inquiry_type")} className={`${fieldBox} ${fieldOk} appearance-none pr-12 cursor-pointer`}>
                                {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <svg className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8f98a3]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="flex flex-col gap-3 w-full">
                        <Label>Full Name</Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input {...register("first_name")} placeholder="First Name" className={`${fieldBox} ${errors.first_name ? fieldErr : fieldOk}`} />
                            </div>
                            <div className="flex-1">
                                <input {...register("last_name")} placeholder="Last Name" className={`${fieldBox} ${errors.last_name ? fieldErr : fieldOk}`} />
                            </div>
                        </div>
                        {(errors.first_name || errors.last_name) && (
                            <p className="text-xs text-red-500">{errors.first_name?.message ?? errors.last_name?.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-3 w-full">
                        <Label required>Email</Label>
                        <input {...register("email")} type="email" placeholder="you@example.com" className={`${fieldBox} ${errors.email ? fieldErr : fieldOk}`} />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-3 w-full">
                        <Label required>Message</Label>
                        <textarea {...register("message")} rows={5} placeholder="Your message here"
                            className={`w-full min-h-[140px] px-5 py-4 rounded-[12px] border bg-white text-[16px] font-medium text-[#003060] placeholder:text-[#aeb5bd] placeholder:font-medium outline-none resize-y transition-all ${errors.message ? fieldErr : fieldOk}`} />
                        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                    </div>

                    {serverError && <p className="text-sm text-red-500">{serverError}</p>}

                    {/* Submit */}
                    <button type="submit" disabled={isSubmitting}
                        className="w-full h-14 rounded-[16px] bg-[#f47435] text-white font-black text-sm tracking-[1px] uppercase shadow-[0px_20px_20px_-14px_rgba(234,103,37,0.2),0px_20px_40px_-16px_rgba(244,116,53,0.2)] hover:brightness-105 disabled:opacity-60 transition">
                        {isSubmitting ? "Sending…" : "Submit"}
                    </button>
                </form>
            )}

            {/* Contact Information */}
            <div className="flex flex-col gap-6 w-full">
                <div className="h-px bg-[#eaeef3] w-full" />
                <p className="font-black text-[12px] text-[#003060] tracking-[1px] uppercase">Contact Information</p>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(to bottom,#f47435,#ff8c53)", border: "1.5px solid #ff8c53", boxShadow: "0 4px 8px -2px rgba(244,116,53,0.6),0 12px 32px -2px rgba(244,116,53,0.6)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.4l8 5 8-5V6H4Zm16 2.5-7.47 4.67a1 1 0 0 1-1.06 0L4 8.5V18h16V8.5Z" /></svg>
                    </div>
                    <div>
                        <p className="font-black text-[#003060] text-xl leading-tight">Email</p>
                        <a href="mailto:support@fundbytext.com" className="font-normal text-[#57728d] text-lg hover:underline">support@fundbytext.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
