"use client";

import { type Payout } from "./types";
import { Field, SectionTitle, inputCls, inputErrCls } from "./ui";

type Props = {
    isOrg: boolean;
    goalType: string;
    setGoalType: (v: string) => void;
    goalAmount: string;
    setGoalAmount: (v: string) => void;
    donorsPerParticipant: string;
    setDonorsPerParticipant: (v: string) => void;
    targetContacts: string;
    setTargetContacts: (v: string) => void;
    payout: Payout;
    setPayout: (p: Payout) => void;
    orgDisplayName: string;
    fieldErrors: Record<string, string>;
    clearFE: (key: string) => void;
    isLaunched: boolean;
    isActive: boolean;
};

export default function StepFundingGoal({
    isOrg,
    goalType, setGoalType,
    goalAmount, setGoalAmount,
    donorsPerParticipant, setDonorsPerParticipant,
    targetContacts, setTargetContacts,
    payout, setPayout,
    orgDisplayName,
    fieldErrors, clearFE,
    isLaunched, isActive,
}: Props) {
    const indGoalTypes = [
        { value: "open_ended",  label: "Open-Ended Goal",   desc: "Auto-scales 20% higher each time it's reached" },
        { value: "fixed",       label: "Fixed Goal",        desc: "Fundraising stops once the target amount is met" },
    ];
    const orgGoalTypes = [
        { value: "org_goal",        label: "Shared Organization Goal", desc: "One combined goal for the entire campaign" },
        { value: "participant_goal", label: "Per-Participant Goal",    desc: "Each participant has their own fundraising target" },
    ];
    const goalTypes = isOrg ? orgGoalTypes : indGoalTypes;

    return (
        <div className="space-y-6">
            <SectionTitle>Funding Goal</SectionTitle>

            {isLaunched && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                    </svg>
                    Goal structure is locked after launch. Only the mailing address can be updated.
                </div>
            )}

            {/* Goal type */}
            <Field label={`Goal Type${isLaunched ? " (locked)" : ""}`} required error={fieldErrors.goal_type}>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isLaunched ? "opacity-50 pointer-events-none" : ""}`}>
                    {goalTypes.map((gt) => (
                        <label
                            key={gt.value}
                            className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-colors ${
                                isLaunched ? "cursor-not-allowed" : "cursor-pointer hover:border-gray-300"
                            } ${
                                goalType === gt.value
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200"
                            }`}
                        >
                            <input
                                type="radio"
                                name="goal_type"
                                value={gt.value}
                                checked={goalType === gt.value}
                                onChange={() => { if (!isLaunched) { setGoalType(gt.value); clearFE("goal_type"); } }}
                                disabled={isLaunched}
                                className="sr-only"
                            />
                            <span className={`text-sm font-semibold ${goalType === gt.value ? "text-orange-600" : "text-gray-800"}`}>
                                {gt.label}
                            </span>
                            <span className="text-xs text-gray-500">{gt.desc}</span>
                        </label>
                    ))}
                </div>
            </Field>

            {/* Goal amount */}
            <Field label={`Fundraising Goal ($)${isActive ? " (locked)" : ""}`} required error={fieldErrors.goal_amount}>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                        type="number"
                        min={1}
                        value={goalAmount}
                        onChange={(e) => { setGoalAmount(e.target.value); clearFE("goal_amount"); }}
                        placeholder="5000"
                        disabled={isActive}
                        className={`${fieldErrors.goal_amount ? inputErrCls : inputCls} pl-7 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    />
                </div>
            </Field>

            {/* Org-only fields */}
            {isOrg && (
                <>
                    <Field
                        label={`Donors per Participant${isLaunched ? " (locked)" : ""}`}
                        required
                        error={fieldErrors.donors_per_participant}
                        hint="How many donors should each participant aim to recruit?"
                    >
                        <input
                            type="number"
                            min={1}
                            value={donorsPerParticipant}
                            onChange={(e) => { setDonorsPerParticipant(e.target.value); clearFE("donors_per_participant"); }}
                            placeholder="20"
                            disabled={isLaunched}
                            className={`${fieldErrors.donors_per_participant ? inputErrCls : inputCls} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        />
                    </Field>

                    {goalType === "participant_goal" && (
                        <Field
                            label={`Target Contacts per Participant${isLaunched ? " (locked)" : ""}`}
                            hint="How many contacts should each participant reach out to?"
                        >
                            <input
                                type="number"
                                min={1}
                                value={targetContacts}
                                onChange={(e) => setTargetContacts(e.target.value)}
                                placeholder="30"
                                disabled={isLaunched}
                                className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                            />
                        </Field>
                    )}
                </>
            )}

            {/* Payout / mailing address */}
            <div>
                <SectionTitle className="mt-2 mb-4">Check Mailing Address</SectionTitle>
                <p className="text-xs text-gray-500 mb-4">
                    Where should we mail the fundraising check?
                </p>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First Name" required error={fieldErrors.pay_first}>
                            <input
                                value={payout.recipient_first_name}
                                onChange={(e) => { setPayout({ ...payout, recipient_first_name: e.target.value }); clearFE("pay_first"); }}
                                className={fieldErrors.pay_first ? inputErrCls : inputCls}
                            />
                        </Field>
                        <Field label="Last Name" required error={fieldErrors.pay_last}>
                            <input
                                value={payout.recipient_last_name}
                                onChange={(e) => { setPayout({ ...payout, recipient_last_name: e.target.value }); clearFE("pay_last"); }}
                                className={fieldErrors.pay_last ? inputErrCls : inputCls}
                            />
                        </Field>
                    </div>
                    {isOrg && (
                        <Field label="Organization Name">
                            <input
                                value={payout.org_name ?? orgDisplayName ?? ""}
                                onChange={(e) => setPayout({ ...payout, org_name: e.target.value })}
                                className={inputCls}
                            />
                        </Field>
                    )}
                    <Field label="Street Address" required error={fieldErrors.pay_street}>
                        <input
                            value={payout.street_address}
                            onChange={(e) => { setPayout({ ...payout, street_address: e.target.value }); clearFE("pay_street"); }}
                            placeholder="123 Main St"
                            className={fieldErrors.pay_street ? inputErrCls : inputCls}
                        />
                    </Field>
                    <Field label="Apt / Suite">
                        <input
                            value={payout.apt_suite ?? ""}
                            onChange={(e) => setPayout({ ...payout, apt_suite: e.target.value })}
                            placeholder="Suite 200"
                            className={inputCls}
                        />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <Field label="City" required error={fieldErrors.pay_city}>
                                <input
                                    value={payout.city}
                                    onChange={(e) => { setPayout({ ...payout, city: e.target.value }); clearFE("pay_city"); }}
                                    className={fieldErrors.pay_city ? inputErrCls : inputCls}
                                />
                            </Field>
                        </div>
                        <Field label="State" required error={fieldErrors.pay_state}>
                            <input
                                value={payout.state}
                                onChange={(e) => { setPayout({ ...payout, state: e.target.value }); clearFE("pay_state"); }}
                                placeholder="TX"
                                maxLength={2}
                                className={fieldErrors.pay_state ? inputErrCls : inputCls}
                            />
                        </Field>
                        <Field label="ZIP" required error={fieldErrors.pay_zip}>
                            <input
                                value={payout.zip}
                                onChange={(e) => { setPayout({ ...payout, zip: e.target.value }); clearFE("pay_zip"); }}
                                placeholder="78701"
                                maxLength={10}
                                className={fieldErrors.pay_zip ? inputErrCls : inputCls}
                            />
                        </Field>
                    </div>
                </div>
            </div>
        </div>
    );
}
