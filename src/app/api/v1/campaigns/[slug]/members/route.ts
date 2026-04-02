// POST /api/v1/campaigns/:slug/members
// Adds a participant to the campaign (organizer only).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

const schema = z.object({
    first_name:       z.string().min(1).max(100),
    last_name:        z.string().min(1).max(100),
    email:            z.string().email().max(255),
    phone:            z.string().max(20).optional().nullable(),
    can_upload_photo: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id: true,
                members: {
                    where: { user_id: user.id },
                    select: { id: true, roles: { select: { role: true } } },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const myMember = campaign.members[0];
        const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
        }

        const { first_name, last_name, email, phone, can_upload_photo } = parsed.data;

        // Check for duplicate email in this campaign
        const existing = await prisma.campaignMember.findUnique({
            where: { campaign_id_email: { campaign_id: campaign.id, email } },
            include: { roles: { select: { role: true } } },
        });

        if (existing) {
            // If the organizer is adding themselves, promote to participant role
            if (existing.user_id === user.id) {
                const alreadyParticipant = existing.roles.some((r) => r.role === MemberRole.participant);
                if (alreadyParticipant) {
                    return NextResponse.json(
                        { error: "You are already listed as a participant in this campaign." },
                        { status: 409 }
                    );
                }
                await prisma.campaignMemberRole.create({
                    data: { member_id: existing.id, role: MemberRole.participant },
                });
                const updated = await prisma.campaignMember.findUnique({
                    where: { id: existing.id },
                    include: { roles: { select: { role: true } } },
                });
                return NextResponse.json({ member: JSON.parse(JSON.stringify(updated)) }, { status: 201 });
            }
            return NextResponse.json(
                { error: "A participant with this email is already in the campaign." },
                { status: 409 }
            );
        }

        const inviteToken = crypto.randomBytes(32).toString("hex");

        const member = await prisma.campaignMember.create({
            data: {
                campaign_id:      campaign.id,
                first_name,
                last_name,
                email,
                phone:            phone ?? null,
                can_upload_photo: can_upload_photo ?? false,
                invite_token:     inviteToken,
                roles: {
                    create: { role: MemberRole.participant },
                },
            },
            include: { roles: { select: { role: true } } },
        });

        return NextResponse.json({ member: JSON.parse(JSON.stringify(member)) }, { status: 201 });
    } catch (err) {
        console.error("[POST campaigns/slug/members]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
