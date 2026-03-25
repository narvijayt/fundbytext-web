import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractToken, verifyToken, clearAuthCookie } from "@/lib/auth";

// GET — used server-side (e.g. from layout) to clear cookie + redirect to /login.
// Required because Server Components cannot set cookies directly.
export async function GET(req: NextRequest) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    clearAuthCookie(res);
    return res;
}

export async function POST(req: NextRequest) {
    const token = extractToken(req);

    if (token) {
        const payload = await verifyToken(token);
        if (payload?.sessionId) {
            await prisma.userSession
                .update({
                    where: { id: payload.sessionId },
                    data: { revoked_at: new Date() },
                })
                .catch(() => null); // session may already be gone — ignore
        }
    }

    const res = NextResponse.json({ message: "Logged out" });
    clearAuthCookie(res);
    return res;
}
