"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export type Faq = { q: string; a: ReactNode };

/**
 * FAQ accordion for the policy-style doc card. One item open at a time; the first
 * is open on load so the card never reads as empty. Height animates via the
 * grid-rows 0fr→1fr trick (no JS measuring), and collapses to nothing so reduced
 * motion just snaps.
 */
export default function FaqAccordion({ items }: { items: Faq[] }) {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <div className="w-full divide-y divide-[#eef1f4]">
            {items.map((it, i) => {
                const isOpen = open === i;
                return (
                    <div key={i}>
                        <h3>
                            <button
                                type="button"
                                onClick={() => setOpen(isOpen ? null : i)}
                                aria-expanded={isOpen}
                                className="flex w-full items-center justify-between gap-4 py-5 text-left lg:py-6"
                            >
                                <span className="font-bold text-[#003060] text-[16px] lg:text-[18px] 2xl:text-[20px] leading-snug">
                                    {it.q}
                                </span>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-[#0268c0] text-white" : "bg-[#eef5fc] text-[#0268c0]"}`}>
                                    <svg className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                            <div className="overflow-hidden">
                                <p className="pb-5 pr-8 lg:pb-6 text-[15px] lg:text-[16px] 2xl:text-[18px] leading-[1.6] text-[#2f3a45]">
                                    {it.a}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
