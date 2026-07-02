// GET /api/v1/admin/organizations — admin organizations listing (search / filter / sort / paginate).
// Backs the client-fetched AdminOrganizationsTable so interactions refetch in-place.

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/session";
import { queryAdminOrganizations } from "@/app/(protected)/admin/organizations/_lib/query";

export async function GET(req: NextRequest) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sp = req.nextUrl.searchParams;
        const result = await queryAdminOrganizations({
            query:    sp.get("q")      ?? "",
            filter:   sp.get("filter") ?? "all",
            sort:     sp.get("sort")   ?? "newest",
            page:     parseInt(sp.get("page")      ?? "1") || 1,
            pageSize: parseInt(sp.get("page_size") ?? "")  || undefined,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET admin/organizations]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
