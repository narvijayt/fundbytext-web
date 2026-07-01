"use client";

/* Shared empty-state block for the dashboard tables (Donors / Participants).
   Matches the Figma "No donors yet" design: a coded two-card illustration,
   a navy heading, a muted subtitle, and an optional action button. Rendered
   inside the table card, below the (retained) blue column header. */

type Action = {
    label:    string;
    onClick:  () => void;
    variant?: "primary" | "secondary"; // primary = green "+ Add", secondary = neutral (e.g. Clear filters)
};

type Props = {
    title:    string;
    subtitle: string;
    action?:  Action;
};

/* Two overlapping "record" cards — recreated in code (no raster asset) to match
   the Figma illustration: a light card tilted right behind a gradient card
   tilted left, each with faint text lines. */
function StackedCardsIcon() {
    return (
        <div className="relative h-[46px] w-[52px]" aria-hidden="true">
            {/* back card */}
            <div className="absolute left-[22px] top-[3px] h-[34px] w-[27px] rounded-[4px] bg-[#f2f3f5]" style={{ transform: "rotate(10deg)" }}>
                <div className="absolute left-1/2 top-[19px] h-[2px] w-[17px] -translate-x-1/2 rounded-full bg-[#d7dae0]" />
                <div className="absolute left-1/2 top-[25px] h-[2px] w-[17px] -translate-x-1/2 rounded-full bg-[#d7dae0]" />
            </div>
            {/* front card */}
            <div className="absolute left-[3px] top-[1px] h-[43px] w-[36px] overflow-hidden rounded-[5px] bg-gradient-to-b from-[#e8eaee] to-[#b3b8c5]" style={{ transform: "rotate(-5.6deg)" }}>
                <div className="absolute left-[8px] top-[27px] h-[2px] w-[21px] rounded-full bg-white/75" />
                <div className="absolute left-[8px] top-[34px] h-[2px] w-[13px] rounded-full bg-white/75" />
            </div>
        </div>
    );
}

export default function TableEmptyState({ title, subtitle, action }: Props) {
    return (
        <div className="flex flex-col items-center gap-6 px-6 py-14">
            <StackedCardsIcon />

            <div className="flex max-w-sm flex-col items-center gap-2 text-center">
                <p className="text-[22px] font-black tracking-[-0.5px] text-[#003060] sm:text-[24px]">{title}</p>
                <p className="text-[15px] leading-relaxed text-[#7e8a96]">{subtitle}</p>
            </div>

            {action && (action.variant === "secondary" ? (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-[#dde0e3] bg-white px-4 pb-3 pt-2.5 text-[14px] font-semibold text-[#003060] transition-colors hover:bg-gray-50"
                >
                    {action.label}
                </button>
            ) : (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#28c45d] pb-3 pl-3.5 pr-4 pt-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-105"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    {action.label}
                </button>
            ))}
        </div>
    );
}
