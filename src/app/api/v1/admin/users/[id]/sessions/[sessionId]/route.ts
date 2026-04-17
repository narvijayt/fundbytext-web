// DELETE /api/v1/admin/users/:id/sessions/:sessionId — revoke a single session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

type Ctx = { params: Promise<{ id: string; sessionId: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id, sessionId } = await ctx.params;

        const session = await prisma.userSession.findUnique({
            where:  { id: sessionId },
            select: { id: true, user_id: true, revoked_at: true },
        });
        if (!session || session.user_id !== id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (session.revoked_at !== null) {
            return NextResponse.json({ error: "Session is already revoked." }, { status: 422 });
        }

        await prisma.userSession.update({
            where: { id: sessionId },
            data:  { revoked_at: new Date() },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[DELETE admin/users/id/sessions/sessionId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
