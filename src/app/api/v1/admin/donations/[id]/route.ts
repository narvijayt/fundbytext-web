// PATCH /api/v1/admin/donations/:id — flag or unflag a donation (admin only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;
        const body = await req.json().catch(() => null);

        if (typeof body?.is_flagged !== "boolean") {
            return NextResponse.json({ error: "is_flagged (boolean) required" }, { status: 422 });
        }
        if ("flag_note" in body && body.flag_note !== null && typeof body.flag_note !== "string") {
            return NextResponse.json({ error: "flag_note must be a string or null" }, { status: 422 });
        }

        const existing = await prisma.donation.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updated = await prisma.donation.update({
            where: { id },
            data:  {
                is_flagged: body.is_flagged,
                flag_note:  body.is_flagged ? (body.flag_note?.trim() || null) : null,
            },
            select: { id: true, is_flagged: true, flag_note: true },
        });

        return NextResponse.json({ donation: updated });
    } catch (err) {
        console.error("[PATCH admin/donations/id]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
