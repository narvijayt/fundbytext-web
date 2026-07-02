// PATCH /api/v1/admin/contact/:id — toggle the read flag on a contact submission (admin only).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({ is_read: z.boolean() }).strict();

export async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
        }

        const existing = await prisma.contactSubmission.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.contactSubmission.update({ where: { id }, data: { is_read: parsed.data.is_read } });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[PATCH admin/contact/id]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
