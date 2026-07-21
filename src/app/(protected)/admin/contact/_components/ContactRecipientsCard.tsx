"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* Who gets emailed when someone submits the contact form.
   This is a rarely-touched setting, so it lives behind a compact header button
   rather than a card above the table — the submissions listing is the reason
   anyone opens this page and gets the full width and the top of the fold. */

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]";
const INPUT =
    "w-full rounded-lg border border-[#e7e9eb] px-3 py-2.5 text-[13px] text-[#003060] outline-none " +
    "transition-colors placeholder:text-[#aeb5bd] focus:border-[#0268c0] disabled:bg-[#f7f9fb]";

export type Recipients = { to: string[]; cc: string[]; bcc: string[] };

/** Pull a readable message out of either a plain string error or a zod flatten. */
function readError(payload: unknown): string {
    if (typeof payload === "string") return payload;
    if (payload && typeof payload === "object") {
        const e = payload as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        const first =
            e.formErrors?.[0] ??
            Object.values(e.fieldErrors ?? {}).flat()[0];
        if (first) return first;
    }
    return "Failed to save.";
}

export default function ContactRecipientsCard({
    initial,
    fallback,
}: {
    initial: Recipients;
    /** Where submissions go when To is left empty. */
    fallback: string;
}) {
    const [saved, setSaved] = useState<Recipients>(initial);
    const [open, setOpen] = useState(false);

    const count = saved.to.length + saved.cc.length + saved.bcc.length;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={`Contact form notifications go to: ${saved.to.join(", ") || fallback}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-[#d4dee7] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#003060] shadow-[0px_1px_2px_0px_rgba(0,48,96,0.04)] transition-colors hover:bg-[#f4f8f9]"
            >
                <svg className="h-4 w-4 text-[#7e8a96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Notification Recipients</span>
                <span className="sm:hidden">Recipients</span>
                <span className="rounded-full bg-[#eef5fc] px-2 py-0.5 text-[11px] font-bold text-[#0268c0]">{count}</span>
            </button>

            {open && (
                <RecipientsModal
                    saved={saved}
                    fallback={fallback}
                    onSaved={setSaved}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

function RecipientsModal({
    saved,
    fallback,
    onSaved,
    onClose,
}: {
    saved: Recipients;
    fallback: string;
    onSaved: (r: Recipients) => void;
    onClose: () => void;
}) {
    const router = useRouter();
    const [shown, setShown] = useState(false);
    const [to, setTo] = useState(saved.to.join(", "));
    const [cc, setCc] = useState(saved.cc.join(", "));
    const [bcc, setBcc] = useState(saved.bcc.join(", "));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    function close() { setShown(false); window.setTimeout(onClose, 170); }

    useEffect(() => {
        const raf = requestAnimationFrame(() => setShown(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function save() {
        setSaving(true); setError(null); setOk(null);
        try {
            const res = await fetch("/api/v1/admin/settings/contact-recipients", {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ to, cc, bcc }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(readError(j.error));
            // The API returns the resolved lists (To fallback applied), so the
            // summary shows exactly where the next submission will land.
            const next: Recipients = { to: j.to ?? [], cc: j.cc ?? [], bcc: j.bcc ?? [] };
            onSaved(next);
            setTo(next.to.join(", "));
            setCc(next.cc.join(", "));
            setBcc(next.bcc.join(", "));
            setOk("Recipients saved.");
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        }
        setSaving(false);
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1d43]/45 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={close}
        >
            <div
                role="dialog" aria-modal="true" aria-labelledby="recipients-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_16px_40px_-8px_rgba(15,29,67,0.3)] transition-transform duration-200 motion-reduce:transition-none ${shown ? "scale-100" : "scale-95"}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#0268c0] px-5 py-4 text-white">
                    <h2 id="recipients-title" className="text-[16px] font-bold">Notification Recipients</h2>
                    <button onClick={close} aria-label="Close" className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="modal-scroll flex-1 overflow-y-auto p-5">
                    <p className="text-[13px] leading-relaxed text-[#7e8a96]">
                        Who gets emailed when someone submits the contact form.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className={LABEL} htmlFor="cr-to">To</label>
                            <input id="cr-to" className={INPUT} value={to} disabled={saving}
                                onChange={(e) => setTo(e.target.value)} placeholder="team@fundbytext.com" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={LABEL} htmlFor="cr-cc">Cc</label>
                                <input id="cr-cc" className={INPUT} value={cc} disabled={saving}
                                    onChange={(e) => setCc(e.target.value)} placeholder="optional" />
                            </div>
                            <div>
                                <label className={LABEL} htmlFor="cr-bcc">Bcc</label>
                                <input id="cr-bcc" className={INPUT} value={bcc} disabled={saving}
                                    onChange={(e) => setBcc(e.target.value)} placeholder="optional" />
                            </div>
                        </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#9aa7b8]">
                        Separate multiple addresses with commas. Leave To empty to fall back to{" "}
                        <span className="font-semibold text-[#7e8a96]">{fallback}</span>.
                    </p>

                    {error && (
                        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">{error}</p>
                    )}
                    {ok && (
                        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-700">{ok}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#eef1f4] px-5 py-4">
                    <button
                        type="button"
                        onClick={close}
                        disabled={saving}
                        className="rounded-[10px] border border-[#d4dee7] px-4 py-2.5 text-[13px] font-semibold text-[#003060] transition-colors hover:bg-gray-50 disabled:opacity-60"
                    >
                        {ok ? "Done" : "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="rounded-[10px] bg-[#0268c0] px-5 py-2.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
