// GET/PUT /api/v1/admin/settings/campaign-video
// Admin only — read or set the site-wide default campaign video, used on every
// campaign that hasn't set its own video.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/session";
import { getDefaultCampaignVideo, getDefaultCampaignVideoThumbnail, setSetting, SETTING_KEYS } from "@/lib/settings";

const urlOrNull = z.union([z.string().trim().url().max(2048), z.null()]);
const bodySchema = z.object({
    video_url:           urlOrNull.optional(),
    video_thumbnail_url: urlOrNull.optional(),
}).refine((d) => d.video_url !== undefined || d.video_thumbnail_url !== undefined, {
    message: "At least one field is required.",
});

async function requireAdmin(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    return user && user.role === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
    if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const [video_url, video_thumbnail_url] = await Promise.all([getDefaultCampaignVideo(), getDefaultCampaignVideoThumbnail()]);
    return NextResponse.json({ video_url, video_thumbnail_url });
}

export async function PUT(req: NextRequest) {
    try {
        if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

        const { video_url, video_thumbnail_url } = parsed.data;
        if (video_url !== undefined) await setSetting(SETTING_KEYS.defaultCampaignVideo, video_url || null);
        if (video_thumbnail_url !== undefined) await setSetting(SETTING_KEYS.defaultCampaignVideoThumbnail, video_thumbnail_url || null);

        return NextResponse.json({ ok: true, video_url, video_thumbnail_url });
    } catch (err) {
        console.error("[PUT admin/settings/campaign-video]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
