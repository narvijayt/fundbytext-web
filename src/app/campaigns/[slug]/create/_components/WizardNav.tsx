"use client";

import { STEPS } from "./types";
import { StepBubble } from "./ui";

export function ProgressBar({
    step,
    maxStep,
    isOrg,
    onStepClick,
}: {
    step: number;
    maxStep: number;
    isOrg: boolean;
    onStepClick?: (num: number) => void;
}) {
    const steps = STEPS.map((s) =>
        s.num === 4 ? { ...s, label: isOrg ? "Participants" : "Donors" } : s
    );
    return (
        <div className="mb-10 py-2">
            <div className="flex items-start justify-center gap-0 min-w-max mx-auto">
                <StepBubble num={0} label="Start" status="done" />
                {steps.map(({ num, label }) => {
                    const status =
                        num < step ? "done" :
                        num === step ? "current" : "pending";
                    // Clickable if previously reached (num <= maxStep) and not the current step
                    const clickable = num <= maxStep && num !== step;
                    return (
                        <StepBubble
                            key={num}
                            num={num}
                            label={label}
                            status={status}
                            clickable={clickable}
                            onClick={clickable ? () => onStepClick?.(num) : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export function BottomNav({
    step,
    saving,
    launching,
    toast,
    uploadingPhoto,
    isLaunched,
    onBack,
    onNext,
    onLaunch,
    onExit,
}: {
    step: number;
    saving: boolean;
    launching: boolean;
    toast: string | null;
    uploadingPhoto: string | null;
    isLaunched: boolean;
    onBack: () => void;
    onNext: () => void;
    onLaunch: () => void;
    onExit: () => void;
}) {
    const isLastStep = step === 5;
    return (
        <>
            {toast && (
                <div className="fixed bottom-20 right-6 z-[100] flex items-start gap-3 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-xs animate-fade-in">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                    </svg>
                    <span>{toast}</span>
                </div>
            )}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shadow-md">
                <button
                    type="button"
                    onClick={onExit}
                    disabled={saving || launching}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                    <span className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500 text-xs font-bold shrink-0">✕</span>
                    Exit and Save Progress
                </button>

                <div className="flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={saving || launching}
                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                    )}
                    {isLastStep ? (
                        !isLaunched && (
                            <button
                                type="button"
                                onClick={onLaunch}
                                disabled={saving || launching}
                                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
                            >
                                {launching ? "Launching…" : "Launch"}
                                {!launching && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                )}
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={saving || uploadingPhoto !== null}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Saving…
                                </>
                            ) : "Save & Next"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
