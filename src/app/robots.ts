import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/app-url";

// Same base URL the root metadata uses, falling back to the Vercel domain.
const BASE = APP_URL;

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
