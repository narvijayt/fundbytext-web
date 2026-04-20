"use client";

import React from "react";

export const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
export const inputErrCls =
    "w-full border border-red-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";

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
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export function StepBubble({
    num,
    label,
    status,
    clickable,
    onClick,
}: {
    num: number;
    label: string;
    status: "done" | "current" | "pending";
    clickable?: boolean;
    onClick?: () => void;
}) {
    const circleColor =
        status === "done"    ? "bg-orange-500 text-white" :
        status === "current" ? "bg-orange-500 text-white ring-4 ring-orange-100" :
                               "bg-gray-200 text-gray-500";
    const labelColor =
        status === "current" ? "text-orange-600 font-semibold" : "text-gray-400";

    const bubble = (
        <div className="flex flex-col items-center">
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${circleColor} ${clickable ? "group-hover:scale-110" : ""}`}
            >
                {status === "done" ? "✓" : num}
            </div>
            <span className={`text-[10px] mt-1 uppercase tracking-wide ${labelColor} ${clickable ? "group-hover:text-orange-500" : ""}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="flex items-center">
            {clickable ? (
                <button
                    type="button"
                    onClick={onClick}
                    title={`Go to ${label}`}
                    className="group flex flex-col items-center cursor-pointer focus:outline-none"
                >
                    {bubble}
                </button>
            ) : (
                <div className="flex flex-col items-center">
                    {bubble}
                </div>
            )}
            {num < 5 && (
                <div
                    className={`w-6 sm:w-10 h-0.5 mb-4 mx-0.5 shrink-0 ${
                        status === "done" ? "bg-orange-400" : "bg-gray-200"
                    }`}
                />
            )}
        </div>
    );
}
