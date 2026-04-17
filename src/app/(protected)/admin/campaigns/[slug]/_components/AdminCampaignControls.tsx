"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Visibility = "private" | "unlisted" | "public";

type Props = {
    campaignSlug:             string;
    visibility:               Visibility;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    status:                   string;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
    {
        value:       "private",
        label:       "Private",
        description: "URL returns 404 for everyone except the organizer.",
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

export default function AdminCampaignControls({
    campaignSlug,
    visibility,
    donationsEnabled,
    donationsDisabledMessage,
    status,
}: Props) {
    const router = useRouter();

    const [open,        setOpen]        = useState(false);
    const [saving,      setSaving]      = useState<"visibility" | "donations" | null>(null);
    const [error,       setError]       = useState<string | null>(null);
    const [disabledMsg, setDisabledMsg] = useState(donationsDisabledMessage ?? "");
    const [savingMsg,   setSavingMsg]   = useState(false);
    const [toast,       setToast]       = useState<string | null>(null);

    const isDraft     = status === "draft";
    const isCompleted = status === "completed";

    function close() { setOpen(false); setError(null); }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    }

    async function patch(body: Record<string, unknown>) {
        const res = await fetch(`/api/v1/admin/campaigns/${campaignSlug}`, {
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
        try {
            await patch({ visibility: v });
            showToast(`Visibility set to ${v.charAt(0).toUpperCase() + v.slice(1)}.`);
        } catch (e) {
            setError((e as Error).message);
        }
        setSaving(null);
    }

    async function toggleDonations() {
        setSaving("donations");
        setError(null);
        try {
            await patch({ donations_enabled: !donationsEnabled });
            showToast(donationsEnabled ? "Donations paused." : "Donations resumed.");
        } catch (e) {
            setError((e as Error).message);
        }
        setSaving(null);
    }

    async function saveDisabledMessage() {
        setSavingMsg(true);
        setError(null);
        try {
            await patch({ donations_disabled_message: disabledMsg.trim() || null });
            showToast("Message saved.");
        } catch (e) {
            setError((e as Error).message);
        }
        setSavingMsg(false);
    }

    return (
        <>
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm font-medium whitespace-nowrap">
                    {toast}
                </div>
            )}

            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Controls
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.45)" }}>
                    <div className="ml-auto bg-white w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="font-bold text-gray-900 text-base">Admin Controls</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Override visibility and donation settings</p>
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

                            {/* Admin notice */}
                            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                                <p className="text-xs text-amber-700 leading-snug">
                                    Changes made here will notify the organizer and participants. Use carefully.
                                </p>
                            </div>

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
                                                        ? "border-purple-400 bg-purple-50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                        active ? "border-purple-500" : "border-gray-300"
                                                    }`}>
                                                        {active && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                                    </span>
                                                    <span className={`text-sm font-semibold ${active ? "text-purple-700" : "text-gray-700"}`}>
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
                                            Pause or resume donations without ending the campaign
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleDonations}
                                        disabled={saving === "donations" || isCompleted || isDraft}
                                        aria-label={donationsEnabled ? "Disable donations" : "Enable donations"}
                                        className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 disabled:opacity-40 ${
                                            donationsEnabled ? "bg-purple-500" : "bg-gray-200"
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            donationsEnabled ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                    </button>
                                </div>

                                {!donationsEnabled && !isCompleted && !isDraft && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">Message shown to visitors</p>
                                        <textarea
                                            value={disabledMsg}
                                            onChange={(e) => setDisabledMsg(e.target.value)}
                                            maxLength={300}
                                            rows={2}
                                            placeholder="e.g. Donations are temporarily paused. Please check back soon."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
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

                                {(isCompleted || isDraft) && (
                                    <p className="text-xs text-gray-400">
                                        {isDraft ? "Donations can be toggled after launch." : "Campaign is completed — donations are closed."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="px-6 py-4 shrink-0 border-t border-gray-100">
                                <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
