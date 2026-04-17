// PATCH /api/v1/admin/campaigns/:slug — admin override for visibility & donations

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { CampaignVisibility, MemberRole } from "@/generated/prisma/enums";
import {
    notifyAdminVisibilityChanged,
    notifyAdminDonationsPaused,
    notifyAdminDonationsResumed,
    broadcastAdminDonationsPaused,
    broadcastAdminDonationsResumed,
} from "@/lib/notifications";
import { publishControlsChanged } from "@/lib/ably";

type Ctx = { params: Promise<{ slug: string }> };

const patchSchema = z.object({
    visibility:                 z.nativeEnum(CampaignVisibility).optional(),
    donations_enabled:          z.boolean().optional(),
    donations_disabled_message: z.string().max(300).nullable().optional(),
}).strict().refine(
    (d) => d.visibility !== undefined || d.donations_enabled !== undefined || d.donations_disabled_message !== undefined,
    { message: "At least one field is required." },
);

export async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { slug } = await ctx.params;

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
        }

        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: {
                id:                          true,
                visibility:                  true,
                donations_enabled:           true,
                donations_disabled_message:  true,
                status:                      true,
                members: {
                    where:  { roles: { some: { role: MemberRole.participant } } },
                    select: { id: true },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { visibility, donations_enabled, donations_disabled_message } = parsed.data;
        const memberIds = campaign.members.map((m) => m.id);
        const updateData: Record<string, unknown> = {};
        const notifTasks: Promise<unknown>[] = [];

        // ── Visibility ────────────────────────────────────────────────────────
        if (visibility !== undefined && visibility !== campaign.visibility) {
            updateData.visibility = visibility;
            notifTasks.push(notifyAdminVisibilityChanged(campaign.id, visibility));
            publishControlsChanged(slug, { change: "visibility" }).catch(console.error);
        }

        // ── Donations enable / disable ────────────────────────────────────────
        if (donations_enabled !== undefined && donations_enabled !== campaign.donations_enabled) {
            updateData.donations_enabled = donations_enabled;
            notifTasks.push(
                donations_enabled
                    ? notifyAdminDonationsResumed(campaign.id)
                    : notifyAdminDonationsPaused(campaign.id),
            );
            if (memberIds.length > 0) {
                notifTasks.push(
                    donations_enabled
                        ? broadcastAdminDonationsResumed(campaign.id, memberIds)
                        : broadcastAdminDonationsPaused(campaign.id, memberIds),
                );
            }
            const newMessage =
                donations_disabled_message !== undefined
                    ? donations_disabled_message
                    : campaign.donations_disabled_message ?? null;
            publishControlsChanged(slug, {
                change:                     "donations",
                donations_enabled:          donations_enabled,
                donations_disabled_message: newMessage,
            }).catch(console.error);
        }

        // ── Disabled message only (no toggle) ────────────────────────────────
        if (donations_disabled_message !== undefined) {
            updateData.donations_disabled_message = donations_disabled_message;
            // If donations are already disabled, push an Ably update with the new message
            if (donations_enabled === undefined && !campaign.donations_enabled) {
                publishControlsChanged(slug, {
                    change:                     "donations",
                    donations_enabled:          false,
                    donations_disabled_message: donations_disabled_message,
                }).catch(console.error);
            }
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.campaign.update({ where: { id: campaign.id }, data: updateData });
        }

        if (notifTasks.length > 0) Promise.allSettled(notifTasks).catch(console.error);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[PATCH admin/campaigns/slug]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/v1/admin/campaigns/:slug — admin hard-delete of draft campaigns only
export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: { id: true, status: true },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (campaign.status !== "draft") {
            return NextResponse.json({ error: "Only draft campaigns can be deleted." }, { status: 422 });
        }

        await prisma.campaign.delete({ where: { id: campaign.id } });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[DELETE admin/campaigns/slug]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
