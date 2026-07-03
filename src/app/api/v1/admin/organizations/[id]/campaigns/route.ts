// GET /api/v1/admin/organizations/:id/campaigns — an org's campaigns (search / status filter / sort / paginate).

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/session";
import { queryOrgCampaigns } from "@/app/(protected)/admin/organizations/[id]/_lib/query";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;
        const sp = req.nextUrl.searchParams;
        const result = await queryOrgCampaigns({
            orgId:    id,
            query:    sp.get("q")      ?? "",
            status:   sp.get("status") ?? "all",
            sort:     sp.get("sort")   ?? "newest",
            page:     parseInt(sp.get("page")      ?? "1") || 1,
            pageSize: parseInt(sp.get("page_size") ?? "")  || undefined,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET admin/organizations/id/campaigns]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
