// PATCH  /api/v1/admin/users/:id — suspend / unsuspend a user (admin only)
// PATCH  with { action:"edit" }  — edit user profile (admin only)
// DELETE /api/v1/admin/users/:id — soft-delete a user (admin only)
// PATCH with { restore: true }   — restore a soft-deleted user

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";

const editSchema = z.object({
    action:     z.literal("edit"),
    first_name: z.string().min(1).max(100),
    last_name:  z.string().min(1).max(100),
    email:      z.string().email().max(255).transform(s => s.toLowerCase().trim()),
    username:   z.string().min(1).max(30).regex(/^[a-z0-9_.]+$/, "Username may only contain lowercase letters, numbers, dots, and underscores.").optional().nullable(),
    phone:      z.string().max(20).optional().nullable(),
    role:       z.enum(["user", "admin"]),
    password:   z.string().min(8).max(100).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;
        const body = await req.json().catch(() => null);

        // ── Edit user profile ────────────────────────────────────────────────
        if (body?.action === "edit") {
            const parsed = editSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
            }

            const { first_name, last_name, email, username, phone, role, password } = parsed.data;

            const target = await prisma.user.findUnique({
                where:  { id },
                select: { id: true, role: true, deleted_at: true },
            });
            if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
            if (target.deleted_at !== null) {
                return NextResponse.json({ error: "Cannot edit a deleted user." }, { status: 422 });
            }

            // Admins can only edit their own account, not other admins
            if (target.role === "admin" && target.id !== admin.id) {
                return NextResponse.json({ error: "You cannot edit another admin's account." }, { status: 403 });
            }

            // Admin accounts: only first_name / last_name may be changed
            if (target.role === "admin" && role !== "admin") {
                return NextResponse.json({ error: "Cannot change the role of an admin account." }, { status: 403 });
            }

            let updateData: Record<string, unknown>;

            if (target.role === "admin") {
                if (target.id === admin.id) {
                    // Self-edit: allow name, email, phone, password — role stays locked
                    const conflict = await prisma.user.findFirst({
                        where: { email, id: { not: id } },
                        select: { id: true },
                    });
                    if (conflict) {
                        return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
                    }
                    updateData = { first_name, last_name, email, phone: phone ?? null };
                    if (password) {
                        updateData.password_hash = await bcrypt.hash(password, 12);
                    }
                } else {
                    // Editing another admin — blocked earlier, but be safe
                    return NextResponse.json({ error: "You cannot edit another admin's account." }, { status: 403 });
                }
            } else {
                // Check email uniqueness (exclude this user)
                const conflict = await prisma.user.findFirst({
                    where: { email, id: { not: id } },
                    select: { id: true },
                });
                if (conflict) {
                    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
                }

                // Check username uniqueness if provided
                if (username) {
                    const uConflict = await prisma.user.findFirst({
                        where: { username, id: { not: id } },
                        select: { id: true },
                    });
                    if (uConflict) {
                        return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
                    }
                }

                updateData = { first_name, last_name, email, phone: phone ?? null, role, username: username ?? undefined };
                if (password) {
                    updateData.password_hash = await bcrypt.hash(password, 12);
                }
            }

            const updated = await prisma.user.update({
                where:  { id },
                data:   updateData,
                select: { id: true, first_name: true, last_name: true, email: true, role: true },
            });

            return NextResponse.json({ user: updated });
        }

        // Restore a soft-deleted user
        if (body?.restore === true) {
            const target = await prisma.user.findUnique({
                where:  { id },
                select: { role: true, deleted_at: true, deleted_email: true },
            });
            if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
            if (target.deleted_at === null) return NextResponse.json({ error: "User is not deleted." }, { status: 422 });

            // Restore original email if it was saved and not already taken
            const restoreData: Record<string, unknown> = { deleted_at: null };
            if (target.deleted_email) {
                const conflict = await prisma.user.findUnique({ where: { email: target.deleted_email } });
                if (!conflict) {
                    restoreData.email         = target.deleted_email;
                    restoreData.deleted_email = null;
                }
                // If the email is now taken by someone else, leave the mangled email in place
            }

            await prisma.user.update({ where: { id }, data: restoreData });
            return NextResponse.json({ ok: true });
        }

        if (typeof body?.is_suspended !== "boolean") {
            return NextResponse.json({ error: "is_suspended (boolean) required" }, { status: 422 });
        }
        if ("suspension_message" in body && body.suspension_message !== null && typeof body.suspension_message !== "string") {
            return NextResponse.json({ error: "suspension_message must be a string or null" }, { status: 422 });
        }

        // Prevent suspending another admin
        const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (target.role === "admin") {
            return NextResponse.json({ error: "Cannot suspend an admin account." }, { status: 422 });
        }

        const updated = await prisma.user.update({
            where: { id },
            data:  {
                is_suspended:       body.is_suspended,
                suspension_message: "suspension_message" in body ? (body.suspension_message ?? null) : undefined,
            },
            select: { id: true, is_suspended: true },
        });

        // Revoke all active sessions if suspending
        if (body.is_suspended) {
            await prisma.userSession.updateMany({
                where: { user_id: id, revoked_at: null },
                data:  { revoked_at: new Date() },
            });
        }

        return NextResponse.json({ user: updated });
    } catch (err) {
        console.error("[PATCH admin/users/id]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE — soft-delete
export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await ctx.params;

        const target = await prisma.user.findUnique({
            where:  { id },
            select: { role: true, deleted_at: true, email: true },
        });
        if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (target.role === "admin") {
            return NextResponse.json({ error: "Cannot delete an admin account." }, { status: 422 });
        }
        if (target.deleted_at !== null) {
            return NextResponse.json({ error: "User is already deleted." }, { status: 422 });
        }

        // Mangle the email to free up the unique constraint so a new account
        // can be created with the same email. Original is saved in deleted_email.
        const mangledEmail = `deleted_${id}@deleted.local`;

        await prisma.user.update({
            where: { id },
            data:  {
                deleted_at:    new Date(),
                deleted_email: target.email,
                email:         mangledEmail,
            },
        });

        // Revoke all active sessions immediately
        await prisma.userSession.updateMany({
            where: { user_id: id, revoked_at: null },
            data:  { revoked_at: new Date() },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[DELETE admin/users/id]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
