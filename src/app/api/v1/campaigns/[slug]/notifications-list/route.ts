// GET /api/v1/campaigns/[slug]/notifications-list?skip=0&take=10&type=campaign|participant
// Returns paginated notifications.
// type=campaign  → campaign-wide notifications (any member)
// type=participant → notifications for the calling user's membership

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { NotificationType } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
        const take = Math.min(50, Math.max(1, parseInt(searchParams.get("take") ?? "10", 10)));
        const type = searchParams.get("type") as "campaign" | "participant" | null;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id: true,
                members: {
                    where: { user_id: user.id },
                    select: { id: true },
                },
            },
        });

        if (!campaign || campaign.members.length === 0) {
            return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
        }

        const memberId = campaign.members[0].id;

        const where =
            type === "campaign"
                ? { campaign_id: campaign.id, notification_type: NotificationType.campaign }
                : type === "participant"
                ? {
                    campaign_id:       campaign.id,
                    notification_type: NotificationType.participant,
                    OR: [
                        { recipient_member_id: memberId },
                        { recipient_member_id: null as string | null },
                    ],
                  }
                : { campaign_id: campaign.id };

        const [notifications, total] = await Promise.all([
            prisma.campaignNotification.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take,
                select: {
                    id:                  true,
                    notification_type:   true,
                    trigger_event:       true,
                    message:             true,
                    helper_text:         true,
                    scheduled_at:        true,
                    sent_at:             true,
                    status:              true,
                    recipient_member_id: true,
                },
            }),
            prisma.campaignNotification.count({ where }),
        ]);

        return NextResponse.json({
            notifications: notifications.map((n) => ({
                id:                  n.id,
                notification_type:   n.notification_type,
                trigger_event:       n.trigger_event,
                message:             n.message,
                helper_text:         n.helper_text,
                scheduled_at:        n.scheduled_at?.getTime() ?? null,
                sent_at:             n.sent_at?.getTime() ?? null,
                status:              n.status,
                recipient_member_id: n.recipient_member_id,
            })),
            total,
        });
    } catch (err) {
        console.error("[GET notifications-list]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
