// GET/PUT /api/v1/admin/settings/campaign-video
// Admin only — read or set the site-wide default campaign video, used on every
// campaign that hasn't set its own video.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/session";
import { getDefaultCampaignVideo, setSetting, SETTING_KEYS } from "@/lib/settings";

const bodySchema = z.object({
    video_url: z.union([z.string().trim().url().max(2048), z.null()]),
});

async function requireAdmin(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    return user && user.role === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
    if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ video_url: await getDefaultCampaignVideo() });
}

export async function PUT(req: NextRequest) {
    try {
        if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

        const value = parsed.data.video_url === "" ? null : parsed.data.video_url;
        await setSetting(SETTING_KEYS.defaultCampaignVideo, value);

        return NextResponse.json({ ok: true, video_url: value });
    } catch (err) {
        console.error("[PUT admin/settings/campaign-video]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
