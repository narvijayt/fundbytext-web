import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Verification status isn't part of the lightweight AuthUser — fetch it here.
    const extra = await prisma.user.findUnique({
        where: { id: user.id },
        select: { is_email_verified: true },
    });
    return NextResponse.json({ user: { ...user, is_email_verified: extra?.is_email_verified ?? false } });
}
