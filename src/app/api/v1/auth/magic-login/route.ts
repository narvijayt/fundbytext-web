// GET /api/v1/auth/magic-login?token=xxx
// Auto-authenticates a participant via their invite token and redirects to
// their campaign's setup wizard. If the participant hasn't created an account
// yet (user_id is null), forwards them to the join/account-setup page instead.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { APP_URL } from "@/lib/app-url";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
        return NextResponse.redirect(new URL("/login?error=invalid_link", APP_URL));
    }

    const member = await prisma.campaignMember.findUnique({
        where: { invite_token: token },
        select: {
            user_id: true,
            campaign: { select: { slug: true } },
        },
    });

    if (!member) {
        return NextResponse.redirect(new URL("/login?error=invalid_link", APP_URL));
    }

    const { slug } = member.campaign;

    // No account yet — send them to the join/account-setup page first
    if (!member.user_id) {
        return NextResponse.redirect(
            new URL(`/campaigns/${slug}/join?token=${token}`, APP_URL)
        );
    }

    // Account exists — find the user and create a session
    const user = await prisma.user.findUnique({
        where: { id: member.user_id },
        select: { id: true, role: true },
    });

    if (!user) {
        return NextResponse.redirect(new URL("/login?error=invalid_link", APP_URL));
    }

    const sessionId = crypto.randomUUID();
    const expiresIn = "2h";
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const cookieMaxAge = 2 * 60 * 60;

    const jwtToken = await signToken(
        { sub: user.id, role: user.role, sessionId },
        expiresIn
    );

    await prisma.userSession.create({
        data: {
            id: sessionId,
            user_id: user.id,
            expires_at: sessionExpiresAt,
            is_mobile: false,
            ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
            user_agent: req.headers.get("user-agent"),
        },
    });

    const redirect = NextResponse.redirect(
        new URL(`/campaigns/${slug}/create`, APP_URL)
    );
    setAuthCookie(redirect, jwtToken, cookieMaxAge);
    return redirect;
}
