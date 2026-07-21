// GET /api/v1/organizations/check-name?name=… — is this organization name free?
//
// Backs the live "already taken" hint on the campaign wizard's organization
// name field. Session required: this is only reachable from the wizard, and
// leaving it open would turn it into a free directory of every organization.
//
// The authoritative check runs again on save (PATCH /campaigns/:slug) — this
// endpoint is for feedback while typing, not enforcement.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/session";
import { isOrgNameTaken } from "@/lib/org-name";

const nameSchema = z.string().min(1).max(100);

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const parsed = nameSchema.safeParse(req.nextUrl.searchParams.get("name") ?? "");
        // An empty/oversized value isn't "taken" — the field's own required and
        // max-length rules report those.
        if (!parsed.success) return NextResponse.json({ taken: false });

        return NextResponse.json({ taken: await isOrgNameTaken(parsed.data, user.id) });
    } catch (err) {
        console.error("[GET organizations/check-name]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
