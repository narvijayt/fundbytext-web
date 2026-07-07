"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    campaignSlug: string;
    videoUrl:     string | null;
};

const MAX_MB = 64;
const ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime";

export default function AdminCampaignVideoCard({ campaignSlug, videoUrl }: Props) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [url,       setUrl]       = useState(videoUrl ?? "");
    const [uploading, setUploading] = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [removing,  setRemoving]  = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [ok,        setOk]        = useState<string | null>(null);

    const busy       = uploading || saving || removing;
    const trimmed    = url.trim();
    const unchanged  = trimmed === (videoUrl ?? "");

    function flash(msg: string) { setOk(msg); setTimeout(() => setOk(null), 3000); }

    async function patchVideo(value: string | null) {
        const res = await fetch(`/api/v1/admin/campaigns/${campaignSlug}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: value }),
        });
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(typeof j.error === "string" ? j.error : "Failed to save video."); }
        router.refresh();
    }

    async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-picking the same file
        if (!file) return;

        setError(null); setOk(null);
        if (file.size > MAX_MB * 1024 * 1024) { setError(`Video must be under ${MAX_MB} MB.`); return; }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("video", file);
            const res = await fetch("/api/v1/upload/campaign-video", { method: "POST", body: fd });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Upload failed.");
            await patchVideo(j.url);
            setUrl(j.url);
            flash("Video uploaded.");
        } catch (err) { setError((err as Error).message); }
        setUploading(false);
    }

    async function saveLink() {
        setError(null); setOk(null); setSaving(true);
        try { await patchVideo(trimmed || null); flash(trimmed ? "Video link saved." : "Video removed."); }
        catch (err) { setError((err as Error).message); }
        setSaving(false);
    }

    async function removeVideo() {
        setError(null); setOk(null); setRemoving(true);
        try { await patchVideo(null); setUrl(""); flash("Video removed."); }
        catch (err) { setError((err as Error).message); }
        setRemoving(false);
    }

    return (
        <div className="rounded-2xl border border-[#e7e9eb] bg-white p-5 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)]">
            <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef5fc] text-[#0268c0]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </span>
                <div>
                    <p className="text-sm font-bold text-[#003060]">Campaign Video</p>
                    <p className="text-[11px] text-[#9aa7b8]">Shown in “Spread the Word”</p>
                </div>
            </div>

            {/* Current video preview */}
            <div className="mt-4 overflow-hidden rounded-xl border border-[#eef1f4] bg-[#f7f9fb]">
                {videoUrl ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={videoUrl} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
                ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-center">
                        <svg className="h-7 w-7 text-[#c3ccd6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <p className="text-xs text-[#9aa7b8]">No video set — the default sample clip is shown.</p>
                    </div>
                )}
            </div>

            {/* Upload */}
            <input ref={fileRef} type="file" accept={ACCEPT} onChange={onPickFile} className="hidden" />
            <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0268c0] px-4 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
            >
                {uploading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Uploading…</>
                ) : (
                    <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{videoUrl ? "Replace video" : "Upload video"}</>
                )}
            </button>
            <p className="mt-1.5 text-[11px] text-[#9aa7b8]">MP4, WebM, OGG or MOV · up to {MAX_MB} MB</p>

            {/* Or paste a link */}
            <div className="my-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4px] text-[#c3ccd6]">
                <span className="h-px flex-1 bg-[#eef1f4]" /> or paste a link <span className="h-px flex-1 bg-[#eef1f4]" />
            </div>
            <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/campaign.mp4"
                className="w-full rounded-xl border border-[#e7e9eb] bg-white px-3 py-2.5 text-[13px] text-[#003060] placeholder:text-[#9aa7b8] focus:border-[#0268c0] focus:outline-none focus:ring-2 focus:ring-[#0268c0]/20"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
                {videoUrl ? (
                    <button onClick={removeVideo} disabled={busy} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#c2404b] transition-colors hover:bg-red-50 disabled:opacity-50">
                        {removing ? "Removing…" : "Remove"}
                    </button>
                ) : <span />}
                <button onClick={saveLink} disabled={busy || unchanged} className="rounded-lg border border-[#e7e9eb] px-3 py-1.5 text-xs font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-50">
                    {saving ? "Saving…" : "Save link"}
                </button>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            {ok    && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{ok}</p>}
        </div>
    );
}
