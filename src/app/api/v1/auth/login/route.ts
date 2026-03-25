import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember_me: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const { email, password, remember_me } = parsed.data;
    const isMobile = req.headers.get("x-client-type") === "mobile";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Determine expiry
    // Mobile: never expires (no exp claim, null DB expiry)
    // Web remember_me: 30 days
    // Web default: 2 hours
    let expiresIn: string | undefined;
    let sessionExpiresAt: Date | null;
    let cookieMaxAge: number;

    if (isMobile) {
        expiresIn = undefined;       // no exp claim in JWT
        sessionExpiresAt = null;     // null = never in DB
        cookieMaxAge = 0;            // not used for mobile
    } else if (remember_me) {
        expiresIn = "30d";
        sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        cookieMaxAge = 30 * 24 * 60 * 60;
    } else {
        expiresIn = "2h";
        sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        cookieMaxAge = 2 * 60 * 60;
    }

    const sessionId = crypto.randomUUID();
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

    const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
    };

    if (isMobile) {
        // Mobile: return token in body — client stores it and sends as Bearer header
        return NextResponse.json({ user: userData, token });
    }

    const res = NextResponse.json({ user: userData });
    setAuthCookie(res, token, cookieMaxAge);
    return res;
}
