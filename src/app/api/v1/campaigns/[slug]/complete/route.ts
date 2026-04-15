// POST /api/v1/campaigns/:slug/complete
// Manually marks an active campaign as completed (organizer only).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole, CampaignStatus } from "@/generated/prisma/enums";
import { notifyCampaignEndedEarly, broadcastCampaignCompleted } from "@/lib/notifications";
import { publishStatusChange } from "@/lib/ably";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id:     true,
                status: true,
                members: {
                    select: {
                        id:      true,
                        user_id: true,
                        roles:   { select: { role: true } },
                    },
                },
            },
        });

        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const member      = campaign.members.find((m) => m.user_id === user.id);
        const isOrganizer = member?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (campaign.status !== CampaignStatus.active) {
            return NextResponse.json(
                { error: "Only active campaigns can be marked as complete." },
                { status: 422 }
            );
        }

        const updated = await prisma.campaign.update({
            where: { id: campaign.id },
            data:  { status: CampaignStatus.completed },
            select: { slug: true, status: true },
        });

        const participantIds = campaign.members
            .filter((m) => m.roles.some((r) => r.role === MemberRole.participant))
            .map((m) => m.id);

        Promise.all([
            notifyCampaignEndedEarly(campaign.id),
            broadcastCampaignCompleted(campaign.id, participantIds),
            publishStatusChange(slug, "completed"),
        ]).catch(console.error);

        return NextResponse.json({ campaign: updated });
    } catch (err) {
        console.error("[POST campaigns/slug/complete]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
