import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";

export interface TokenPayload extends JWTPayload {
    sub: string; // user id
    role: string;
    sessionId: string;
}

function secret() {
    const s = process.env.JWT_ACCESS_SECRET;
    if (!s) throw new Error("JWT_ACCESS_SECRET is not set");
    return new TextEncoder().encode(s);
}

/**
 * Sign a JWT.
 * @param expiresIn  e.g. "2h" | "30d" — omit for mobile (never expires)
 */
export async function signToken(
    payload: { sub: string; role: string; sessionId: string },
    expiresIn?: string
): Promise<string> {
    let builder = new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt();

    if (expiresIn) {
        builder = builder.setExpirationTime(expiresIn);
    }

    return builder.sign(secret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret());
        return payload as TokenPayload;
    } catch {
        return null;
    }
}

/** Reads the token from httpOnly cookie (web) or Authorization header (mobile). */
export function extractToken(req: NextRequest): string | null {
    const fromCookie = req.cookies.get("access_token")?.value;
    if (fromCookie) return fromCookie;

    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) return auth.slice(7);

    return null;
}

/** Sets the access_token httpOnly cookie — web only. */
export function setAuthCookie(
    res: NextResponse,
    token: string,
    maxAge: number // seconds
) {
    res.cookies.set("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
    });
}

export function clearAuthCookie(res: NextResponse) {
    res.cookies.delete("access_token");
}

// requireRole — returns a 403 response if the user lacks the required role
export function requireRole(
    user: TokenPayload | null,
    role: string
): NextResponse | null {
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== role) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
}
