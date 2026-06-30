import type { AuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@/generated/prisma/enums";
import SidebarChrome, { type SidebarData } from "./SidebarChrome";

export default async function Sidebar({ user }: { user: AuthUser }) {
    const [memberships, orgCampaign, unreadContacts] = await Promise.all([
        prisma.campaignMember.findMany({
            where: { user_id: user.id, campaign: { status: CampaignStatus.active } },
            select: {
                campaign: {
                    select: {
                        slug: true,
                        name: true,
                        campaign_type: true,
                        media: { select: { url: true, media_type: true } },
                    },
                },
                roles: { select: { role: true } },
            },
            orderBy: { campaign: { name: "asc" } },
        }),
        prisma.campaignMember.findFirst({
            where: { user_id: user.id, campaign: { campaign_type: "organization", org_display_name: { not: null } } },
            select: { campaign: { select: { org_display_name: true } } },
            orderBy: { created_at: "desc" },
        }),
        user.role === "admin"
            ? prisma.contactSubmission.count({ where: { is_read: false } })
            : Promise.resolve(0),
    ]);

    const activeCampaigns = memberships.map((m) => ({
        slug:          m.campaign.slug,
        name:          m.campaign.name,
        campaign_type: m.campaign.campaign_type,
        coverImageUrl: m.campaign.media.find((x) => x.media_type === "hero")?.url ?? null,
        isOrganizer:   m.roles.some((r) => r.role === "organizer"),
        isParticipant: m.roles.some((r) => r.role === "participant"),
    }));

    const allRoles = memberships.flatMap((m) => m.roles.map((r) => r.role));
    const primaryRole = allRoles.includes("organizer") ? "Organizer"
        : allRoles.includes("participant") ? "Participant"
        : null;

    const data: SidebarData = {
        campaigns: activeCampaigns,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.profile_photo_url,
        orgName: orgCampaign?.campaign.org_display_name ?? null,
        role: primaryRole,
        isAdmin: user.role === "admin",
        unreadContacts,
    };

    return <SidebarChrome data={data} />;
}
