// PATCH /api/v1/user/password — change password for authenticated user

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

const schema = z.object({
    current_password: z.string().min(1),
    new_password:     z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1),
}).refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
});

export async function PATCH(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
    }

    const { current_password, new_password } = parsed.data;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password_hash: true },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(current_password, dbUser.password_hash);
    if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({
        where: { id: user.id },
        data: { password_hash },
    });

    return NextResponse.json({ message: "Password updated successfully" });
}
