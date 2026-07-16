import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";

// Routes that never require auth
const PUBLIC_API_ROUTES = [
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",     // consumed via the emailed link (token-authed)
    "/api/v1/upload/profile-photo", // used before session exists
    "/api/v1/campaigns/init",       // public campaign creation (Step 1)
    "/api/v1/payments/intent",      // public donors can create & update payment intents
    "/api/v1/payments/record",      // public donors record completed payments
    "/api/v1/payments/webhook",     // Stripe webhook — no session
    "/api/v1/contact",              // public contact form
    "/api/v1/campaigns/search",     // header campaign search — public + launched only
];

// Pages that redirect logged-in users away to dashboard
const GUEST_ONLY_PAGES = ["/login", "/forgot-password", "/reset-password"];

export async function proxy(req: NextRequest) {
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

    // Public API routes — always allow
    if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.next();
    }

    // Protect /api/v1/* and /dashboard/* and /campaigns/*/create|edit
    const isProtectedApi = pathname.startsWith("/api/v1/");
    const isProtectedPage =
        pathname.startsWith("/dashboard") ||
        /^\/campaigns\/[^/]+\/(create|edit)$/.test(pathname);

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
        "/forgot-password",
        "/reset-password",
        "/dashboard/:path*",
        "/campaigns/:slug/create",
        "/campaigns/:slug/edit",
        "/api/v1/:path*",
    ],
};
