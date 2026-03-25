import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";

const AUTH_API_ROUTES = [
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/upload/profile-photo", // used during signup before a session exists
];

const GUEST_ONLY_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // JWT-only check — no DB (Edge runtime compatible)
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;

    // Logged-in users cannot access auth pages — send them to dashboard
    if (GUEST_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
        if (payload) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // Public auth API routes — always allow
    if (AUTH_API_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.next();
    }

    // Protect /api/v1/* and /dashboard/*
    const isProtectedApi = pathname.startsWith("/api/v1/");
    const isProtectedPage = pathname.startsWith("/dashboard");

    if (!isProtectedApi && !isProtectedPage) {
        return NextResponse.next();
    }

    if (!payload) {
        if (isProtectedApi) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Forward user identity to route handlers via headers
    const res = NextResponse.next();
    res.headers.set("x-user-id", payload.sub);
    res.headers.set("x-user-role", payload.role);
    return res;
}

export const config = {
    matcher: [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/dashboard/:path*",
        "/api/v1/:path*",
    ],
};
