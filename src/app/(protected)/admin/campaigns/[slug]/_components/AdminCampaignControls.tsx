"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Visibility = "private" | "unlisted" | "public";

type Props = {
    campaignSlug:             string;
    visibility:               Visibility;
    donationsEnabled:         boolean;
    donationsDisabledMessage: string | null;
    videoUrl:                 string | null;
    status:                   string;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
    { value: "private",  label: "Private",  description: "URL returns 404 for everyone except the organizer." },
    { value: "unlisted", label: "Unlisted", description: "Accessible via direct link, not listed on marketing pages." },
    { value: "public",   label: "Public",   description: "Listed on marketing pages and open to anyone." },
];

export default function AdminCampaignControls({
    campaignSlug,
    visibility,
    donationsEnabled,
    donationsDisabledMessage,
    videoUrl,
    status,
}: Props) {
    const router = useRouter();

    const [open,        setOpen]        = useState(false);
    const [shown,       setShown]       = useState(false);
    const [saving,      setSaving]      = useState<"visibility" | "donations" | null>(null);
    const [error,       setError]       = useState<string | null>(null);
    const [disabledMsg, setDisabledMsg] = useState(donationsDisabledMessage ?? "");
    const [savingMsg,   setSavingMsg]   = useState(false);
    const [video,       setVideo]       = useState(videoUrl ?? "");
    const [savingVideo, setSavingVideo] = useState(false);
    const [toast,       setToast]       = useState<string | null>(null);

    const isDraft     = status === "draft";
    const isCompleted = status === "completed";

    function close() { setShown(false); window.setTimeout(() => { setOpen(false); setError(null); }, 200); }

    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    }, [open]);

    function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 4000); }

    async function patch(body: Record<string, unknown>) {
        const res = await fetch(`/api/v1/admin/campaigns/${campaignSlug}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? "Failed to update."); }
        router.refresh();
    }

    async function setVisibility(v: Visibility) {
        setSaving("visibility"); setError(null);
        try { await patch({ visibility: v }); showToast(`Visibility set to ${v.charAt(0).toUpperCase() + v.slice(1)}.`); }
        catch (e) { setError((e as Error).message); }
        setSaving(null);
    }
    async function toggleDonations() {
        setSaving("donations"); setError(null);
        try { await patch({ donations_enabled: !donationsEnabled }); showToast(donationsEnabled ? "Donations paused." : "Donations resumed."); }
        catch (e) { setError((e as Error).message); }
        setSaving(null);
    }
    async function saveDisabledMessage() {
        setSavingMsg(true); setError(null);
        try { await patch({ donations_disabled_message: disabledMsg.trim() || null }); showToast("Message saved."); }
        catch (e) { setError((e as Error).message); }
        setSavingMsg(false);
    }
    async function saveVideo() {
        setSavingVideo(true); setError(null);
        try { await patch({ video_url: video.trim() || null }); showToast(video.trim() ? "Campaign video saved." : "Campaign video removed."); }
        catch (e) { setError((e as Error).message); }
        setSavingVideo(false);
    }

    const trimmedVideo   = video.trim();
    const videoUnchanged = trimmedVideo === (videoUrl ?? "");

    return (
        <>
            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#003060] px-5 py-3 text-sm font-medium text-white shadow-lg">
                    {toast}
                </div>
            )}

            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e7e9eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50"
            >
                <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Controls
            </button>

            {open && (
                <div
                    className={`fixed inset-0 z-[100] flex bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
                    onClick={close}
                >
                    <div
                        role="dialog" aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        className={`ml-auto flex h-full w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`}
                    >
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-6 py-4 text-white">
                            <div>
                                <h2 className="text-[16px] font-bold">Admin Controls</h2>
                                <p className="mt-0.5 text-xs text-white/70">Override visibility &amp; donation settings</p>
                            </div>
                            <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 divide-y divide-[#eef1f4] overflow-y-auto">
                            {/* Notice */}
                            <div className="border-b border-amber-100 bg-amber-50 px-6 py-3">
                                <p className="text-xs leading-snug text-amber-700">Changes made here notify the organizer and participants. Use carefully.</p>
                            </div>

                            {/* Visibility */}
                            <div className="space-y-3 px-6 py-5">
                                <div>
                                    <p className="text-sm font-bold text-[#003060]">Visibility</p>
                                    <p className="mt-0.5 text-xs text-[#9aa7b8]">Controls who can find and access this campaign</p>
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
                                                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${active ? "border-[#0268c0] bg-blue-50" : "border-[#e7e9eb] hover:border-[#c9d6e2] hover:bg-gray-50"}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-[#0268c0]" : "border-gray-300"}`}>
                                                        {active && <span className="h-2 w-2 rounded-full bg-[#0268c0]" />}
                                                    </span>
                                                    <span className={`text-sm font-semibold ${active ? "text-[#0268c0]" : "text-[#003060]"}`}>{opt.label}</span>
                                                </div>
                                                <p className="ml-6.5 mt-1 text-xs leading-snug text-[#9aa7b8]">{opt.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isDraft && <p className="text-xs text-[#9aa7b8]">Visibility can be changed after launch.</p>}
                            </div>

                            {/* Donations */}
                            <div className="space-y-3 px-6 py-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#003060]">Accept Donations</p>
                                        <p className="mt-0.5 text-xs text-[#9aa7b8]">Pause or resume donations without ending the campaign</p>
                                    </div>
                                    <button
                                        onClick={toggleDonations}
                                        disabled={saving === "donations" || isCompleted || isDraft}
                                        aria-label={donationsEnabled ? "Disable donations" : "Enable donations"}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0268c0]/40 focus:ring-offset-1 disabled:opacity-40 ${donationsEnabled ? "bg-[#0268c0]" : "bg-gray-200"}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${donationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                                    </button>
                                </div>

                                {!donationsEnabled && !isCompleted && !isDraft && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-[#5b6b7c]">Message shown to visitors</p>
                                        <textarea
                                            value={disabledMsg}
                                            onChange={(e) => setDisabledMsg(e.target.value)}
                                            maxLength={300}
                                            rows={2}
                                            placeholder="e.g. Donations are temporarily paused. Please check back soon."
                                            className="w-full resize-none rounded-xl border border-[#e7e9eb] bg-white px-3 py-2 text-sm text-[#003060] placeholder:text-[#9aa7b8] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-[#9aa7b8]">{disabledMsg.length}/300</span>
                                            <button onClick={saveDisabledMessage} disabled={savingMsg} className="rounded-lg bg-[#0268c0] px-3 py-1.5 text-xs font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50">{savingMsg ? "Saving…" : "Save Message"}</button>
                                        </div>
                                    </div>
                                )}

                                {(isCompleted || isDraft) && (
                                    <p className="text-xs text-[#9aa7b8]">{isDraft ? "Donations can be toggled after launch." : "Campaign is completed — donations are closed."}</p>
                                )}
                            </div>

                            {/* Campaign video */}
                            <div className="space-y-3 px-6 py-5">
                                <div>
                                    <p className="text-sm font-bold text-[#003060]">Campaign Video</p>
                                    <p className="mt-0.5 text-xs text-[#9aa7b8]">Shown in “Spread the Word” on the public page. Paste a direct video link (.mp4) or leave blank for the default clip.</p>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        inputMode="url"
                                        value={video}
                                        onChange={(e) => setVideo(e.target.value)}
                                        placeholder="https://example.com/campaign.mp4"
                                        className="w-full rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-sm text-[#003060] placeholder:text-[#9aa7b8] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        {trimmedVideo && (
                                            <button
                                                onClick={() => { setVideo(""); }}
                                                disabled={savingVideo}
                                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#9aa7b8] transition-colors hover:text-[#003060] disabled:opacity-50"
                                            >
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={saveVideo}
                                            disabled={savingVideo || videoUnchanged}
                                            className="rounded-lg bg-[#0268c0] px-3 py-1.5 text-xs font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                                        >
                                            {savingVideo ? "Saving…" : "Save Video"}
                                        </button>
                                    </div>
                                    <p className="text-xs text-[#9aa7b8]">Leaving this blank shows the default sample clip on the campaign page.</p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="shrink-0 border-t border-[#eef1f4] px-6 py-4">
                                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
