// DELETE /api/v1/campaigns/:slug/donors/:donorId — remove a donor contact (organizer only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string; donorId: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug, donorId } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id: true,
                members: {
                    where: { user_id: user.id },
                    select: { roles: { select: { role: true } } },
                },
            },
        });

        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const member = campaign.members[0];
        const isOrganizer = member?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.campaignDonor.delete({
            where: { id: donorId, campaign_id: campaign.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("[DELETE donors/donorId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
