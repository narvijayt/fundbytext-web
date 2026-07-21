"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* Who gets emailed when someone submits the contact form.
   Collapsed by default so it doesn't push the submissions table down — the
   summary line is enough to confirm at a glance where mail is going. */

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
    const router = useRouter();
    const [saved, setSaved] = useState<Recipients>(initial);
    const [open,   setOpen]   = useState(false);
    const [to,     setTo]     = useState(initial.to.join(", "));
    const [cc,     setCc]     = useState(initial.cc.join(", "));
    const [bcc,    setBcc]    = useState(initial.bcc.join(", "));
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);
    const [ok,     setOk]     = useState<string | null>(null);

    function edit() {
        setTo(saved.to.join(", "));
        setCc(saved.cc.join(", "));
        setBcc(saved.bcc.join(", "));
        setError(null); setOk(null);
        setOpen(true);
    }

    function cancel() { setOpen(false); setError(null); setOk(null); }

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
            setSaved(next);
            setOk("Recipients saved.");
            setOpen(false);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        }
        setSaving(false);
    }

    const usingFallback =
        saved.to.length === 1 && saved.to[0].toLowerCase() === fallback.toLowerCase();

    return (
        <div className="mb-5 rounded-2xl border border-[#e7e9eb] bg-white p-4 shadow-[0px_4px_30px_0px_rgba(0,91,172,0.08)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-[#003060]">Notification Recipients</h2>
                    <p className="mt-0.5 text-xs text-[#9aa7b8]">
                        Who gets emailed when someone submits the contact form.
                    </p>
                </div>
                {!open && (
                    <button
                        type="button"
                        onClick={edit}
                        className="shrink-0 rounded-lg border border-[#e7e9eb] px-4 py-2 text-[13px] font-semibold text-[#0268c0] transition-colors hover:bg-[#0268c0]/8"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Success message persists after collapsing, so a save is visibly confirmed. */}
            {ok && !open && (
                <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-700">{ok}</p>
            )}

            {!open ? (
                <dl className="mt-4 space-y-2.5">
                    {([["To", saved.to], ["Cc", saved.cc], ["Bcc", saved.bcc]] as const).map(([name, list]) => (
                        <div key={name} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <dt className="w-8 shrink-0 text-[11px] font-bold uppercase tracking-[0.5px] text-[#7e8a96]">{name}</dt>
                            <dd className="min-w-0 flex-1 text-[13px] text-[#003060]">
                                {list.length
                                    ? list.join(", ")
                                    : <span className="italic text-[#aeb5bd]">None</span>}
                            </dd>
                        </div>
                    ))}
                    {usingFallback && (
                        <p className="pt-1 text-xs text-[#9aa7b8]">
                            No recipients set — falling back to the built-in address.
                        </p>
                    )}
                </dl>
            ) : (
                <div className="mt-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className={LABEL} htmlFor="cr-to">To</label>
                            <input id="cr-to" className={INPUT} value={to} disabled={saving}
                                onChange={(e) => setTo(e.target.value)} placeholder="team@fundbytext.com" />
                        </div>
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

                    <p className="mt-2 text-xs text-[#9aa7b8]">
                        Separate multiple addresses with commas. Leave To empty to fall back to{" "}
                        <span className="font-semibold text-[#7e8a96]">{fallback}</span>.
                    </p>

                    {error && (
                        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">{error}</p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="rounded-lg bg-[#0268c0] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#005bac] disabled:opacity-60"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={saving}
                            className="rounded-lg border border-[#e7e9eb] px-4 py-2 text-[13px] font-semibold text-[#7e8a96] transition-colors hover:bg-gray-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
