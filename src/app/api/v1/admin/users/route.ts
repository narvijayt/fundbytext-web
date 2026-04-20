// POST /api/v1/admin/users — create a new user (admin only)

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { sendParticipantCredentialsEmail } from "@/lib/mail";
import { generateUsername } from "@/lib/username";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const PASS_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*";

function generatePassword(): string {
    const bytes = crypto.randomBytes(16);
    return Array.from(bytes).map((b) => PASS_CHARS[b % PASS_CHARS.length]).join("");
}

const schema = z.object({
    first_name: z.string().min(1).max(100),
    last_name:  z.string().min(1).max(100),
    email:      z.string().email().max(255).transform(s => s.toLowerCase().trim()),
    phone:      z.string().max(20).optional().nullable(),
    password:   z.string().min(8).max(100).optional().nullable(),
    role:       z.enum(["user", "admin"]).default("user"),
});

export async function POST(req: NextRequest) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
        }

        const { first_name, last_name, email, phone, role } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
        }

        const plainPassword  = parsed.data.password || generatePassword();
        const password_hash  = await bcrypt.hash(plainPassword, 12);
        const username       = await generateUsername(first_name, last_name);

        const user = await prisma.user.create({
            data: {
                first_name,
                last_name,
                email,
                username,
                phone:             phone ?? null,
                password_hash,
                role,
                is_email_verified: true,
            },
            select: { id: true, first_name: true, last_name: true, email: true, role: true },
        });

        // Send login credentials to the newly created user
        sendParticipantCredentialsEmail({
            to:       email,
            firstName: first_name,
            password:  plainPassword,
            loginUrl:  `${APP_URL}/login`,
        }).catch((err) => console.error("[admin/users] failed to send credentials email:", err));

        return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
        console.error("[POST admin/users]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
