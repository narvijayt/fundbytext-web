import type { MetadataRoute } from "next";

// Same base URL the root metadata uses, falling back to the Vercel domain.
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://fundbytext-web.vercel.app";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Signed-in areas, the API, the auth utility flows, and the /test-home
            // scratch page have nothing worth crawling.
            disallow: [
                "/dashboard",
                "/admin",
                "/api/",
                "/login",
                "/forgot-password",
                "/reset-password",
                "/verify-email",
                "/test-home",
            ],
        },
        sitemap: `${BASE}/sitemap.xml`,
        host: BASE,
    };
}
