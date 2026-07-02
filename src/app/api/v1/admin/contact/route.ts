// GET /api/v1/admin/contact — admin contact-submissions listing (search / filter / sort / paginate).
// Backs the client-fetched AdminContactTable so interactions refetch in-place.

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/session";
import { queryAdminContact } from "@/app/(protected)/admin/contact/_lib/query";

export async function GET(req: NextRequest) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sp = req.nextUrl.searchParams;
        const result = await queryAdminContact({
            query:    sp.get("q")      ?? "",
            filter:   sp.get("filter") ?? "all",
            sort:     sp.get("sort")   ?? "newest",
            page:     parseInt(sp.get("page")      ?? "1") || 1,
            pageSize: parseInt(sp.get("page_size") ?? "")  || undefined,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET admin/contact]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
