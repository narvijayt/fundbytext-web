import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { code } = await ctx.params;

    const donor = await prisma.campaignDonor.findUnique({
        where: { short_code: code },
        select: {
            invite_token: true,
            campaign: { select: { slug: true } },
            assigned_member: { select: { invite_token: true } },
        },
    });

    if (!donor || !donor.invite_token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    const refPart = donor.assigned_member?.invite_token
        ? `?ref=${donor.assigned_member.invite_token}&donor=${donor.invite_token}`
        : `?donor=${donor.invite_token}`;

    return NextResponse.redirect(new URL(`/campaigns/${donor.campaign.slug}${refPart}`, req.url));
}
