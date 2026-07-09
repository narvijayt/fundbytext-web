"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_MB = 64;
const MAX_THUMB_MB = 10;
const ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime";
const THUMB_ACCEPT = "image/jpeg,image/png,image/webp";

export default function GlobalCampaignVideo({ currentUrl, currentThumbnailUrl }: { currentUrl: string | null; currentThumbnailUrl: string | null }) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const thumbRef = useRef<HTMLInputElement>(null);

    const [open,      setOpen]      = useState(false);
    const [shown,     setShown]     = useState(false);
    const [url,       setUrl]       = useState(currentUrl ?? "");
    const [uploading, setUploading] = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [removing,  setRemoving]  = useState(false);
    const [thumbBusy, setThumbBusy] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [ok,        setOk]        = useState<string | null>(null);

    const busy      = uploading || saving || removing || thumbBusy;
    const trimmed   = url.trim();
    const unchanged = trimmed === (currentUrl ?? "");

    function close() { setShown(false); window.setTimeout(() => { setOpen(false); setError(null); setOk(null); }, 200); }

    useEffect(() => {
        if (!open) return;
        setUrl(currentUrl ?? "");
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    }, [open, currentUrl]);

    function flash(msg: string) { setOk(msg); setTimeout(() => setOk(null), 3000); }

    async function putSettings(body: Record<string, unknown>) {
        const res = await fetch("/api/v1/admin/settings/campaign-video", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(typeof j.error === "string" ? j.error : "Failed to save."); }
        router.refresh();
    }
    const putDefault = (value: string | null) => putSettings({ video_url: value });

    async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
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
            await putDefault(j.url);
            setUrl(j.url);
            flash("Default video updated.");
        } catch (err) { setError((err as Error).message); }
        setUploading(false);
    }

    async function saveLink() {
        setError(null); setOk(null); setSaving(true);
        try { await putDefault(trimmed || null); flash(trimmed ? "Default video saved." : "Default video removed."); }
        catch (err) { setError((err as Error).message); }
        setSaving(false);
    }

    async function removeVideo() {
        setError(null); setOk(null); setRemoving(true);
        try { await putDefault(null); setUrl(""); flash("Default video removed."); }
        catch (err) { setError((err as Error).message); }
        setRemoving(false);
    }

    async function onPickThumb(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setError(null); setOk(null);
        if (file.size > MAX_THUMB_MB * 1024 * 1024) { setError(`Thumbnail must be under ${MAX_THUMB_MB} MB.`); return; }

        setThumbBusy(true);
        try {
            const fd = new FormData();
            fd.append("photo", file);
            fd.append("type", "video_thumbnail");
            const res = await fetch("/api/v1/upload/campaign-photo", { method: "POST", body: fd });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Upload failed.");
            await putSettings({ video_thumbnail_url: j.url });
            flash("Default thumbnail updated.");
        } catch (err) { setError((err as Error).message); }
        setThumbBusy(false);
    }

    async function removeThumb() {
        setError(null); setOk(null); setThumbBusy(true);
        try { await putSettings({ video_thumbnail_url: null }); flash("Default thumbnail removed."); }
        catch (err) { setError((err as Error).message); }
        setThumbBusy(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e7e9eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-gray-50"
            >
                <svg className="h-4 w-4 text-[#0268c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Default video
                {currentUrl && <span className="ml-0.5 h-2 w-2 rounded-full bg-[#28c45d]" title="A default video is set" />}
            </button>

            {open && (
                <div
                    className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f1d43]/45 backdrop-blur-sm transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
                    onClick={close}
                >
                    <div
                        role="dialog" aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 sm:max-w-2xl ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-6 py-4 text-white">
                            <div>
                                <h2 className="text-[16px] font-bold">Default campaign video</h2>
                                <p className="mt-0.5 text-xs text-white/70">Applies to every campaign without its own</p>
                            </div>
                            <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>

                        <div className="modal-scroll overflow-y-auto p-6">
                            <p className="text-[13px] leading-snug text-[#5b6b7c]">
                                Shown in “Spread the Word” on every campaign that hasn’t uploaded its own video. To use a different video for one campaign, open that campaign and upload one there.
                            </p>

                            <div className="mt-4 grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">
                                {/* Video */}
                                <div>
                                    <p className="mb-2 text-sm font-bold text-[#003060]">Video</p>
                                    <div className="overflow-hidden rounded-xl border border-[#eef1f4] bg-[#f7f9fb]">
                                        {currentUrl ? (
                                            // eslint-disable-next-line jsx-a11y/media-has-caption
                                            <video src={currentUrl} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
                                        ) : (
                                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-center">
                                                <svg className="h-7 w-7 text-[#c3ccd6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                <p className="px-3 text-xs text-[#9aa7b8]">No default set — the built-in sample clip is used.</p>
                                            </div>
                                        )}
                                    </div>

                                    <input ref={fileRef} type="file" accept={ACCEPT} onChange={onPickFile} className="hidden" />
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        disabled={busy}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0268c0] px-4 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Uploading…</>
                                        ) : (
                                            <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{currentUrl ? "Replace video" : "Upload video"}</>
                                        )}
                                    </button>
                                    <p className="mt-1.5 text-[11px] text-[#9aa7b8]">MP4, WebM, OGG or MOV · up to {MAX_MB} MB</p>

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
                                        {currentUrl ? (
                                            <button onClick={removeVideo} disabled={busy} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#c2404b] transition-colors hover:bg-red-50 disabled:opacity-50">
                                                {removing ? "Removing…" : "Remove"}
                                            </button>
                                        ) : <span />}
                                        <button onClick={saveLink} disabled={busy || unchanged} className="rounded-lg border border-[#e7e9eb] px-3 py-1.5 text-xs font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-50">
                                            {saving ? "Saving…" : "Save link"}
                                        </button>
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <p className="mb-2 text-sm font-bold text-[#003060]">Thumbnail</p>
                                    <div className="overflow-hidden rounded-xl border border-[#eef1f4] bg-[#f7f9fb]">
                                        {currentThumbnailUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={currentThumbnailUrl} alt="Default video thumbnail" className="aspect-video w-full object-cover" />
                                        ) : (
                                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-center">
                                                <svg className="h-6 w-6 text-[#c3ccd6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
                                                <p className="px-3 text-[11px] text-[#9aa7b8]">No thumbnail — each campaign’s hero image is used.</p>
                                            </div>
                                        )}
                                    </div>

                                    <input ref={thumbRef} type="file" accept={THUMB_ACCEPT} onChange={onPickThumb} className="hidden" />
                                    <button
                                        onClick={() => thumbRef.current?.click()}
                                        disabled={busy}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0268c0] px-4 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                                    >
                                        {thumbBusy ? (
                                            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Uploading…</>
                                        ) : (
                                            <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{currentThumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}</>
                                        )}
                                    </button>
                                    <p className="mt-1.5 text-[11px] text-[#9aa7b8]">JPEG, PNG or WebP · up to {MAX_THUMB_MB} MB</p>
                                    <p className="mt-2 text-[11px] leading-snug text-[#9aa7b8]">Poster shown before the default video plays.</p>
                                    {currentThumbnailUrl && (
                                        <button onClick={removeThumb} disabled={busy} className="mt-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#c2404b] transition-colors hover:bg-red-50 disabled:opacity-50">Remove thumbnail</button>
                                    )}
                                </div>
                            </div>

                            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                            {ok    && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{ok}</p>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
