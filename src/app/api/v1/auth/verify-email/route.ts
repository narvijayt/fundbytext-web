import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    token: z.string().min(1),
});

// Consume a verification token (from the emailed link) and mark the email verified.
// Public: the token itself is the proof, like the password-reset flow.
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    const { email, token } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    const invalid = NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });

    // Already verified (e.g. link clicked twice) → treat as success, not an error.
    if (user?.is_email_verified) {
        return NextResponse.json({ message: "Your email is already verified." });
    }

    if (
        !user ||
        !user.email_verification_token ||
        !user.email_verification_expires ||
        user.email_verification_expires < new Date()
    ) {
        return invalid;
    }

    const valid = await bcrypt.compare(token, user.email_verification_token);
    if (!valid) return invalid;

    await prisma.user.update({
        where: { id: user.id },
        data: {
            is_email_verified: true,
            email_verification_token: null,
            email_verification_expires: null,
        },
    });

    return NextResponse.json({ message: "Email verified." });
}
