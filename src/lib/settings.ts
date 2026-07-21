import { prisma } from "@/lib/prisma";

// Well-known keys for the site-wide app_settings key/value store.
export const SETTING_KEYS = {
    /** Default campaign video shown on every campaign that hasn't set its own. */
    defaultCampaignVideo: "default_campaign_video_url",
    /** Default poster image for the default campaign video. */
    defaultCampaignVideoThumbnail: "default_campaign_video_thumbnail_url",
    /** Who receives contact-form submissions. Comma-separated email lists. */
    contactRecipientsTo:  "contact_recipients_to",
    contactRecipientsCc:  "contact_recipients_cc",
    contactRecipientsBcc: "contact_recipients_bcc",
} as const;

/** Used when no To recipients have been configured yet, so submissions are
 *  never silently delivered to nobody. Overridable via env. */
export const DEFAULT_CONTACT_RECIPIENT =
    process.env.CONTACT_RECIPIENT ?? "agd.abhaykumar@gmail.com";

/** Split a stored "a@x.com, b@y.com" list into trimmed, non-empty addresses. */
export function parseEmailList(value: string | null | undefined): string[] {
    if (!value) return [];
    return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function getSetting(key: string): Promise<string | null> {
    const row = await prisma.appSetting.findUnique({ where: { key }, select: { value: true } });
    return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
    await prisma.appSetting.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
    });
}

/** Convenience: the global default campaign video URL (or null if unset). */
export function getDefaultCampaignVideo(): Promise<string | null> {
    return getSetting(SETTING_KEYS.defaultCampaignVideo);
}

/** Convenience: the global default campaign video poster URL (or null if unset). */
export function getDefaultCampaignVideoThumbnail(): Promise<string | null> {
    return getSetting(SETTING_KEYS.defaultCampaignVideoThumbnail);
}

export type ContactRecipients = { to: string[]; cc: string[]; bcc: string[] };

/** Who a contact-form submission should be emailed to.
 *  `to` always resolves to at least one address: if an admin clears the list (or
 *  it was never set), it falls back to DEFAULT_CONTACT_RECIPIENT rather than
 *  sending to nobody. cc/bcc are genuinely optional. */
export async function getContactRecipients(): Promise<ContactRecipients> {
    const [to, cc, bcc] = await Promise.all([
        getSetting(SETTING_KEYS.contactRecipientsTo),
        getSetting(SETTING_KEYS.contactRecipientsCc),
        getSetting(SETTING_KEYS.contactRecipientsBcc),
    ]);
    const toList = parseEmailList(to);
    return {
        to:  toList.length ? toList : [DEFAULT_CONTACT_RECIPIENT],
        cc:  parseEmailList(cc),
        bcc: parseEmailList(bcc),
    };
}
