import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

const schema = z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.email().max(255),
    phone: z.string().max(20).optional(),
    password: z.string().min(6),
    profile_photo_url: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
    }

    const { first_name, last_name, email, phone, password, profile_photo_url } = parsed.data;
    const isMobile = req.headers.get("x-client-type") === "mobile";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { first_name, last_name, email, phone, password_hash, profile_photo_url, role: "admin" },
        select: { id: true, email: true, first_name: true, last_name: true, role: true },
    });

    const sessionId = crypto.randomUUID();
    // Signup always uses 2h web session (no remember_me on signup)
    const expiresIn = isMobile ? undefined : "2h";
    const sessionExpiresAt = isMobile ? null : new Date(Date.now() + 2 * 60 * 60 * 1000);

    const token = await signToken(
        { sub: user.id, role: user.role, sessionId },
        expiresIn
    );

    await prisma.userSession.create({
        data: {
            id: sessionId,
            user_id: user.id,
            expires_at: sessionExpiresAt,
            is_mobile: isMobile,
            ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
            user_agent: req.headers.get("user-agent"),
        },
    });

    if (isMobile) {
        return NextResponse.json({ user, token }, { status: 201 });
    }

    const res = NextResponse.json({ user }, { status: 201 });
    setAuthCookie(res, token, 2 * 60 * 60);
    return res;
}
