"use client";

import { type Member } from "./types";
import { QuestionCard } from "./ui";

const MAX = 160; // SMS-length thank-you note (per Figma "/160 Characters")

const DEFAULT_PLACEHOLDER =
    "Thank you so much for supporting this campaign, your support means a lot and makes a real difference. We truly appreciate your contribution and the positive impact it brings.";

type Props = {
    thankYou: string;
    setThankYou: (v: string) => void;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    isOrg: boolean;
    goalType: string;
    orgDisplayName: string;
    members: Member[];
};

export default function StepThankYou({
    thankYou, setThankYou,
    fieldErrors, clearFE,
    isOrg, goalType, orgDisplayName,
    members,
}: Props) {
    const used = thankYou.length;

    const organizer     = members.find((m) => m.roles.some((r) => r.role === "organizer"));
    const organizerName = organizer ? `${organizer.first_name} ${organizer.last_name}`.trim() : "";

    // Which of the three Figma variants to show:
    //  individual          → greeting "{Name}",  signed by the organizer
    //  org_goal            → greeting "{Donor}",  signed by organizer + organization
    //  participant_goal    → greeting "{Name}",   signed by {Participant Name} + organization
    const variant = !isOrg
        ? "individual"
        : goalType === "participant_goal" ? "participant" : "organization";

    const greetingToken = variant === "organization" ? "{Donor}" : "{Name}";
    const signerName =
        variant === "participant" ? "{Participant Name}" : (organizerName || "{Organizer Name}");
    const orgLine =
        variant === "individual" ? null : (orgDisplayName?.trim() || "{Organization}");

    // Avatar next to the sign-off: the organizer's photo for individual/org notes.
    // The participant-goal note is a per-recipient template ("{Participant Name}"),
    // so there's no single face to show — its avatar falls back to a person icon.
    const signerPhoto   = variant === "participant" ? null : (organizer?.profile_photo_url ?? organizer?.account_photo_url ?? null);
    const signerIsToken = signerName.startsWith("{");
    const signerInitials = signerIsToken
        ? ""
        : signerName.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
        <QuestionCard
            askBuddyText="Ask FundBuddy for your personalized thank you note."
            askBuddySuggestionsHeading="Hey there, let me help with your thank-you!"
            askBuddySuggestions={[
                "Keep it short and heartfelt — one or two sentences.",
                "Mention the impact their donation makes.",
                "A warm sign-off goes a long way.",
            ]}
        >
            {/* ── Letter card ─────────────────────────────────────────── */}
            <div className="w-full overflow-hidden rounded-2xl border border-[#dde0e3]">
                {/* Greeting header */}
                <div className="flex items-center border-b border-[#d4dee7] bg-[#f2f2f2] px-5 py-3.5 sm:px-8 sm:py-5">
                    <p className="text-[14px] sm:text-[15px] font-bold leading-[1.4] text-[#aeb5bd]">
                        Hi {greetingToken},
                    </p>
                </div>

                {/* Editable message + signature */}
                <div className="flex flex-col items-end gap-6 px-5 py-6 sm:px-9 sm:py-9">
                    <textarea
                        value={thankYou}
                        onChange={(e) => { setThankYou(e.target.value); clearFE("thank_you"); }}
                        maxLength={MAX}
                        rows={4}
                        placeholder={DEFAULT_PLACEHOLDER}
                        aria-label="Thank you message"
                        className="w-full resize-none bg-transparent text-[14px] sm:text-[15px] font-medium leading-[1.4] text-[#003060] outline-none placeholder:text-[#aeb5bd]"
                    />

                    {/* Signature (right-aligned letter sign-off) */}
                    <div className="flex flex-col items-end gap-2 text-right">
                        <p className="text-[14px] sm:text-[15px] font-medium leading-[1.4] text-[#003060]">
                            <span className="sm:hidden">Thanks,</span>
                            <span className="hidden sm:inline">Thank you so much,</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d4dee7] sm:size-7">
                                {signerPhoto ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={signerPhoto} alt="" className="size-full object-cover" />
                                ) : signerIsToken ? (
                                    <svg viewBox="0 0 24 24" fill="none" className="size-3.5 text-[#8fa0b3] sm:size-4"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.6 0-7 1.9-7 4.2V20h14v-1.8c0-2.3-3.4-4.2-7-4.2z" fill="currentColor" /></svg>
                                ) : (
                                    <span className="text-[9px] sm:text-[11px] font-bold text-[#7d8fa3]">{signerInitials}</span>
                                )}
                            </span>
                            <span className="text-[14px] sm:text-[15px] font-medium leading-[1.4] text-[#aeb5bd]">
                                {signerName}
                            </span>
                        </div>
                        {orgLine && (
                            <p className="text-[14px] sm:text-[15px] font-medium leading-[1.4] text-[#aeb5bd]">
                                {orgLine}
                            </p>
                        )}
                    </div>
                </div>

                {/* Character counter */}
                <div className="flex items-center border-t border-[#d4dee7] px-5 py-4 sm:px-9 sm:py-5">
                    <p className={`text-[12px] font-black uppercase leading-none tracking-[1px] ${
                        used >= MAX ? "text-[#f47435]" : "text-[#aeb5bd]"
                    }`}>
                        {used}/{MAX} Characters
                    </p>
                </div>
            </div>

            {fieldErrors.thank_you && (
                <p data-field-error className="mt-3 text-[13px] font-medium text-[#C9261D]">
                    {fieldErrors.thank_you}
                </p>
            )}
        </QuestionCard>
    );
}
