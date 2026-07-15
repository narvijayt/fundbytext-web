// GET /api/v1/campaigns/:slug/members/check-email?email=… — does a registered
// user account already exist for this email, and does it already have a profile
// photo? Used by the Add Participant modal to warn that a registered account's
// own photo is authoritative (an upload here won't be shown when they have one).
// Organizer of a LIVE campaign only — draft organizers are self-service (public
// /campaigns/init), which would turn this into a free account-enumeration oracle;
// the Add Participant modal only exists after launch.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

const emailSchema = z.string().email().max(255).transform((s) => s.toLowerCase().trim());

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: {
                id:      true,
                status:  true,
                members: { where: { user_id: user.id }, select: { roles: { select: { role: true } } } },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // A user can hold more than one member row per campaign (uniqueness is
        // campaign+email) — the organizer role may live on any of them.
        const isOrganizer = campaign.members.some((m) => m.roles.some((r) => r.role === MemberRole.organizer));
        if (!isOrganizer || campaign.status === "draft") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const parsed = emailSchema.safeParse(req.nextUrl.searchParams.get("email"));
        if (!parsed.success) return NextResponse.json({ registered: false, hasPhoto: false });

        // Deliberately the same lookup POST /members uses to link accounts (no
        // deleted_at filter), so the warning matches what submitting will do.
        const account = await prisma.user.findUnique({
            where:  { email: parsed.data },
            select: { profile_photo_url: true },
        });

        return NextResponse.json({ registered: !!account, hasPhoto: !!account?.profile_photo_url });
    } catch (err) {
        console.error("[GET campaigns/slug/members/check-email]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
