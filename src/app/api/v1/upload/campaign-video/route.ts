// POST /api/v1/upload/campaign-video
// Admin only — uploads a campaign video and returns the URL.
// Expects multipart/form-data with field: video (File)

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { getAuthUserFromRequest } from "@/lib/session";

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_SIZE_BYTES = 64 * 1024 * 1024; // 64 MB
const EXT: Record<string, string> = {
    "video/mp4":        "mp4",
    "video/webm":       "webm",
    "video/ogg":        "ogv",
    "video/quicktime":  "mov",
};

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData().catch(() => null);
        if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

        const file = formData.get("video") as File | null;
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No video provided" }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only MP4, WebM, OGG, or MOV videos are allowed" },
                { status: 422 }
            );
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: "Video must be under 64 MB" }, { status: 422 });
        }

        const ext = EXT[file.type] ?? "mp4";
        const filename = `campaigns/video/${crypto.randomUUID()}.${ext}`;

        const blob = await put(filename, file, { access: "public" });
        return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (err) {
        console.error("[POST upload/campaign-video]", err);
        const message = err instanceof Error ? err.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
