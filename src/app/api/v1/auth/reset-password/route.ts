import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(6),
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

    const { email, token, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    const invalid = NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
    );

    if (
        !user ||
        !user.password_reset_token ||
        !user.password_reset_expires ||
        user.password_reset_expires < new Date()
    ) {
        return invalid;
    }

    const valid = await bcrypt.compare(token, user.password_reset_token);
    if (!valid) return invalid;

    const password_hash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
        // Update password and clear reset token
        prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                password_reset_token: null,
                password_reset_expires: null,
            },
        }),
        // Revoke all existing sessions
        prisma.userSession.updateMany({
            where: { user_id: user.id, revoked_at: null },
            data: { revoked_at: new Date() },
        }),
    ]);

    return NextResponse.json({ message: "Password updated. Please log in." });
}
