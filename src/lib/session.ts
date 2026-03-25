import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile_photo_url: string | null;
};

async function verifyAndFetch(token: string): Promise<AuthUser | null> {
    // 1. Verify JWT signature (and expiry if present — web tokens have it, mobile don't)
    const payload = await verifyToken(token);
    if (!payload) return null;

    // 2. Check session exists and is not revoked
    //    If the user was deleted, cascade will have removed the session row too.
    const session = await prisma.userSession.findUnique({
        where: { id: payload.sessionId },
    });
    if (!session || session.revoked_at !== null) return null;

    // 3. Honour DB-level expiry for web sessions
    if (session.expires_at && session.expires_at < new Date()) return null;

    // 4. Fetch the user (handles manual deletion without cascade edge cases)
    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            profile_photo_url: true,
        },
    });

    return user ?? null;
}

/**
 * For Server Components / Layouts — reads from the httpOnly cookie.
 * Returns null if the user is unauthenticated, session revoked, or user deleted.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    return verifyAndFetch(token);
}

/**
 * For Route Handlers — reads from cookie (web) or Authorization header (mobile).
 * Returns null if the user is unauthenticated, session revoked, or user deleted.
 */
export async function getAuthUserFromRequest(
    req: NextRequest
): Promise<AuthUser | null> {
    const token = extractToken(req);
    if (!token) return null;
    return verifyAndFetch(token);
}
