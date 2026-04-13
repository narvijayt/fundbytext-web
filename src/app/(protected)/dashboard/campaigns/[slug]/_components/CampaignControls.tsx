"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Visibility = "private" | "unlisted" | "public";

type Props = {
    campaignSlug:              string;
    visibility:                Visibility;
    donationsEnabled:          boolean;
    donationsDisabledMessage:  string | null;
    status:                    string;
    endDate:                   Date | null;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
    {
        value:       "private",
        label:       "Private",
        description: "URL returns 404 for everyone except you.",
    },
    {
        value:       "unlisted",
        label:       "Unlisted",
        description: "Accessible via direct link, not listed on marketing pages.",
    },
    {
        value:       "public",
        label:       "Public",
        description: "Listed on marketing pages and open to anyone.",
    },
];

export default function CampaignControls({
    campaignSlug,
    visibility,
    donationsEnabled,
    donationsDisabledMessage,
    status,
    endDate,
}: Props) {
    const router = useRouter();

    const [open,           setOpen]           = useState(false);
    const [saving,         setSaving]         = useState<"visibility" | "donations" | null>(null);
    const [completing,     setCompleting]     = useState(false);
    const [reactivating,   setReactivating]   = useState(false);
    const [confirmEnd,     setConfirmEnd]     = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [disabledMsg,    setDisabledMsg]    = useState(donationsDisabledMessage ?? "");
    const [savingMsg,      setSavingMsg]      = useState(false);
    const [toast,          setToast]          = useState<string | null>(null);

    const isActive    = status === "active";
    const isCompleted = status === "completed";
    const isDraft     = status === "draft";
    const isUpcoming  = status === "upcoming";

    const endDateInFuture = endDate ? endDate.getTime() > Date.now() : false;

    function close() {
        setOpen(false);
        setConfirmEnd(false);
        setError(null);
    }

    async function patch(body: Record<string, unknown>) {
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(body),
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error ?? "Failed to update.");
        }
        router.refresh();
    }

    async function setVisibility(v: Visibility) {
        setSaving("visibility");
        setError(null);
        try { await patch({ visibility: v }); }
        catch (e) { setError((e as Error).message); }
        setSaving(null);
    }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    }

    async function toggleDonations() {
        if (isUpcoming) {
            showToast("Donations are only processed once the campaign goes live.");
            return;
        }
        setSaving("donations");
        setError(null);
        try { await patch({ donations_enabled: !donationsEnabled }); }
        catch (e) { setError((e as Error).message); }
        setSaving(null);
    }

    async function saveDisabledMessage() {
        setSavingMsg(true);
        setError(null);
        try { await patch({ donations_disabled_message: disabledMsg.trim() || null }); }
        catch (e) { setError((e as Error).message); }
        setSavingMsg(false);
    }

    async function markComplete() {
        setCompleting(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/complete`, { method: "POST" });
        if (res.ok) {
            close();
            router.refresh();
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to end campaign.");
        }
        setCompleting(false);
    }

    async function handleReactivate() {
        if (!endDate) return;
        setReactivating(true);
        setError(null);
        try {
            await patch({ end_date: endDate.toISOString() });
            close();
        } catch (e) {
            setError((e as Error).message);
        }
        setReactivating(false);
    }

    return (
        <>
            {/* Toast — outside drawer so it survives drawer close */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg text-sm text-amber-700 whitespace-nowrap">
                    {toast}
                </div>
            )}

            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Controls
            </button>

            {/* Drawer */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                >
                    <div className="ml-auto bg-white w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="font-bold text-gray-900 text-base">Campaign Controls</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Manage visibility and donation settings</p>
                            </div>
                            <button
                                onClick={close}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

                            {/* ── Visibility ── */}
                            <div className="px-6 py-5 space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Visibility</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Controls who can find and access this campaign</p>
                                </div>
                                <div className="space-y-2">
                                    {VISIBILITY_OPTIONS.map((opt) => {
                                        const active  = visibility === opt.value;
                                        const loading = saving === "visibility";
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => !active && setVisibility(opt.value)}
                                                disabled={loading || isDraft}
                                                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors disabled:opacity-50 ${
                                                    active
                                                        ? "border-orange-400 bg-orange-50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                        active ? "border-orange-500" : "border-gray-300"
                                                    }`}>
                                                        {active && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                                                    </span>
                                                    <span className={`text-sm font-semibold ${active ? "text-orange-700" : "text-gray-700"}`}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 ml-6.5 leading-snug">{opt.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isDraft && (
                                    <p className="text-xs text-gray-400">Visibility can be changed after launch.</p>
                                )}
                            </div>

                            {/* ── Donations ── */}
                            <div className="px-6 py-5 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">Accept Donations</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {isActive
                                                ? "Pause or resume donations without ending the campaign"
                                                : "Only processed while the campaign is active"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleDonations}
                                        disabled={saving === "donations" || isCompleted || isDraft}
                                        aria-label={donationsEnabled ? "Disable donations" : "Enable donations"}
                                        title={isUpcoming ? "Donations are only processed once the campaign goes live" : undefined}
                                        className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-40 ${
                                            donationsEnabled && isActive ? "bg-orange-500" : "bg-gray-200"
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            donationsEnabled && isActive ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                    </button>
                                </div>

                                {/* Custom message shown to donors when paused */}
                                {!donationsEnabled && isActive && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">Message shown to visitors</p>
                                        <textarea
                                            value={disabledMsg}
                                            onChange={(e) => setDisabledMsg(e.target.value)}
                                            maxLength={300}
                                            rows={2}
                                            placeholder="e.g. Donations are temporarily paused. Please check back soon."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-gray-300">{disabledMsg.length}/300</span>
                                            <button
                                                onClick={saveDisabledMessage}
                                                disabled={savingMsg}
                                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                {savingMsg ? "Saving…" : "Save Message"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Mark as Complete ── */}
                            {isActive && (
                                <div className="px-6 py-5">
                                    {confirmEnd ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-700 font-medium">
                                                End this campaign now? Donations will stop immediately. This cannot be undone.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfirmEnd(false)}
                                                    disabled={completing}
                                                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={markComplete}
                                                    disabled={completing}
                                                    className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                                                >
                                                    {completing ? "Ending…" : "Yes, End It"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">Mark as Complete</p>
                                                <p className="text-xs text-gray-400 mt-0.5">End campaign before its scheduled date</p>
                                            </div>
                                            <button
                                                onClick={() => setConfirmEnd(true)}
                                                className="shrink-0 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                End Early
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isCompleted && (
                                <div className="px-6 py-5 space-y-3">
                                    {endDateInFuture ? (
                                        /* Manually ended early — time still remains */
                                        <>
                                            <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-xs text-amber-700 leading-snug">
                                                    This campaign was ended early. The original end date hasn&apos;t passed yet — you can reactivate it to resume accepting donations.
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800">Reactivate Campaign</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Resume accepting donations immediately</p>
                                                </div>
                                                <button
                                                    onClick={handleReactivate}
                                                    disabled={reactivating}
                                                    className="shrink-0 px-3 py-2 text-sm font-semibold text-green-600 border border-green-200 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-50"
                                                >
                                                    {reactivating ? "Reactivating…" : "Reactivate"}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* Ended naturally — time has passed */
                                        <>
                                            <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-xs text-gray-500 leading-snug">
                                                    This campaign has ended. To accept donations again, extend the end date in Edit Campaign.
                                                </p>
                                            </div>
                                            <a
                                                href={`/campaigns/${campaignSlug}/edit`}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Extend End Date to Reactivate
                                            </a>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="px-6 py-4 shrink-0 border-t border-gray-100">
                                <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
