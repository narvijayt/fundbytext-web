// GET /api/v1/admin/campaigns/:slug/donors — a campaign's donors (search / status filter / sort / paginate).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { queryCampaignDonors } from "@/app/(protected)/admin/campaigns/[slug]/_lib/donors-query";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { slug } = await ctx.params;
        const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true } });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const sp = req.nextUrl.searchParams;
        const result = await queryCampaignDonors({
            campaignId: campaign.id,
            query:      sp.get("q")      ?? "",
            status:     sp.get("status") ?? "all",
            sort:       sp.get("sort")   ?? "newest",
            page:       parseInt(sp.get("page")      ?? "1") || 1,
            pageSize:   parseInt(sp.get("page_size") ?? "")  || undefined,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET admin/campaigns/slug/donors]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
