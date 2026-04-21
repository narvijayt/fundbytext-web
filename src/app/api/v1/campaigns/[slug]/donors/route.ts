// GET  /api/v1/campaigns/:slug/donors — list donors (role-based)
// POST /api/v1/campaigns/:slug/donors — add a donor contact (organizer OR participant)

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole, DonorStatus, PaymentStatus } from "@/generated/prisma/enums";
import { sendDonorInviteEmail } from "@/lib/mail";

type Ctx = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function generateShortCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
        const code = randomBytes(4).toString("hex"); // 8 hex chars
        const existing = await prisma.campaignDonor.findUnique({ where: { short_code: code }, select: { id: true } });
        if (!existing) return code;
    }
    // Fallback: use first 8 chars of a UUID-style random
    return randomBytes(8).toString("hex").slice(0, 8);
}

const postSchema = z.object({
    first_name:         z.string().min(1).max(100),
    last_name:          z.string().min(1).max(100),
    email:              z.string().email().max(255).transform(s => s.toLowerCase().trim()).optional().or(z.literal("")).optional(),
    phone:              z.string().max(20).optional().or(z.literal("")).optional(),
    assigned_member_id: z.string().uuid().optional().nullable(), // organizer can assign
    participant_view:   z.boolean().optional(),                  // true = added while in participant view
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const skip            = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
        const take            = Math.min(100, Math.max(1, parseInt(searchParams.get("take") ?? "5", 10)));
        const search          = searchParams.get("search")?.trim() ?? "";
        const status          = searchParams.get("status") ?? "all";
        const memberFilter    = searchParams.get("member_id") ?? "all";   // UUID | "unassigned" | "all"
        const sourceFilter    = searchParams.get("source")    ?? "all";   // DonorSource | "all"
        const emailValid      = searchParams.get("email_valid") ?? "all"; // "valid" | "invalid" | "all"
        const sort            = searchParams.get("sort") ?? "date_desc";  // date_desc|date_asc|amount_desc|name_asc
        const participantView = searchParams.get("participant_view") === "1";

        const campaign = await prisma.campaign.findUnique({
            where:  { slug },
            select: {
                id:      true,
                members: {
                    where:  { user_id: user.id },
                    select: { id: true, roles: { select: { role: true } } },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const member = campaign.members[0];
        if (!member)  return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const isOrganizer   = member.roles.some((r) => r.role === MemberRole.organizer);
        const isParticipant = member.roles.some((r) => r.role === MemberRole.participant);
        // Force participant-scoped results when the client explicitly requests it
        // (e.g. an organizer who also has the participant role viewing their own donor list)
        const scopeToMember = !isOrganizer || (participantView && isParticipant);

        const where = {
            campaign_id: campaign.id,
            ...(scopeToMember
                ? { assigned_member_id: member.id }
                : memberFilter === "unassigned"
                ? { assigned_member_id: null }
                : memberFilter !== "all"
                ? { assigned_member_id: memberFilter }
                : {}),
            ...(status !== "all" ? { status: status as DonorStatus } : {}),
            ...(sourceFilter !== "all" ? { source: sourceFilter as "invited" | "self_added" | "walk_in" | "link_self" } : {}),
            ...(emailValid === "valid"   ? { email_valid: true,  email: { not: null } } : {}),
            ...(emailValid === "invalid" ? { email_valid: false } : {}),
            ...(search ? {
                OR: [
                    { first_name: { contains: search, mode: "insensitive" as const } },
                    { last_name:  { contains: search, mode: "insensitive" as const } },
                    { email:      { contains: search, mode: "insensitive" as const } },
                    { phone:      { contains: search, mode: "insensitive" as const } },
                ],
            } : {}),
        };

        const orderBy =
            sort === "date_asc"    ? { created_at: "asc"  as const } :
            sort === "name_asc"    ? [{ first_name: "asc" as const }, { last_name: "asc" as const }] :
            /* date_desc default */  { created_at: "desc" as const };

        const [donors, total] = await Promise.all([
            prisma.campaignDonor.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id:           true,
                    first_name:   true,
                    last_name:    true,
                    email:        true,
                    phone:        true,
                    status:       true,
                    source:       true,
                    email_valid:  true,
                    invite_token: true,
                    short_code:   true,
                    created_at:   true,
                    assigned_member: {
                        select: { id: true, first_name: true, last_name: true, invite_token: true },
                    },
                    added_by_member: {
                        select: { id: true, first_name: true, last_name: true, roles: { select: { role: true } } },
                    },
                    donations: {
                        where:   { payment_status: PaymentStatus.completed },
                        select:  { amount: true, created_at: true, is_anonymous: true },
                        orderBy: { created_at: "desc" },
                    },
                },
            }),
            prisma.campaignDonor.count({ where }),
        ]);

        let mapped = donors.map((d) => ({
            ...d,
            created_at: d.created_at.getTime(),
            donations:  d.donations.map((don) => ({
                amount:       parseFloat(don.amount.toString()),
                donated_at:   don.created_at.getTime(),
                is_anonymous: don.is_anonymous,
            })),
        }));

        if (sort === "amount_desc") {
            mapped.sort((a, b) => {
                const ta = a.donations.reduce((s, d) => s + d.amount, 0);
                const tb = b.donations.reduce((s, d) => s + d.amount, 0);
                return tb - ta;
            });
        }

        // Top donor is campaign-wide (scope-respecting) — ignore search/status filters
        const scopeWhere = { campaign_id: campaign.id, ...(scopeToMember ? { assigned_member_id: member.id } : {}) };
        const allDonorTotals = await prisma.campaignDonor.findMany({
            where:  { ...scopeWhere, status: DonorStatus.donated },
            select: { id: true, donations: { where: { payment_status: PaymentStatus.completed }, select: { amount: true } } },
        });
        const topDonorId = allDonorTotals.reduce<{ id: string; total: number } | null>((top, d) => {
            const total = d.donations.reduce((s, don) => s + parseFloat(don.amount.toString()), 0);
            return total > 0 && (!top || total > top.total) ? { id: d.id, total } : top;
        }, null)?.id ?? null;

        return NextResponse.json({ donors: mapped, total, topDonorId });
    } catch (err) {
        console.error("[GET donors]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;

        const campaign = await prisma.campaign.findUnique({
            where: { slug },
            select: {
                id:       true,
                name:     true,
                status:   true,
                story:    true,
                goal_amount: true,
                end_date: true,
                timezone: true,
                members: {
                    where:  { user_id: user.id },
                    select: {
                        id:           true,
                        first_name:   true,
                        last_name:    true,
                        invite_token: true,
                        roles:        { select: { role: true } },
                    },
                },
            },
        });
        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const member = campaign.members[0];
        if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const isOrganizer  = member.roles.some((r) => r.role === MemberRole.organizer);
        const isParticipant = member.roles.some((r) => r.role === MemberRole.participant);

        // Must be organizer or participant
        if (!isOrganizer && !isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Completed campaigns are locked — no new donors
        if (campaign.status === "completed") {
            return NextResponse.json({ error: "Donors cannot be added to a completed campaign." }, { status: 422 });
        }

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = postSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data" }, { status: 422 });
        }

        const { first_name, last_name, email, phone, assigned_member_id, participant_view } = parsed.data;

        // Validate that assigned_member_id (if provided) belongs to this campaign
        if (isOrganizer && assigned_member_id) {
            const assignedMember = await prisma.campaignMember.findUnique({
                where: { id: assigned_member_id },
                select: { campaign_id: true },
            });
            if (!assignedMember || assignedMember.campaign_id !== campaign.id) {
                return NextResponse.json({ error: "Invalid participant assignment." }, { status: 422 });
            }
        }

        // Determine assignment:
        // - Participant → always assigned to themselves
        // - Organizer → can specify assigned_member_id; if unspecified, leave null (general pool)
        const resolvedMemberId = isOrganizer
            ? (assigned_member_id ?? null)
            : member.id;

        const donorInviteToken = randomBytes(32).toString("hex");
        const shortCode = await generateShortCode();

        const donor = await prisma.campaignDonor.create({
            data: {
                campaign_id:        campaign.id,
                assigned_member_id: resolvedMemberId,
                added_by_member_id: member.id,
                first_name,
                last_name,
                email:        email || null,
                phone:        phone || null,
                invite_token: donorInviteToken,
                short_code:   shortCode,
                source:       participant_view ? "self_added" : "invited",
            },
        });

        // Send invite email only when campaign is live (not during creation/draft)
        if (email && campaign.status !== "draft") {
            const senderName = `${member.first_name} ${member.last_name}`;
            // Look up the assigned participant's invite_token (may differ from caller)
            let assignedInviteToken: string | null = null;
            if (resolvedMemberId) {
                const assignedMember = await prisma.campaignMember.findUnique({
                    where:  { id: resolvedMemberId },
                    select: { invite_token: true },
                });
                assignedInviteToken = assignedMember?.invite_token ?? null;
            }
            // ?ref=[member_token]  → pre-selects participant in donate modal
            // &donor=[donor_token] → pre-fills donor name/email in donate form
            const refPart = assignedInviteToken
                ? `?ref=${assignedInviteToken}&donor=${donorInviteToken}`
                : `?donor=${donorInviteToken}`;
            sendDonorInviteEmail({
                to:           email,
                firstName:    first_name,
                campaignName: campaign.name ?? "a fundraising campaign",
                senderName,
                story:        campaign.story,
                goalAmount:   campaign.goal_amount ? Number(campaign.goal_amount) : null,
                endDate:      campaign.end_date?.toISOString() ?? null,
                timezone:     campaign.timezone,
                campaignUrl:  `${APP_URL}/campaigns/${slug}${refPart}`,
            }).catch((err) => console.error("[sendDonorInviteEmail]", err));
        }

        return NextResponse.json({ donor }, { status: 201 });
    } catch (err) {
        console.error("[POST donors]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
