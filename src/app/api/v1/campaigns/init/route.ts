// POST /api/v1/campaigns/init
// Public endpoint — accessible without a session.
// Handles Step 1 of the campaign creation wizard:
//   - If already logged in: create a draft campaign tied to the existing user.
//   - If email is new: create user account + draft campaign + log them in.
//   - If email exists but not logged in: return 409 so the UI can prompt login.
//
// On success the organizer is recorded in campaign_members + campaign_member_roles.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { UserRole, CampaignStatus, CampaignType, MemberRole } from "@/generated/prisma/enums";
import { signToken, setAuthCookie } from "@/lib/auth";
import { getAuthUserFromRequest } from "@/lib/session";
import { sendParticipantCredentialsEmail } from "@/lib/mail";

const schema = z.object({
    campaign_type: z.enum(["individual", "organization"]),
    name:          z.string().min(1).max(50).optional(),
    // first_name + last_name + email only required for guests
    first_name:    z.string().min(1).max(100).optional(),
    last_name:     z.string().min(1).max(100).optional(),
    email:         z.string().email().max(255).optional(),
});

function nameToSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
    const base = nameToSlug(name);
    let slug = base;
    let i = 2;
    while (await prisma.campaign.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
    }
    return slug;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
        }

        const { campaign_type, name, first_name, last_name, email } = parsed.data;
        const isMobile = req.headers.get("x-client-type") === "mobile";

        // ── 1. Resolve the user ──────────────────────────────────────────────

        let userId: string;
        let memberFirstName: string;
        let memberLastName: string;
        let memberEmail: string;
        let isNewUser = false;
        let generatedPassword: string | null = null;

        const sessionUser = await getAuthUserFromRequest(req);

        if (sessionUser) {
            // Already logged in — use their account
            userId = sessionUser.id;
            memberFirstName = sessionUser.first_name;
            memberLastName  = sessionUser.last_name;
            memberEmail     = sessionUser.email;
        } else {
            // Guest path — name + email are required
            if (!first_name || !last_name || !email) {
                return NextResponse.json(
                    { error: "first_name, last_name, and email are required." },
                    { status: 422 }
                );
            }

            const existing = await prisma.user.findUnique({ where: { email } });

            if (existing) {
                return NextResponse.json(
                    {
                        error: "An account with this email already exists. Please log in to continue.",
                        code: "account_exists",
                    },
                    { status: 409 }
                );
            }

            const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789!@#$%^&*";
            generatedPassword = Array.from(crypto.randomBytes(16)).map((b) => chars[(b as number) % chars.length]).join("");
            const password_hash = await bcrypt.hash(generatedPassword, 12);

            const newUser = await prisma.user.create({
                data: { first_name, last_name, email, password_hash, role: UserRole.user },
                select: { id: true },
            });

            userId = newUser.id;
            memberFirstName = first_name;
            memberLastName  = last_name;
            memberEmail     = email;
            isNewUser       = true;
        }

        // ── 2. Create the draft campaign ─────────────────────────────────────

        if (!name) {
            return NextResponse.json({ error: "Campaign name is required." }, { status: 422 });
        }
        const slug = await generateUniqueSlug(name);

        const campaign = await prisma.campaign.create({
            data: {
                campaign_type: campaign_type as CampaignType,
                slug,
                status: CampaignStatus.draft,
                name: name ?? null,
                members: {
                    create: {
                        user_id:    userId,
                        first_name: memberFirstName,
                        last_name:  memberLastName,
                        email:      memberEmail,
                        joined_at:  new Date(),
                        roles: {
                            create: { role: MemberRole.organizer },
                        },
                    },
                },
            },
            select: { id: true, slug: true },
        });

        // ── 3. Session + cookie for new users ────────────────────────────────

        if (!isNewUser) {
            return NextResponse.json(
                { campaign: { slug: campaign.slug }, is_new_user: false },
                { status: 201 }
            );
        }

        const sessionId       = crypto.randomUUID();
        const expiresIn       = isMobile ? undefined : "2h";
        const sessionExpiresAt = isMobile ? null : new Date(Date.now() + 2 * 60 * 60 * 1000);

        const token = await signToken({ sub: userId, role: "user", sessionId }, expiresIn);

        await prisma.userSession.create({
            data: {
                id:         sessionId,
                user_id:    userId,
                expires_at: sessionExpiresAt,
                is_mobile:  isMobile,
                ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
                user_agent: req.headers.get("user-agent"),
            },
        });

        // Send login credentials email
        try {
            const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
            await sendParticipantCredentialsEmail({
                to:        memberEmail,
                firstName: memberFirstName,
                password:  generatedPassword,
                loginUrl,
            });
        } catch {
            // Non-fatal — user is logged in; they can use "forgot password" later
        }

        if (isMobile) {
            return NextResponse.json(
                { campaign: { slug: campaign.slug }, is_new_user: true, token },
                { status: 201 }
            );
        }

        const res = NextResponse.json(
            { campaign: { slug: campaign.slug }, is_new_user: true },
            { status: 201 }
        );
        setAuthCookie(res, token, 2 * 60 * 60);
        return res;

    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return NextResponse.json(
                { error: "A campaign with this name already exists. Please choose a different name.", code: "name_taken" },
                { status: 409 }
            );
        }
        console.error("[campaigns/init] FULL ERROR:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
