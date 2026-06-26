"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

function FieldIcon({ name }: { name: "mail" | "lock" }) {
    if (name === "mail") return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f98a3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4.5" width="20" height="15" rx="3" />
            <path d="M3 6.5l9 6 9-6" />
        </svg>
    );
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f98a3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
            <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            <circle cx="12" cy="15.5" r="1.3" />
        </svg>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    if (open) return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" />
        </svg>
    );
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8" />
            <path d="M9.4 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.7 3.3M6.2 7.3A15.9 15.9 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9.4 9.4 0 0 0 3.3-.6" />
        </svg>
    );
}

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon: "mail" | "lock";
    error?: string;
    rightSlot?: ReactNode;
};

const AuthField = forwardRef<HTMLInputElement, Props>(function AuthField(
    { label, icon, error, rightSlot, type = "text", className, ...props }, ref,
) {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (show ? "text" : "password") : type;

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between gap-3">
                <label className="font-black text-[12px] text-[#003060] tracking-[1px] uppercase">
                    {label}<span className="text-[#f47435]">*</span>
                </label>
                {rightSlot}
            </div>
            <div className={`flex items-center gap-2 h-14 px-5 rounded-[12px] border bg-white transition-all ${error
                ? "border-red-400 border-2"
                : "border-[#d4dee7] focus-within:border-[#0278de] focus-within:border-2 focus-within:shadow-[0px_8px_16px_-4px_rgba(2,104,192,0.16)]"}`}>
                <FieldIcon name={icon} />
                <input
                    ref={ref}
                    type={inputType}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[16px] font-medium text-[#003060] placeholder:text-[#8f98a3] placeholder:font-medium"
                    {...props}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow((s) => !s)}
                        aria-label={show ? "Hide password" : "Show password"}
                        className="text-[#8f98a3] hover:text-[#0268c0] transition-colors shrink-0">
                        <EyeIcon open={show} />
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
});

export default AuthField;
