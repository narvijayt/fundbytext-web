// DELETE /api/v1/campaigns/:slug/members/:memberId
// Removes a participant from the campaign (organizer only).
// Cannot remove a member who holds the organizer role.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string; memberId: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug, memberId } = await ctx.params;

        // Resolve the campaign and verify the caller is an organizer
        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id: true,
                members: {
                    select: {
                        id: true,
                        user_id: true,
                        roles: { select: { role: true } },
                    },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const myMember = campaign.members.find((m) => m.user_id === user.id);
        const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const target = campaign.members.find((m) => m.id === memberId);
        if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

        const targetIsOrganizer = target.roles.some((r) => r.role === MemberRole.organizer);
        if (targetIsOrganizer) {
            return NextResponse.json(
                { error: "Cannot remove a campaign organizer." },
                { status: 422 }
            );
        }

        await prisma.campaignMember.delete({ where: { id: memberId } });

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("[DELETE campaigns/slug/members/memberId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
