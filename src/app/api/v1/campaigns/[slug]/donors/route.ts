// POST /api/v1/campaigns/:slug/donors — add a donor contact (individual campaigns, organizer only)
// Sends the donor a public campaign link email if they have an email address.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { MemberRole } from "@/generated/prisma/enums";
import { sendDonorInviteEmail } from "@/lib/mail";

type Ctx = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const schema = z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    phone: z.string().max(20).optional().or(z.literal("")),
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
                campaign_type: true,
                name: true,
                story: true,
                goal_amount: true,
                end_date: true,
                members: {
                    where: { user_id: user.id },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        roles: { select: { role: true } },
                    },
                },
            },
        });

        if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const member = campaign.members[0];
        const isOrganizer = member?.roles.some((r) => r.role === MemberRole.organizer);
        if (!isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 422 });
        }

        const { first_name, last_name, email, phone } = parsed.data;

        const donor = await prisma.campaignDonor.create({
            data: {
                campaign_id: campaign.id,
                assigned_member_id: member.id,
                first_name,
                last_name,
                email,
                phone: phone || null,
            },
        });

        // ── Send donor invite email (non-fatal) ────────────────────────────
        const donorEmail = email || null;
        if (donorEmail) {
            const senderName = `${member.first_name} ${member.last_name}`;
            const goalAmount = campaign.goal_amount ? Number(campaign.goal_amount) : null;

            sendDonorInviteEmail({
                to: donorEmail,
                firstName: first_name,
                campaignName: campaign.name ?? "a fundraising campaign",
                senderName,
                story: campaign.story,
                goalAmount,
                endDate: campaign.end_date?.toISOString() ?? null,
                campaignUrl: `${APP_URL}/campaigns/${slug}`,
            }).catch((err) => console.error("[sendDonorInviteEmail]", err));
        }

        return NextResponse.json({ donor }, { status: 201 });
    } catch (err) {
        console.error("[POST donors]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
