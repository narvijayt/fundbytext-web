// GET  /api/v1/campaigns/:slug  — fetch campaign (organizer only)
// PATCH /api/v1/campaigns/:slug  — partial-update campaign (organizer only)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";
import {
    notifyCampaignExtended,
    broadcastCampaignExtended,
    broadcastStartDateChanged,
    notifyCampaignReactivated,
    broadcastCampaignReactivated,
    notifyDonationsPaused,
    notifyDonationsResumed,
    broadcastDonationsPaused,
    broadcastDonationsResumed,
    notifyStartDateChanged,
} from "@/lib/notifications";
import { publishControlsChanged, publishStatusChange } from "@/lib/ably";
import {
    MemberRole,
    GoalType,
    BackgroundTheme,
    MediaType,
    CampaignStatus,
    CampaignVisibility,
} from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ slug: string }> };

async function resolveOrganizerMemberId(
    slug: string,
    userId: string
): Promise<{ campaignId: string; memberId: string } | null> {
    const campaign = await prisma.campaign.findUnique({
        where: { slug },
        select: {
            id: true,
            members: {
                where: { user_id: userId },
                select: {
                    id: true,
                    roles: { select: { role: true } },
                },
            },
        },
    });
    if (!campaign) return null;
    const member = campaign.members[0];
    if (!member) return null;
    const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);
    if (!isOrganizer) return null;
    return { campaignId: campaign.id, memberId: member.id };
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const ids = await resolveOrganizerMemberId(slug, user.id);
        if (!ids) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            include: {
                media: { orderBy: { sort_order: "asc" } },
                payout: true,
                members: {
                    include: { roles: { select: { role: true } } },
                    orderBy: { created_at: "asc" },
                },
            },
        });

        return NextResponse.json({ campaign: JSON.parse(JSON.stringify(campaign)) });
    } catch (err) {
        console.error("[GET campaigns/slug]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

// Partial payout — all fields optional so draft saves work with incomplete data.
// Full validation is enforced on the frontend before advancing to the next step.
const payoutSchema = z.object({
    recipient_first_name: z.string().max(100).nullable().optional(),
    recipient_last_name:  z.string().max(100).nullable().optional(),
    org_name:             z.string().max(100).nullable().optional(),
    street_address:       z.string().max(255).nullable().optional(),
    apt_suite:            z.string().max(50).nullable().optional(),
    city:                 z.string().max(100).nullable().optional(),
    state:                z.string().max(50).nullable().optional(),
    zip:                  z.string().max(10).nullable().optional(),
});

const mediaItemSchema = z.object({
    media_type:  z.enum(["profile", "hero", "gallery"]),
    url:         z.string().min(1),
    sort_order:  z.number().int().default(0),
});

const patchSchema = z.object({
    // Step 2 — Details
    campaign_type:    z.enum(["individual", "organization"]).optional(),
    name:             z.string().max(50).optional().nullable(),
    org_display_name: z.string().max(100).optional().nullable(),
    story:            z.string().optional().nullable(),
    timezone:         z.string().max(50).optional(),
    start_date:       z.string().optional().nullable(),
    end_date:         z.string().optional().nullable(),

    // Step 3 — Funding Goal
    goal_type:             z.nativeEnum(GoalType).optional().nullable(),
    goal_amount:           z.number().positive().optional().nullable(),
    donors_per_participant: z.number().int().positive().optional().nullable(),
    payout:                payoutSchema.optional(),

    // Step 4 — Visual
    background_theme: z.nativeEnum(BackgroundTheme).optional(),
    accent_color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
    secondary_color:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
    tertiary_color:   z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
    media:            z.array(mediaItemSchema).optional(),

    // Step 6 — Thank You
    thank_you_message: z.string().max(940).optional().nullable(),

    // Wizard resume
    current_step: z.number().int().min(1).max(5).optional(),

    // Campaign controls
    visibility:                  z.nativeEnum(CampaignVisibility).optional(),
    donations_enabled:           z.boolean().optional(),
    donations_disabled_message:  z.string().max(300).nullable().optional(),
}).strict();

export async function PATCH(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const ids = await resolveOrganizerMemberId(slug, user.id);
        if (!ids) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
        }

        const { payout, media, ...campaignFields } = parsed.data;

        // Normalise date strings → Date objects (or null)
        const data: Record<string, unknown> = { ...campaignFields };
        if ("start_date" in data) {
            data.start_date = data.start_date ? new Date(data.start_date as string) : null;
        }
        if ("end_date" in data) {
            data.end_date = data.end_date ? new Date(data.end_date as string) : null;
        }

        // One consolidated read — used for all transition/notification logic below.
        const current = await prisma.campaign.findUnique({
            where:  { id: ids.campaignId },
            select: {
                status:            true,
                start_date:        true,
                end_date:          true,
                campaign_type:     true,
                timezone:          true,
                donations_enabled:           true,
                donations_disabled_message:  true,
                visibility:                  true,
                initial_goal_amount:         true,
                goal_type:         true,
                members: {
                    where:  { roles: { some: { role: "participant" } } },
                    select: { id: true },
                },
            },
        });

        const now        = new Date();
        const memberIds  = current?.members.map((m) => m.id) ?? [];
        const notifTasks: Promise<unknown>[] = [];

        // ── Start date change: future start on active campaign → revert to upcoming.
        //    Also notify when start date actually changes on a live campaign.
        if ("start_date" in data && data.start_date instanceof Date && data.start_date > now) {
            if (current?.status === CampaignStatus.active) {
                data.status = CampaignStatus.upcoming;
            }
            const startDateChanged = !current?.start_date ||
                current.start_date.getTime() !== (data.start_date as Date).getTime();
            if (startDateChanged && (current?.status === CampaignStatus.active || current?.status === CampaignStatus.upcoming)) {
                const tz = (data.timezone as string | undefined) ?? current?.timezone ?? "America/New_York";
                notifTasks.push(notifyStartDateChanged(ids.campaignId, data.start_date, tz));
                if (memberIds.length > 0) {
                    notifTasks.push(broadcastStartDateChanged(ids.campaignId, memberIds, data.start_date, tz));
                }
            }
        }

        // ── End date change on completed → reactivate.
        //    End date pushed forward on active/upcoming → extension notification.
        if ("end_date" in data && data.end_date instanceof Date && data.end_date > now) {
            if (current?.status === CampaignStatus.completed) {
                const newStatus = current.start_date && current.start_date > now
                    ? CampaignStatus.upcoming
                    : CampaignStatus.active;
                data.status = newStatus;
                // Clear deduplication records so completion notifications fire fresh if ended again
                notifTasks.push(
                    prisma.campaignNotification.deleteMany({
                        where: {
                            campaign_id:   ids.campaignId,
                            trigger_event: { in: ["campaign_completed_broadcast", "campaign_completed"] },
                        },
                    })
                );
                notifTasks.push(notifyCampaignReactivated(ids.campaignId));
                if (memberIds.length > 0) {
                    notifTasks.push(broadcastCampaignReactivated(ids.campaignId, memberIds));
                }
                publishStatusChange(slug, newStatus).catch(console.error);
            }
            const isExtension =
                (current?.status === CampaignStatus.active || current?.status === CampaignStatus.upcoming) &&
                (!current.end_date || data.end_date > current.end_date);
            if (isExtension) {
                const tz = (data.timezone as string | undefined) ?? current?.timezone ?? "America/New_York";
                notifTasks.push(notifyCampaignExtended(ids.campaignId, data.end_date, tz));
                if (memberIds.length > 0) {
                    notifTasks.push(broadcastCampaignExtended(ids.campaignId, memberIds, data.end_date, tz));
                }
            }
        }

        // ── Donations paused / resumed.
        if ("donations_enabled" in data && typeof data.donations_enabled === "boolean" &&
            current?.donations_enabled !== data.donations_enabled) {
            notifTasks.push(
                data.donations_enabled
                    ? notifyDonationsResumed(ids.campaignId)
                    : notifyDonationsPaused(ids.campaignId),
                ...(memberIds.length > 0
                    ? [data.donations_enabled
                        ? broadcastDonationsResumed(ids.campaignId, memberIds)
                        : broadcastDonationsPaused(ids.campaignId, memberIds)]
                    : [])
            );
        }

        if (notifTasks.length > 0) Promise.allSettled(notifTasks).catch(console.error);

        // ── Publish controls_changed with typed payloads so the marketing page can
        //    decide whether to update client-side state or do a full refresh.
        const visibilityChanged =
            "visibility" in data && data.visibility !== current?.visibility;
        const donationsEnabledChanged =
            "donations_enabled" in data &&
            typeof data.donations_enabled === "boolean" &&
            current?.donations_enabled !== data.donations_enabled;

        const startDateChanged =
            "start_date" in data &&
            data.start_date instanceof Date &&
            (!current?.start_date || current.start_date.getTime() !== data.start_date.getTime());
        const endDateChanged =
            "end_date" in data &&
            (data.end_date instanceof Date || data.end_date === null) &&
            (current?.end_date?.getTime() ?? null) !== (data.end_date instanceof Date ? data.end_date.getTime() : null);

        if (visibilityChanged) {
            // Client will refresh with jitter — no data needed in payload
            publishControlsChanged(slug, { change: "visibility" }).catch(console.error);
        }
        if (startDateChanged || endDateChanged) {
            publishControlsChanged(slug, { change: "settings" }).catch(console.error);
        }
        if (donationsEnabledChanged) {
            // Carry the new values so the client updates state without a server round-trip
            const newEnabled = data.donations_enabled as boolean;
            const newMessage = (
                "donations_disabled_message" in data && data.donations_disabled_message !== undefined
                    ? data.donations_disabled_message as string | null
                    : current?.donations_disabled_message ?? null
            );
            publishControlsChanged(slug, {
                change:                      "donations",
                donations_enabled:           newEnabled,
                donations_disabled_message:  newMessage,
            }).catch(console.error);
        }

        // ── Auto-set initial_goal_amount the first time goal_amount is saved
        //    (only for open_ended campaigns; never overwritten after first set)
        if ("goal_amount" in data && data.goal_amount != null) {
            const effectiveGoalType = (data.goal_type as string | undefined) ?? current?.goal_type;
            if (effectiveGoalType === "open_ended" && !current?.initial_goal_amount) {
                data.initial_goal_amount = data.goal_amount;
            }
        }

        // Update campaign fields
        if (Object.keys(data).length > 0) {
            await prisma.campaign.update({ where: { id: ids.campaignId }, data });
        }

        // Upsert payout — required DB columns use "" when cleared (not null)
        if (payout) {
            const safeUpdate = {
                recipient_first_name: payout.recipient_first_name ?? "",
                recipient_last_name:  payout.recipient_last_name  ?? "",
                street_address:       payout.street_address        ?? "",
                city:                 payout.city                  ?? "",
                state:                payout.state                 ?? "",
                zip:                  payout.zip                   ?? "",
                org_name:             payout.org_name  ?? null,
                apt_suite:            payout.apt_suite ?? null,
            };
            await prisma.campaignPayout.upsert({
                where:  { campaign_id: ids.campaignId },
                update: safeUpdate,
                create: { campaign_id: ids.campaignId, ...safeUpdate },
            });
        }

        // Replace media. The wizard always sends the COMPLETE intended media
        // set (profile + hero + every gallery photo), so we replace the whole
        // set rather than per-type — otherwise removing the last photo of a
        // type (e.g. all gallery photos) leaves no item to trigger its delete
        // and the records linger in the DB.
        if (media) {
            const existing = await prisma.campaignMedia.findMany({
                where: { campaign_id: ids.campaignId },
                select: { url: true },
            });
            // Replace the whole set. An EMPTY array is valid and means "remove all
            // media" (e.g. the user deleted the only photo / logo): clear the rows
            // and skip the insert, so nothing lingers pointing at a blob we're
            // about to delete just below.
            await prisma.$transaction([
                prisma.campaignMedia.deleteMany({ where: { campaign_id: ids.campaignId } }),
                ...(media.length > 0
                    ? [prisma.campaignMedia.createMany({
                        data: media.map((m) => ({
                            campaign_id: ids.campaignId,
                            media_type:  m.media_type as MediaType,
                            url:         m.url,
                            sort_order:  m.sort_order,
                        })),
                    })]
                    : []),
            ]);

            // Best-effort: delete blobs that are no longer referenced so removed
            // photos don't linger in storage. Failures here must not fail the save.
            const keptUrls = new Set(media.map((m) => m.url));
            const orphanedUrls = existing.map((m) => m.url).filter((u) => u && !keptUrls.has(u));
            if (orphanedUrls.length > 0) {
                await Promise.allSettled(orphanedUrls.map((u) => del(u))).catch(() => {});
            }
        }

        const updated = await prisma.campaign.findUnique({
            where: { id: ids.campaignId },
            include: {
                media: { orderBy: { sort_order: "asc" } },
                payout: true,
            },
        });

        return NextResponse.json({ campaign: JSON.parse(JSON.stringify(updated)) });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return NextResponse.json(
                { error: "A campaign with this name already exists. Please choose a different name.", code: "name_taken" },
                { status: 409 }
            );
        }
        console.error("[PATCH campaigns/slug]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// Only draft and upcoming campaigns may be deleted.

export async function DELETE(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const ids = await resolveOrganizerMemberId(slug, user.id);
        if (!ids) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

        const campaign = await prisma.campaign.findUnique({
            where: { id: ids.campaignId },
            select: { status: true, organization_id: true },
        });

        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (campaign.status !== CampaignStatus.draft && campaign.status !== CampaignStatus.upcoming) {
            return NextResponse.json(
                { error: "Only draft or upcoming campaigns can be deleted." },
                { status: 403 }
            );
        }

        if (campaign.status === CampaignStatus.upcoming) {
            const donationCount = await prisma.donation.count({
                where: { campaign_id: ids.campaignId, payment_status: "completed" },
            });
            if (donationCount > 0) {
                return NextResponse.json(
                    { error: "This campaign has already received donations and cannot be deleted." },
                    { status: 403 }
                );
            }
        }

        await prisma.campaign.delete({ where: { id: ids.campaignId } });

        // ── Clean up Organization if this was its only campaign ───────────────
        if (campaign.organization_id) {
            const remaining = await prisma.campaign.count({
                where: { organization_id: campaign.organization_id },
            });
            if (remaining === 0) {
                await prisma.organization.delete({
                    where: { id: campaign.organization_id },
                }).catch(console.error); // non-fatal — FK may already be null
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[DELETE campaigns/slug]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
