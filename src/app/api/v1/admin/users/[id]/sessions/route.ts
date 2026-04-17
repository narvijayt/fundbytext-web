// DELETE /api/v1/admin/users/:id/sessions — revoke all active sessions for a user

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;

        const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { count } = await prisma.userSession.updateMany({
            where: { user_id: id, revoked_at: null },
            data:  { revoked_at: new Date() },
        });

        return NextResponse.json({ ok: true, revoked: count });
    } catch (err) {
        console.error("[DELETE admin/users/id/sessions]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
