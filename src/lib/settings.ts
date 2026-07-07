import { prisma } from "@/lib/prisma";

// Well-known keys for the site-wide app_settings key/value store.
export const SETTING_KEYS = {
    /** Default campaign video shown on every campaign that hasn't set its own. */
    defaultCampaignVideo: "default_campaign_video_url",
} as const;

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
