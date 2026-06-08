"use client";

import React from "react";

export const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-gray-400";
export const inputErrCls =
    "w-full border border-red-400 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400";

export function SectionTitle({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <h2 className={`text-base font-bold text-gray-900 ${className}`}>{children}</h2>
    );
}

export function Field({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

/* ── Step card shell ──────────────────────────────────────────────────── */
export function StepCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

/* ── Card question header ────────────────────────────────────────────── */
export function CardHeader({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="text-center px-6 pt-6 pb-4">
            <div className="flex justify-center mb-2 text-blue-600">{icon}</div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {description && (
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{description}</p>
            )}
        </div>
    );
}

/* ── FundBuddy AI helper bar ─────────────────────────────────────────── */
export function FundBuddyBar({
    text,
    onAsk,
}: {
    text: string;
    onAsk?: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-orange-50 border-t border-orange-100">
            <FundBuddyIcon className="w-9 h-9 shrink-0" />
            <p className="text-[11px] text-gray-600 flex-1 leading-relaxed">{text}</p>
            {onAsk && (
                <button
                    type="button"
                    onClick={onAsk}
                    className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-full transition-colors"
                >
                    Ask FundBuddy
                </button>
            )}
        </div>
    );
}

/* ── FundBuddy mascot SVG ────────────────────────────────────────────── */
export function FundBuddyIcon({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <ellipse cx="24" cy="28" rx="10" ry="12" fill="#F97316" />
            {/* Head */}
            <circle cx="24" cy="16" r="11" fill="#F97316" />
            {/* Face highlight */}
            <ellipse cx="24" cy="17" rx="7" ry="6" fill="#FB923C" />
            {/* Eyes */}
            <circle cx="20.5" cy="14.5" r="2.5" fill="white" />
            <circle cx="27.5" cy="14.5" r="2.5" fill="white" />
            <circle cx="21" cy="15" r="1.2" fill="#1e293b" />
            <circle cx="28" cy="15" r="1.2" fill="#1e293b" />
            {/* Eye shine */}
            <circle cx="21.5" cy="14.4" r="0.5" fill="white" />
            <circle cx="28.5" cy="14.4" r="0.5" fill="white" />
            {/* Smile */}
            <path d="M20 20 Q24 23.5 28 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Tail */}
            <path d="M16 36 Q10 40 6 37 Q10 42 18 38" fill="#F97316" />
            {/* Belly */}
            <ellipse cx="24" cy="29" rx="5.5" ry="7" fill="#FED7AA" />
        </svg>
    );
}

/* ── Step bubble (progress bar) ──────────────────────────────────────── */
export function StepBubble({
    num,
    label,
    icon,
    status,
    clickable,
    onClick,
    isLast,
}: {
    num: number;
    label: string;
    icon?: React.ReactNode;
    status: "done" | "current" | "pending";
    clickable?: boolean;
    onClick?: () => void;
    isLast?: boolean;
}) {
    const circleBase = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all";
    const circleColor =
        status === "done"    ? `${circleBase} bg-green-500 text-white` :
        status === "current" ? `${circleBase} bg-blue-700 text-white ring-4 ring-blue-100` :
                               `${circleBase} bg-gray-200 text-gray-400`;
    const labelColor =
        status === "current" ? "text-blue-700 font-bold" :
        status === "done"    ? "text-green-600 font-semibold" :
                               "text-gray-400";

    const inner = (
        <div className="flex flex-col items-center">
            {/* Icon above bubble */}
            <div className={`mb-1 h-6 flex items-end justify-center ${status === "pending" ? "opacity-30" : "opacity-100"}`}>
                {icon}
            </div>
            <div className={circleColor}>
                {status === "done" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <span>{num === 0 ? "" : num}</span>
                )}
            </div>
            <span className={`text-[9px] mt-1 uppercase tracking-wider whitespace-nowrap ${labelColor}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="flex items-center">
            {clickable ? (
                <button type="button" onClick={onClick} className="group focus:outline-none">
                    {inner}
                </button>
            ) : (
                inner
            )}
            {!isLast && (
                <div className={`w-8 sm:w-14 h-0.5 mb-7 mx-1 shrink-0 ${
                    status === "done" ? "bg-green-400" :
                    status === "current" ? "bg-blue-200" :
                    "bg-gray-200"
                }`} />
            )}
        </div>
    );
}

/* ── Thin card divider ───────────────────────────────────────────────── */
export function CardDivider() {
    return <div className="h-px bg-gray-100 mx-5" />;
}

/* ── Locked field display ────────────────────────────────────────────── */
export function LockedField({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {label}
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="normal-case font-normal text-gray-400">locked</span>
            </label>
            <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed select-none">
                {value}
            </div>
        </div>
    );
}
