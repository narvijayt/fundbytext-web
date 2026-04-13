// GET  /api/v1/campaigns/:slug/donors — list donors (role-based)
// POST /api/v1/campaigns/:slug/donors — add a donor contact (organizer OR participant)

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import { sendDonorInviteEmail } from "@/lib/mail";

type Ctx = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const postSchema = z.object({
    first_name:         z.string().min(1).max(100),
    last_name:          z.string().min(1).max(100),
    email:              z.string().email().max(255).optional().or(z.literal("")).optional(),
    phone:              z.string().max(20).optional().or(z.literal("")).optional(),
    assigned_member_id: z.string().uuid().optional().nullable(), // organizer can assign
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
    try {
        const user = await getAuthUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const skip   = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
        const take   = Math.min(100, Math.max(1, parseInt(searchParams.get("take") ?? "5", 10)));
        const search = searchParams.get("search")?.trim() ?? "";
        const status = searchParams.get("status") ?? "all";

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

        const isOrganizer = member.roles.some((r) => r.role === MemberRole.organizer);

        const where = {
            campaign_id: campaign.id,
            ...(!isOrganizer ? { assigned_member_id: member.id } : {}),
            ...(status !== "all" ? { status } : {}),
            ...(search ? {
                OR: [
                    { first_name: { contains: search, mode: "insensitive" as const } },
                    { last_name:  { contains: search, mode: "insensitive" as const } },
                    { email:      { contains: search, mode: "insensitive" as const } },
                ],
            } : {}),
        };

        const [donors, total] = await Promise.all([
            prisma.campaignDonor.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take,
                select: {
                    id:           true,
                    first_name:   true,
                    last_name:    true,
                    email:        true,
                    phone:        true,
                    status:       true,
                    email_valid:  true,
                    invite_token: true,
                    created_at:   true,
                    assigned_member: {
                        select: { id: true, first_name: true, last_name: true },
                    },
                    donations: {
                        where:   { payment_status: "completed" },
                        select:  { amount: true, created_at: true, is_anonymous: true },
                        orderBy: { created_at: "desc" },
                    },
                },
            }),
            prisma.campaignDonor.count({ where }),
        ]);

        const mapped = donors.map((d) => ({
            ...d,
            created_at: d.created_at.getTime(),
            donations:  d.donations.map((don) => ({
                amount:       parseFloat(don.amount.toString()),
                donated_at:   don.created_at.getTime(),
                is_anonymous: don.is_anonymous,
            })),
        }));

        return NextResponse.json({ donors: mapped, total });
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

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = postSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data" }, { status: 422 });
        }

        const { first_name, last_name, email, phone, assigned_member_id } = parsed.data;

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

        const donor = await prisma.campaignDonor.create({
            data: {
                campaign_id:        campaign.id,
                assigned_member_id: resolvedMemberId,
                first_name,
                last_name,
                email:        email || null,
                phone:        phone || null,
                invite_token: donorInviteToken,
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
                campaignUrl:  `${APP_URL}/campaigns/${slug}${refPart}`,
            }).catch((err) => console.error("[sendDonorInviteEmail]", err));
        }

        return NextResponse.json({ donor }, { status: 201 });
    } catch (err) {
        console.error("[POST donors]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
