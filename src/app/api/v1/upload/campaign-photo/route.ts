// POST /api/v1/upload/campaign-photo
// Authenticated — uploads a campaign photo and returns the URL.
// Expects multipart/form-data with fields: photo (File), type (profile|hero|gallery)

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { getAuthUserFromRequest } from "@/lib/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MEDIA_TYPES = ["profile", "hero", "gallery"];

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData().catch(() => null);
        if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

        const file = formData.get("photo") as File | null;
        const mediaType = formData.get("type") as string | null;

        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No photo provided" }, { status: 400 });
        }
        if (!mediaType || !ALLOWED_MEDIA_TYPES.includes(mediaType)) {
            return NextResponse.json(
                { error: "type must be profile, hero, or gallery" },
                { status: 400 }
            );
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG, PNG, or WebP images are allowed" },
                { status: 422 }
            );
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: "File size must be under 10 MB" }, { status: 422 });
        }

        const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const filename = `campaigns/${mediaType}/${crypto.randomUUID()}.${ext}`;

        const blob = await put(filename, file, { access: "public" });

        return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (err) {
        console.error("[POST upload/campaign-photo]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
