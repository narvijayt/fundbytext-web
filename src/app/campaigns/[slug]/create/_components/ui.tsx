"use client";

import React from "react";
import Image from "next/image";

/* ── Page background — shared gradient + drifting "Vector" wallpaper ──
   Used behind every step of the campaign-creation flow (both the public
   /campaigns/create step 1 and the [slug]/create wizard) so the whole
   journey feels continuous. */
export const PAGE_GRADIENT =
    "linear-gradient(180deg, rgba(33,150,253,1) 0%, rgba(174,217,254,1) 55%, rgba(255,255,255,1) 100%)";

const VECTOR_TILE_SIZE = 170;
const VECTOR_TEXTURE_URL =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${VECTOR_TILE_SIZE}' height='${VECTOR_TILE_SIZE}'%3E` +
    `%3Cg transform='translate(16,12)'%3E%3Cpath d='m23.28 76.64l18.97-6.62 9.55-34.07-12.37-35.43-29.27 10.22c-8.19 2.86-12.49 11.93-9.58 20.25l7.1 20.36 10.96-3.83-4.98-14.26c-0.67-1.95 0.33-4.08 2.25-4.75l22.79-7.96 2 5.73-19.75 6.89 2.4 6.86 17.5-6.11 1.82 5.23-17.46 6.09-1.9 31.39z' fill='%23003060'/%3E%3C/g%3E` +
    `%3Cg transform='translate(96,90)'%3E%3Cpath d='M27.9717 0L9.09569 6.86879L0 41.0623L12.8348 76.3241L41.9651 65.7237C50.1204 62.752 54.2958 53.6262 51.279 45.3431L43.9061 25.0827L32.9973 29.0551L38.1658 43.2516C38.8655 45.1926 37.895 47.3292 35.9765 48.0289L13.3012 56.282L11.2248 50.5868L30.8757 43.4321L28.3855 36.601L10.969 42.9431L9.08063 37.7445L26.4595 31.4174L27.9491 0.00752493L27.9717 0Z' fill='%23003060'/%3E%3C/g%3E` +
    `%3C/svg%3E`;

/* Drifting vector wallpaper — dense repeating texture over the gradient,
   stays behind cards, logo, header, progress bar & footer (render it as the
   first child of a `relative isolate` wrapper, give chrome bars `relative z-40`). */
export function VectorWallpaper() {
    return (
        <div
            className="absolute inset-0 -z-10 opacity-[0.16] pointer-events-none"
            style={{
                backgroundImage: `url("${VECTOR_TEXTURE_URL}")`,
                backgroundRepeat: "repeat",
                backgroundSize: `${VECTOR_TILE_SIZE}px ${VECTOR_TILE_SIZE}px`,
                animation: "driftLeft 18s linear infinite",
                WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 50%, transparent 95%)",
                maskImage: "linear-gradient(180deg, #000 0%, #000 50%, transparent 95%)",
            }}
        />
    );
}

const focusGradientCls =
    "focus:outline-none focus:border-2 focus:border-transparent focus:[background-image:linear-gradient(#fff,#fff),linear-gradient(95.84deg,#0278DE_40.72%,#AED9FE_50%,#0278DE_59.28%)] focus:[background-origin:border-box] focus:[background-clip:padding-box,border-box]";

export const inputCls =
    `w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white ${focusGradientCls} placeholder:text-gray-400`;
export const inputErrCls =
    `w-full border border-red-400 rounded-xl px-4 py-3 text-sm bg-white ${focusGradientCls} placeholder:text-gray-400`;

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

/* ── QuestionCard ──────────────────────────────────────────────────────
   Shared "question card" shell used across the create-campaign flows
   (both the public /campaigns/create step 1 and the [slug]/create wizard). */
export function QuestionCard({
    title,
    description,
    askBuddyText,
    children,
}: {
    title: string;
    description?: string;
    askBuddyText?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0px 32px 40px -16px rgba(2,104,192,0.3), 0px 12px 12px -8px rgba(2,104,192,0.06)" }}
        >
            <div className="px-6 sm:px-14 pt-8 sm:pt-14 pb-8 sm:pb-16 flex flex-col gap-8 sm:gap-12">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Image src="/assets/campaigns/question-flag.svg" width={24} height={24} alt="" />
                        <h3
                            className="font-black text-[18px] sm:text-[22px]"
                            style={{ lineHeight: "125%", letterSpacing: 0, color: "rgba(2,104,192,1)" }}
                        >
                            {title}
                        </h3>
                    </div>
                    {description && (
                        <p
                            className="text-base sm:text-xl leading-[140%] lg:leading-[115%]"
                            style={{ letterSpacing: 0, color: "rgba(0,48,96,1)" }}
                        >
                            {description}
                        </p>
                    )}
                </div>
                {children}
                {askBuddyText && (
                    <div
                        className="flex items-center gap-2.25"
                        style={{
                            borderRadius: 16,
                            paddingTop: 18,
                            paddingRight: 24,
                            paddingBottom: 18,
                            paddingLeft: 16,
                            border: "2px solid rgba(221,224,227,1)",
                        }}
                    >
                        <Image
                            src="/assets/campaigns/ask-buddy.svg"
                            width={64}
                            height={80}
                            alt=""
                            className="shrink-0 w-7.5 h-10 sm:w-[55.65px] sm:h-20"
                        />
                        <p
                            className="text-xs sm:text-lg"
                            style={{
                                fontFamily: "var(--font-satoshi, 'Satoshi Variable', sans-serif)",
                                fontWeight: 400,
                                lineHeight: "140%",
                                letterSpacing: 0,
                                color: "rgba(0,48,96,1)",
                            }}
                        >
                            {askBuddyText}
                        </p>
                    </div>
                )}
            </div>
        </div>
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
