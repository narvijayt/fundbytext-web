import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { sendEmailVerificationEmail } from "@/lib/mail";

// Send a verification link to the signed-in user's current email address.
export async function POST(req: NextRequest) {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { id: true, email: true, first_name: true, is_email_verified: true },
    });
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.is_email_verified) {
        return NextResponse.json({ message: "Your email is already verified." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
        where: { id: user.id },
        data: { email_verification_token: tokenHash, email_verification_expires: expires },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    try {
        await sendEmailVerificationEmail(user.email, user.first_name, verifyUrl);
    } catch {
        return NextResponse.json({ error: "Couldn't send the verification email. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ message: "Verification email sent." });
}
