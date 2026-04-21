import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("photo") as File | null;
    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
            { status: 422 }
        );
    }

    if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
            { error: "File size must be under 5MB" },
            { status: 422 }
        );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `profiles/${crypto.randomUUID()}.${ext}`;

    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ url: blob.url }, { status: 201 });
}
