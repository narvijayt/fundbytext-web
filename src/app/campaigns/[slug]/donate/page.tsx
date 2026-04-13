import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/generated/prisma/enums";
import DonateClient from "./_components/DonateClient";

export type DonateParticipant = {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
};

async function getCampaignForDonate(slug: string) {
    return prisma.campaign.findUnique({
        where: { slug },
        select: {
            name:            true,
            org_display_name: true,
            story:           true,
            status:          true,
            accent_color:    true,
            end_date:        true,
            media: {
                where:  { media_type: "hero" },
                take:   1,
                select: { url: true },
            },
            members: {
                where:  { roles: { some: { role: MemberRole.participant } } },
                select: { id: true, first_name: true, last_name: true, profile_photo_url: true },
                orderBy: { first_name: "asc" },
            },
        },
    });
}

export default async function DonatePage({
    params,
    searchParams,
}: {
    params:       Promise<{ slug: string }>;
    searchParams: Promise<{ member?: string }>;
}) {
    const { slug }             = await params;
    const { member: memberId } = await searchParams;

    const campaign = await getCampaignForDonate(slug);

    if (!campaign || campaign.status === "draft") notFound();

    const targetMember = memberId
        ? (campaign.members.find((m) => m.id === memberId) ?? null)
        : null;

    return (
        <DonateClient
            campaignSlug={slug}
            campaignName={campaign.org_display_name ?? campaign.name ?? "this campaign"}
            campaignStory={campaign.story}
            heroUrl={campaign.media[0]?.url ?? null}
            accent={campaign.accent_color ?? "#1565C0"}
            participants={campaign.members}
            targetMember={targetMember}
        />
    );
}
