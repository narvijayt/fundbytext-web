import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import { APP_URL } from "@/lib/app-url";

const BASE = APP_URL;

// Static marketing routes. /test-home is a scratch page and the auth/dashboard/
// admin trees are noindex, so none of those appear here.
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/",             changeFrequency: "daily",   priority: 1.0 },
    { path: "/about",        changeFrequency: "monthly", priority: 0.7 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
    { path: "/campaigns",    changeFrequency: "daily",   priority: 0.9 },
    { path: "/resources",    changeFrequency: "monthly", priority: 0.6 },
    { path: "/faq",          changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact",      changeFrequency: "yearly",  priority: 0.5 },
    { path: "/privacy",      changeFrequency: "yearly",  priority: 0.3 },
    { path: "/terms",        changeFrequency: "yearly",  priority: 0.3 },
    { path: "/cookies",      changeFrequency: "yearly",  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
        url: `${BASE}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }));

    // Only public campaigns that are actually viewable are listed — private ones
    // 403 to non-members, and drafts aren't live yet. Mirrors the /campaigns query.
    let campaignEntries: MetadataRoute.Sitemap = [];
    try {
        const campaigns = await prisma.campaign.findMany({
            where: {
                visibility: "public",
                status: { in: [CampaignStatus.active, CampaignStatus.upcoming, CampaignStatus.completed] },
            },
            select: { slug: true, updated_at: true },
            orderBy: { updated_at: "desc" },
            take: 5000,
        });

        campaignEntries = campaigns.map((c) => ({
            url: `${BASE}/campaigns/${c.slug}`,
            lastModified: c.updated_at,
            changeFrequency: "daily",
            priority: 0.7,
        }));
    } catch {
        // A build without DB access (or a transient error) should still emit the
        // static sitemap rather than fail the route.
        campaignEntries = [];
    }

    return [...staticEntries, ...campaignEntries];
}
