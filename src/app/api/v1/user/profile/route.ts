import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

const schema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.email().max(255).transform(s => s.toLowerCase().trim()).optional(),
    phone: z.string().max(20).nullable().optional(),
    profile_photo_url: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
    }

    // If email is being changed: ensure it's not taken, and reset verification —
    // the new address is unverified until re-confirmed, and any pending token is void.
    const emailChanged = !!parsed.data.email && parsed.data.email !== user.email;
    if (emailChanged) {
        const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            ...parsed.data,
            ...(emailChanged ? { is_email_verified: false, email_verification_token: null, email_verification_expires: null } : {}),
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
            role: true,
        },
    });

    return NextResponse.json({ user: updated });
}
