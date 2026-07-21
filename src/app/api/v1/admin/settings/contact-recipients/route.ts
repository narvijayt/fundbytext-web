// GET/PUT /api/v1/admin/settings/contact-recipients
// Admin only — read or set who receives contact-form submissions.
//
// Stored in app_settings as comma-separated lists (one key per header) rather
// than a join table: it's a short, site-wide list that only admins edit.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/session";
import {
    getContactRecipients,
    setSetting,
    SETTING_KEYS,
    DEFAULT_CONTACT_RECIPIENT,
} from "@/lib/settings";

/* Accepts either an array of addresses or a comma-separated string, so the
   field can be typed freely in the admin UI. Every entry must be a valid
   email; the whole list is normalised to lowercase and de-duplicated. */
const emailList = z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .transform((arr) => arr.map((s) => s.trim().toLowerCase()).filter(Boolean))
    .transform((arr) => [...new Set(arr)])
    .superRefine((arr, ctx) => {
        for (const addr of arr) {
            if (!z.string().email().safeParse(addr).success) {
                ctx.addIssue({ code: "custom", message: `"${addr}" is not a valid email address.` });
            }
        }
        if (arr.length > 25) {
            ctx.addIssue({ code: "custom", message: "At most 25 addresses per field." });
        }
    });

const bodySchema = z.object({
    to:  emailList.optional(),
    cc:  emailList.optional(),
    bcc: emailList.optional(),
}).refine((d) => d.to !== undefined || d.cc !== undefined || d.bcc !== undefined, {
    message: "At least one field is required.",
});

async function requireAdmin(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    return user && user.role === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
    if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const recipients = await getContactRecipients();
    // Surface the fallback so the UI can explain where mail goes when To is empty.
    return NextResponse.json({ ...recipients, fallback: DEFAULT_CONTACT_RECIPIENT });
}

export async function PUT(req: NextRequest) {
    try {
        if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

        const { to, cc, bcc } = parsed.data;
        // Store null (not "") when a list is cleared, so getSetting reads it as unset.
        if (to  !== undefined) await setSetting(SETTING_KEYS.contactRecipientsTo,  to.join(", ")  || null);
        if (cc  !== undefined) await setSetting(SETTING_KEYS.contactRecipientsCc,  cc.join(", ")  || null);
        if (bcc !== undefined) await setSetting(SETTING_KEYS.contactRecipientsBcc, bcc.join(", ") || null);

        // Return the resolved values (with the To fallback applied) so the UI
        // shows exactly where the next submission will actually go.
        const recipients = await getContactRecipients();
        return NextResponse.json({ ok: true, ...recipients, fallback: DEFAULT_CONTACT_RECIPIENT });
    } catch (err) {
        console.error("[PUT admin/settings/contact-recipients]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
