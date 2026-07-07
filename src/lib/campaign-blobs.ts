import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Only our own Vercel Blob uploads can (and should) be deleted — externally
// pasted links (e.g. a video URL the organizer typed in) must be left alone.
const isBlobUrl = (u: unknown): u is string =>
    typeof u === "string" && u.includes(".blob.vercel-storage.com/");

/**
 * Collect a campaign's OWN uploaded blob URLs so they can be removed from
 * storage when the campaign is deleted: all campaign media (profile / hero /
 * gallery), plus the video, its thumbnail and any custom background.
 *
 * Deliberately excludes member/participant profile photos and organization
 * logos — those are stored on (and shared with) the User / Organization and
 * must not be deleted just because one campaign is removed.
 *
 * Must be called BEFORE the campaign row is deleted (it reads from the DB).
 */
export async function collectCampaignBlobUrls(campaignId: string): Promise<string[]> {
    const [media, campaign] = await Promise.all([
        prisma.campaignMedia.findMany({ where: { campaign_id: campaignId }, select: { url: true } }),
        prisma.campaign.findUnique({
            where:  { id: campaignId },
            select: { video_url: true, video_thumbnail_url: true, custom_background_url: true },
        }),
    ]);
    const urls = [
        ...media.map((m) => m.url),
        campaign?.video_url,
        campaign?.video_thumbnail_url,
        campaign?.custom_background_url,
    ].filter(isBlobUrl);
    return [...new Set(urls)];
}

/** Best-effort blob deletion — never throws, so cleanup can't fail a request. */
export async function purgeBlobs(urls: string[]): Promise<void> {
    const blobs = urls.filter(isBlobUrl);
    if (blobs.length === 0) return;
    try { await Promise.allSettled(blobs.map((u) => del(u))); } catch { /* ignore */ }
}
