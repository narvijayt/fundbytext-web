"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    { value: "private",  label: "Private",  description: "URL returns 404 for everyone except you." },
    { value: "unlisted", label: "Unlisted", description: "Accessible via direct link, not listed on marketing pages." },
    { value: "public",   label: "Public",   description: "Listed on marketing pages and open to anyone." },
];

const ClockIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);

export default function CampaignControls({
    campaignSlug, visibility, donationsEnabled, donationsDisabledMessage, status, endDate,
}: Props) {
    const router = useRouter();

    const [open,         setOpen]         = useState(false);
    const [shown,        setShown]        = useState(false);   // drives slide-in / fade
    const [saving,       setSaving]       = useState<"visibility" | "donations" | null>(null);
    const [pendingVis,   setPendingVis]   = useState<Visibility | null>(null);
    const [pendingDon,   setPendingDon]   = useState<boolean | null>(null);
    const [completing,   setCompleting]   = useState(false);
    const [reactivating, setReactivating] = useState(false);
    const [confirmEnd,   setConfirmEnd]   = useState(false);
    const [error,        setError]        = useState<string | null>(null);
    const [disabledMsg,  setDisabledMsg]  = useState(donationsDisabledMessage ?? "");
    const [savingMsg,    setSavingMsg]    = useState(false);
    const [msgSaved,     setMsgSaved]     = useState(false);

    const triggerRef = useRef<HTMLButtonElement>(null);

    const isActive    = status === "active";
    const isCompleted = status === "completed";
    const isDraft     = status === "draft";
    const isUpcoming  = status === "upcoming";
    const endDateInFuture = endDate ? endDate.getTime() > Date.now() : false;

    // Optimistic values so the UI responds instantly; reconciled when the server prop lands.
    const shownVis = pendingVis ?? visibility;
    const donOn    = pendingDon ?? (donationsEnabled && isActive);

    useEffect(() => { setPendingVis(null); },                       [visibility]);
    useEffect(() => { setPendingDon(null); },                       [donationsEnabled]);
    useEffect(() => { setDisabledMsg(donationsDisabledMessage ?? ""); }, [donationsDisabledMessage]);

    function openDrawer() { setError(null); setOpen(true); }

    function close() {
        setShown(false);
        window.setTimeout(() => {
            setOpen(false);
            setConfirmEnd(false);
            setError(null);
            triggerRef.current?.focus();
        }, 240);
    }

    // Slide-in + body-scroll lock while open
    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; };
    }, [open]);

    // ESC: step back out of the destructive confirm first, otherwise close
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") { confirmEnd ? setConfirmEnd(false) : close(); }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, confirmEnd]);

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
        setPendingVis(v);
        setSaving("visibility");
        setError(null);
        try { await patch({ visibility: v }); }
        catch (e) { setError((e as Error).message); setPendingVis(null); }
        setSaving(null);
    }

    async function toggleDonations() {
        const next = !donationsEnabled;
        setPendingDon(next);
        setSaving("donations");
        setError(null);
        try { await patch({ donations_enabled: next }); }
        catch (e) { setError((e as Error).message); setPendingDon(null); }
        setSaving(null);
    }

    async function saveDisabledMessage() {
        setSavingMsg(true);
        setError(null);
        try {
            await patch({ donations_disabled_message: disabledMsg.trim() || null });
            setMsgSaved(true);
            window.setTimeout(() => setMsgSaved(false), 2000);
        }
        catch (e) { setError((e as Error).message); }
        setSavingMsg(false);
    }

    async function markComplete() {
        setCompleting(true);
        setError(null);
        const res = await fetch(`/api/v1/campaigns/${campaignSlug}/complete`, { method: "POST" });
        if (res.ok) { close(); router.refresh(); }
        else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? "Failed to end campaign.");
        }
        setCompleting(false);
    }

    async function handleReactivate() {
        if (!endDate) return;
        setReactivating(true);
        setError(null);
        try { await patch({ end_date: endDate.toISOString() }); close(); }
        catch (e) { setError((e as Error).message); }
        setReactivating(false);
    }

    const donHelper =
        isActive    ? (donationsEnabled ? "Pause donations without ending the campaign" : "Donations are paused for visitors")
        : isUpcoming  ? "Donations start once the campaign goes live"
        : isDraft     ? "Available after you launch the campaign"
        :               "The campaign has ended";

    const msgUnchanged = disabledMsg.trim() === (donationsDisabledMessage ?? "");

    return (
        <>
            {/* Trigger */}
            <button
                ref={triggerRef}
                onClick={openDrawer}
                aria-label="Campaign controls"
                aria-haspopup="dialog"
                aria-expanded={open}
                title="Campaign controls"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-gray-200 bg-white px-3 py-2.5 sm:px-4 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
            >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="hidden sm:inline">Controls</span>
            </button>

            {/* Drawer */}
            {open && (
                <div className="fixed inset-0 z-[100] flex justify-end" onClick={close}>
                    {/* backdrop */}
                    <div className={`absolute inset-0 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} />

                    {/* panel */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cc-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`relative ml-auto flex h-full w-full max-w-[400px] flex-col overflow-hidden rounded-l-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-300 ease-out motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`}
                    >
                        {/* Header — blue bar (matches Edit Profile modal) */}
                        <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0278de] px-5 py-4">
                            <div className="min-w-0">
                                <h2 id="cc-title" className="text-[17px] font-bold leading-tight text-white">Campaign Controls</h2>
                                <p className="mt-0.5 text-[12px] text-white/75">Visibility, donations &amp; status</p>
                            </div>
                            <button
                                onClick={close}
                                aria-label="Close"
                                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 divide-y divide-[#eef1f4] overflow-y-auto [scrollbar-width:thin]">

                            {/* ── Visibility ── */}
                            <div className="space-y-3 px-5 py-5">
                                <div>
                                    <h3 className="text-[14px] font-bold text-[#003060]">Visibility</h3>
                                    <p className="mt-0.5 text-[12px] text-[#7e8a96]">Who can find and access this campaign</p>
                                </div>
                                <div role="radiogroup" aria-label="Visibility" className="space-y-2">
                                    {VISIBILITY_OPTIONS.map((opt) => {
                                        const active     = shownVis === opt.value;
                                        const loadingOne = saving === "visibility" && pendingVis === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                role="radio"
                                                aria-checked={active}
                                                onClick={() => !active && setVisibility(opt.value)}
                                                disabled={saving === "visibility" || isDraft}
                                                className={`w-full rounded-2xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    active
                                                        ? "border-[#0268c0] bg-[#0268c0]/[0.06]"
                                                        : "border-[#e7e9eb] hover:border-[#cfd9e3] hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-[#0268c0]" : "border-[#cdd6df]"}`}>
                                                        {loadingOne
                                                            ? <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[#0268c0] border-t-transparent" />
                                                            : active && <span className="h-2 w-2 rounded-full bg-[#0268c0]" />}
                                                    </span>
                                                    <span className={`text-[14px] font-semibold ${active ? "text-[#0268c0]" : "text-[#003060]"}`}>{opt.label}</span>
                                                </div>
                                                <p className="mt-1 pl-[28px] text-[12px] leading-snug text-[#7e8a96]">{opt.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isDraft && <p className="text-[12px] text-[#9aa7b8]">Visibility can be changed after launch.</p>}
                            </div>

                            {/* ── Donations ── */}
                            <div className="space-y-3 px-5 py-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="text-[14px] font-bold text-[#003060]">Accept Donations</h3>
                                        <p className="mt-0.5 text-[12px] text-[#7e8a96]">{donHelper}</p>
                                    </div>
                                    <button
                                        onClick={toggleDonations}
                                        disabled={saving === "donations" || !isActive}
                                        role="switch"
                                        aria-checked={donOn}
                                        aria-label={donOn ? "Disable donations" : "Enable donations"}
                                        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0268c0]/40 disabled:cursor-not-allowed disabled:opacity-50 ${donOn ? "bg-[#28c45d]" : "bg-[#d4dee7]"}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${donOn ? "translate-x-6" : "translate-x-1"}`} />
                                    </button>
                                </div>

                                {!donationsEnabled && isActive && (
                                    <div className="space-y-2 rounded-2xl border border-[#e7e9eb] bg-[#f7f9fb] p-3.5">
                                        <label className="block text-[12px] font-semibold text-[#003060]">Message shown to visitors while paused</label>
                                        <textarea
                                            value={disabledMsg}
                                            onChange={(e) => setDisabledMsg(e.target.value)}
                                            maxLength={300}
                                            rows={2}
                                            placeholder="e.g. Donations are temporarily paused. Please check back soon."
                                            className="w-full resize-none rounded-[12px] border border-[#d4dee7] bg-white px-3.5 py-2.5 text-[14px] text-[#003060] placeholder:text-[#9aa7b8] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-[#9aa7b8]">{disabledMsg.length}/300</span>
                                            <button
                                                onClick={saveDisabledMessage}
                                                disabled={savingMsg || msgUnchanged}
                                                className="rounded-[10px] bg-[#0268c0] px-3.5 py-2 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                                            >
                                                {savingMsg ? "Saving…" : msgSaved ? "Saved ✓" : "Save Message"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── End early (active) ── */}
                            {isActive && (
                                <div className="px-5 py-5">
                                    {confirmEnd ? (
                                        <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                                            <p className="text-[13px] font-medium leading-snug text-red-700">
                                                End this campaign now? Donations stop immediately. This can&apos;t be undone.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setConfirmEnd(false); setError(null); }}
                                                    disabled={completing}
                                                    className="flex-1 rounded-[10px] border border-[#d4dee7] bg-white py-2 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={markComplete}
                                                    disabled={completing}
                                                    className="flex-1 rounded-[10px] bg-red-500 py-2 text-[13px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-50"
                                                >
                                                    {completing ? "Ending…" : "Yes, End It"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-[14px] font-bold text-[#003060]">End Campaign Early</h3>
                                                <p className="mt-0.5 text-[12px] text-[#7e8a96]">Stop before the scheduled end date</p>
                                            </div>
                                            <button
                                                onClick={() => setConfirmEnd(true)}
                                                className="shrink-0 rounded-[10px] border border-red-200 px-3.5 py-2 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                End Early
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Completed ── */}
                            {isCompleted && (
                                <div className="space-y-3 px-5 py-5">
                                    {endDateInFuture ? (
                                        <>
                                            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                                                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                                <p className="text-[12px] leading-snug text-amber-700">
                                                    This campaign was ended early. The original end date hasn&apos;t passed yet — reactivate it to resume accepting donations.
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-[14px] font-bold text-[#003060]">Reactivate Campaign</h3>
                                                    <p className="mt-0.5 text-[12px] text-[#7e8a96]">Resume accepting donations now</p>
                                                </div>
                                                <button
                                                    onClick={handleReactivate}
                                                    disabled={reactivating}
                                                    className="shrink-0 rounded-[10px] border border-green-200 px-3.5 py-2 text-[13px] font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                                                >
                                                    {reactivating ? "Reactivating…" : "Reactivate"}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-2.5 rounded-2xl border border-[#e7e9eb] bg-gray-50 px-4 py-3">
                                                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#9aa7b8]" />
                                                <p className="text-[12px] leading-snug text-[#7e8a96]">
                                                    This campaign has ended. To accept donations again, extend the end date in Edit Campaign.
                                                </p>
                                            </div>
                                            <Link
                                                href={`/campaigns/${campaignSlug}/edit`}
                                                className="flex items-center justify-center gap-2 rounded-[10px] border border-[#cfe0f3] bg-[#0268c0]/[0.04] py-2.5 text-[13px] font-semibold text-[#0268c0] transition-all duration-150 hover:bg-[#0268c0]/[0.08] active:scale-[0.98]"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Extend End Date to Reactivate
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="shrink-0 border-t border-[#e8eaee] px-5 py-3">
                                <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
