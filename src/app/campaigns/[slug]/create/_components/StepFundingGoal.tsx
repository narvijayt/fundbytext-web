"use client";

import Image from "next/image";
import { type Payout } from "./types";
import { QuestionCard, Stepper, inputCls, inputErrCls } from "./ui";

type Props = {
    isOrg: boolean;
    goalType: string;
    setGoalType: (v: string) => void;
    goalAmount: string;
    setGoalAmount: (v: string) => void;
    donorsPerParticipant: string;
    setDonorsPerParticipant: (v: string) => void;
    payout: Payout;
    setPayout: (p: Payout) => void;
    orgDisplayName: string;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    isLaunched: boolean;
};

/* ── Goal-type icons (individual). currentColor → blue when selected, gray when not ── */
function TrendUpIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${active ? "text-[#0268c0]" : "text-[#aeb5bd]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16l5-5 3 3 7-7" />
            <path d="M16 7h4v4" />
        </svg>
    );
}
function TargetIcon({ active }: { active: boolean }) {
    return (
        <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${active ? "text-[#0268c0]" : "text-[#aeb5bd]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
    );
}

type GoalOpt = { value: string; label: string; info: string; icon: (active: boolean) => React.ReactNode };

const INDIVIDUAL_GOALS: GoalOpt[] = [
    {
        value: "open_ended",
        label: "Open-ended Goal",
        info: "An Open-Ended Goal collects donations until the campaign ends. When the initial goal is met, it automatically increases by 20%.",
        icon: (a) => <TrendUpIcon active={a} />,
    },
    {
        value: "fixed",
        label: "Fixed Goal",
        info: "A Fixed Goal collects donations until a specific amount is reached, including fees.",
        icon: (a) => <TargetIcon active={a} />,
    },
];

const ORG_GOALS: GoalOpt[] = [
    {
        value: "org_goal",
        label: "Organization Goal",
        info: "One shared goal for your whole organization — every participant contributes toward a single combined target.",
        icon: (a) => (
            <Image src={a ? "/assets/campaigns/organization-active.svg" : "/assets/campaigns/organizational-icon.svg"} width={32} height={32} alt="" className="w-7 h-7 sm:w-8 sm:h-8" />
        ),
    },
    {
        value: "participant_goal",
        label: "Participant Goal",
        info: "Each participant gets their own fundraising target, and the campaign total is the sum of everyone's goals.",
        icon: (a) => (
            <Image src={a ? "/assets/campaigns/individual-active.svg" : "/assets/campaigns/individual-inactive.svg"} width={32} height={32} alt="" className="w-7 h-7 sm:w-8 sm:h-8" />
        ),
    },
];

/* Mascot + bordered explanation, shown under the selected goal type. */
function FundBuddyInfo({ text }: { text: string }) {
    return (
        <div className="flex items-end gap-[16px] mt-[24px]">
            <Image src="/assets/campaigns/ask-buddy.svg" width={64} height={80} alt="" className="shrink-0 w-7.5 h-10 sm:w-[61.8px] sm:h-20" />
            <p
                className="flex-1 text-xs sm:text-lg"
                style={{
                    fontFamily: "var(--font-sans)", fontWeight: 400, lineHeight: "140%", letterSpacing: 0,
                    color: "rgba(0,48,96,1)", borderRadius: "16px", padding: "18px 24px 18px 16px",
                    border: "2px solid rgba(221,224,227,1)",
                }}
            >
                {text}
            </p>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[12px] font-bold uppercase tracking-[1px] text-[rgba(0,48,96,1)]">{children}</p>;
}

const ENTER_AMOUNT_LABEL = "text-[12px] font-black uppercase tracking-[1px] text-[#aeb5bd] text-center";

export default function StepFundingGoal({
    isOrg,
    goalType, setGoalType,
    goalAmount, setGoalAmount,
    donorsPerParticipant, setDonorsPerParticipant,
    payout, setPayout,
    orgDisplayName,
    fieldErrors, clearFE,
    isLaunched,
}: Props) {
    const goalTypes = isOrg ? ORG_GOALS : INDIVIDUAL_GOALS;
    const selected = goalTypes.find((g) => g.value === goalType);
    const amountLocked = goalType === "open_ended" && isLaunched;
    const totalLabel = isOrg
        ? goalType === "participant_goal" ? "Total Participant Goal" : "Total Organization Goal"
        : "Total Campaign Goal";

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {isLaunched && (
                <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-amber-700">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                    </svg>
                    Goal type is locked after launch. Goal amounts and donor targets can still be updated.
                </div>
            )}

            {/* ── Card 1: Overall funding goal ─────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-dollar.svg"
                title="What's your overall funding goal?"
                description="Enter your total fundraising target for this campaign."
                askBuddyText="Ask FundBuddy for additional context."
                askBuddySuggestionsHeading="Hey there buddy, here's how to set a great goal!"
                askBuddySuggestions={[
                    "Pick a goal that covers your real costs plus fees.",
                    "Open-ended goals keep momentum after you hit the target.",
                    "Round numbers like $5,000 feel approachable to donors.",
                ]}
            >
                <div className="space-y-6 sm:space-y-8">
                    {/* Goal type selector */}
                    <div>
                        <div className={`flex flex-col lg:flex-row gap-[16px] ${isLaunched ? "opacity-60 pointer-events-none" : ""}`}>
                            {goalTypes.map((gt) => {
                                const active = goalType === gt.value;
                                return (
                                    <button
                                        key={gt.value}
                                        type="button"
                                        onClick={() => { if (!isLaunched) { setGoalType(gt.value); clearFE("goal_type"); } }}
                                        disabled={isLaunched}
                                        className="flex-1 min-w-0 h-15 lg:h-17 flex items-center justify-between bg-white text-left transition-all"
                                        style={{
                                            gap: "8px", borderRadius: "16px",
                                            paddingTop: "18px", paddingRight: "24px", paddingBottom: "18px", paddingLeft: "16px",
                                            border: active ? "2px solid transparent" : "2px solid rgba(212,222,231,1)",
                                            backgroundImage: active
                                                ? "linear-gradient(white, white), linear-gradient(95.84deg, #0278DE 40.72%, #AED9FE 50%, #0278DE 59.28%)"
                                                : undefined,
                                            backgroundOrigin: active ? "border-box" : undefined,
                                            backgroundClip: active ? "padding-box, border-box" : undefined,
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">{gt.icon(active)}</span>
                                            <span className="truncate text-[14px] sm:text-[20px]" style={{ fontFamily: "var(--font-sans)", fontWeight: 500, lineHeight: "150%", color: "rgba(0,48,96,1)" }}>
                                                {gt.label}
                                            </span>
                                        </div>
                                        {active && (
                                            <span className="shrink-0 flex items-center justify-center rounded-full" style={{ width: "18px", height: "18px", border: "2px solid rgba(2,104,192,1)", boxSizing: "border-box" }}>
                                                <span className="rounded-full" style={{ width: "8px", height: "8px", background: "rgba(2,104,192,1)" }} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {fieldErrors.goal_type && <p data-field-error className="text-xs sm:text-sm text-red-500 mt-2">{fieldErrors.goal_type}</p>}
                        {selected && <FundBuddyInfo text={selected.info} />}
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col items-center gap-5 sm:gap-6">
                        <p className={ENTER_AMOUNT_LABEL}>Enter Amount</p>
                        <div className="w-full max-w-[450px] flex flex-col items-center gap-4">
                            <Stepper value={goalAmount} onChange={(v) => { setGoalAmount(v); clearFE("goal_amount"); }} step={500} min={0} prefix="$" placeholder="0" fractionDigits={2} disabled={amountLocked} />
                            <div className="w-full rounded-2xl border border-[rgba(212,222,231,1)] px-4 py-3.5 text-center text-[16px] sm:text-[18px] font-medium text-[#8f98a3]">
                                {totalLabel}
                            </div>
                        </div>
                        {fieldErrors.goal_amount && <p data-field-error className="text-xs sm:text-sm text-red-500">{fieldErrors.goal_amount}</p>}
                        {amountLocked && (
                            <p className="text-[9px] sm:text-xs text-gray-400 text-center max-w-md">
                                Open-ended goals auto-scale 20% higher each time the target is reached and can&rsquo;t be edited manually.
                            </p>
                        )}
                    </div>
                </div>
            </QuestionCard>

            {/* ── Card 2: Donors per participant (org only) ────────────── */}
            {isOrg && (
                <QuestionCard
                    icon="/assets/campaigns/question-people.svg"
                    title="Number of donors per participant"
                    description="Tell us how many donors you'd like each participant to reach out to. The more donors they contact, the more money you'll raise."
                    askBuddyText="Ask FundBuddy for additional context."
                    askBuddySuggestionsHeading="Hey there buddy, a tip on donor targets!"
                    askBuddySuggestions={[
                        "Aim for around 15–25 donors per participant.",
                        "More contacts generally means more raised.",
                        "You can adjust this anytime before launch.",
                    ]}
                >
                    <div className="w-full max-w-[300px] mx-auto">
                        <Stepper value={donorsPerParticipant} onChange={(v) => { setDonorsPerParticipant(v); clearFE("donors_per_participant"); }} step={1} min={1} placeholder="20" />
                    </div>
                    {fieldErrors.donors_per_participant && <p data-field-error className="text-xs sm:text-sm text-red-500 mt-2 text-center">{fieldErrors.donors_per_participant}</p>}
                </QuestionCard>
            )}

            {/* ── Card 3: Payout check ─────────────────────────────────── */}
            <QuestionCard
                icon="/assets/campaigns/question-location.svg"
                title="Where do we send your payout check?"
                description="Make sure your details are accurate to avoid delays. We'll mail the check to the address and recipient name you provide."
                askBuddyText="Ask FundBuddy for additional context."
                askBuddySuggestionsHeading="Hey there buddy, about your payout!"
                askBuddySuggestions={[
                    "Use the legal name on the bank account or organization.",
                    "Double-check the mailing address to avoid delays.",
                    "Checks are mailed once the campaign completes.",
                ]}
            >
                <div className="space-y-5 sm:space-y-6">
                    {/* Recipient name */}
                    <div className="space-y-2.5 sm:space-y-3">
                        <SectionLabel>Recipient Name</SectionLabel>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <input
                                    value={payout.recipient_first_name}
                                    onChange={(e) => { setPayout({ ...payout, recipient_first_name: e.target.value }); clearFE("pay_first"); }}
                                    placeholder="First Name"
                                    aria-label="First Name"
                                    className={fieldErrors.pay_first ? inputErrCls : inputCls}
                                />
                                {fieldErrors.pay_first && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_first}</p>}
                            </div>
                            <div>
                                <input
                                    value={payout.recipient_last_name}
                                    onChange={(e) => { setPayout({ ...payout, recipient_last_name: e.target.value }); clearFE("pay_last"); }}
                                    placeholder="Last Name"
                                    aria-label="Last Name"
                                    className={fieldErrors.pay_last ? inputErrCls : inputCls}
                                />
                                {fieldErrors.pay_last && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_last}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Organization name (org only) */}
                    {isOrg && (
                        <div className="space-y-2.5 sm:space-y-3">
                            <SectionLabel>Organization Name</SectionLabel>
                            <input
                                value={payout.org_name ?? orgDisplayName ?? ""}
                                onChange={(e) => setPayout({ ...payout, org_name: e.target.value })}
                                placeholder="Organization Name"
                                aria-label="Organization Name"
                                className={inputCls}
                            />
                        </div>
                    )}

                    {/* Shipping address */}
                    <div className="space-y-2.5 sm:space-y-3">
                        <SectionLabel>Shipping Address</SectionLabel>
                        <div>
                            <input
                                value={payout.street_address}
                                onChange={(e) => { setPayout({ ...payout, street_address: e.target.value }); clearFE("pay_street"); }}
                                placeholder="Street address"
                                aria-label="Street address"
                                className={fieldErrors.pay_street ? inputErrCls : inputCls}
                            />
                            {fieldErrors.pay_street && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_street}</p>}
                        </div>
                        <input
                            value={payout.apt_suite ?? ""}
                            onChange={(e) => setPayout({ ...payout, apt_suite: e.target.value })}
                            placeholder="Apartment, suite, unit, etc. (optional)"
                            aria-label="Apartment, suite, unit, etc."
                            className={inputCls}
                        />
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <input
                                    value={payout.city}
                                    onChange={(e) => { setPayout({ ...payout, city: e.target.value }); clearFE("pay_city"); }}
                                    placeholder="City"
                                    aria-label="City"
                                    className={fieldErrors.pay_city ? inputErrCls : inputCls}
                                />
                                {fieldErrors.pay_city && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_city}</p>}
                            </div>
                            <div>
                                <input
                                    value={payout.state}
                                    onChange={(e) => { setPayout({ ...payout, state: e.target.value }); clearFE("pay_state"); }}
                                    placeholder="State"
                                    aria-label="State"
                                    maxLength={2}
                                    className={fieldErrors.pay_state ? inputErrCls : inputCls}
                                />
                                {fieldErrors.pay_state && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_state}</p>}
                            </div>
                            <div>
                                <input
                                    value={payout.zip}
                                    onChange={(e) => { setPayout({ ...payout, zip: e.target.value }); clearFE("pay_zip"); }}
                                    placeholder="ZIP"
                                    aria-label="ZIP"
                                    maxLength={10}
                                    className={fieldErrors.pay_zip ? inputErrCls : inputCls}
                                />
                                {fieldErrors.pay_zip && <p data-field-error className="text-xs text-red-500 mt-1">{fieldErrors.pay_zip}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </QuestionCard>
        </div>
    );
}
