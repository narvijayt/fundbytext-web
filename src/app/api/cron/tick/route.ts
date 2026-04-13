// GET /api/cron/tick
// Called by an external cron scheduler every minute.
// Transitions campaign statuses based on dates:
//   upcoming → active   when start_date <= now
//   active   → completed when end_date   <= now
//
// Protected by CRON_SECRET env var.
// Set Authorization: Bearer <CRON_SECRET> in your cron service.
// Vercel Cron: add to vercel.json and Vercel injects the header automatically.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, MemberRole } from "@/generated/prisma/enums";
import {
    notifyCampaignActive,
    notifyCampaignCompleted,
    broadcastCampaignCompleted,
} from "@/lib/notifications";
import { publishStatusChange } from "@/lib/ably";

export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = req.headers.get("authorization");
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const now = new Date();

    // ── Find campaigns to activate ────────────────────────────────────────────
    const toActivate = await prisma.campaign.findMany({
        where: {
            status: CampaignStatus.upcoming,
            OR: [
                { start_date: { lte: now } },
                { start_date: null },
            ],
        },
        select: { id: true, slug: true },
    });

    // ── Find campaigns to complete ────────────────────────────────────────────
    const toComplete = await prisma.campaign.findMany({
        where: {
            status:   CampaignStatus.active,
            end_date: { lte: now },
        },
        select: {
            id:   true,
            slug: true,
            members: {
                where:  { roles: { some: { role: MemberRole.participant } } },
                select: { id: true },
            },
        },
    });

    // ── Batch-update statuses ─────────────────────────────────────────────────
    const activateIds  = toActivate.map((c) => c.id);
    const completeIds  = toComplete.map((c) => c.id);

    const [activated, completed] = await Promise.all([
        activateIds.length > 0
            ? prisma.campaign.updateMany({
                where: { id: { in: activateIds } },
                data:  { status: CampaignStatus.active },
              })
            : { count: 0 },
        completeIds.length > 0
            ? prisma.campaign.updateMany({
                where: { id: { in: completeIds } },
                data:  { status: CampaignStatus.completed },
              })
            : { count: 0 },
    ]);

    // ── Fire notifications + Ably status events (non-fatal) ──────────────────
    const notifTasks: Promise<unknown>[] = [
        ...toActivate.map((c) => notifyCampaignActive(c.id).catch(console.error)),
        ...toActivate.map((c) => publishStatusChange(c.slug, "active")),
        ...toComplete.flatMap((c) => [
            notifyCampaignCompleted(c.id).catch(console.error),
            broadcastCampaignCompleted(c.id, c.members.map((m) => m.id)).catch(console.error),
            publishStatusChange(c.slug, "completed"),
        ]),
    ];
    await Promise.allSettled(notifTasks);

    return NextResponse.json({
        ok:        true,
        activated: activated.count,
        completed: completed.count,
    });
}
