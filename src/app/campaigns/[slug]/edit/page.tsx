import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/generated/prisma/enums";
import SetupWizard from "../create/SetupWizard";

export default async function CampaignEditPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ step?: string }>;
}) {
    const { slug } = await params;
    const { step } = await searchParams;

    const user = await getAuthUser();
    if (!user) redirect(`/login?from=/campaigns/${slug}/edit`);

    const campaign = await prisma.campaign.findUnique({
        where: { slug },
        include: {
            media:   { orderBy: { sort_order: "asc" } },
            payout:  true,
            members: { include: { roles: { select: { role: true } } }, orderBy: { created_at: "asc" } },
            donors:  { orderBy: { created_at: "asc" }, select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
        },
    });

    if (!campaign) redirect("/dashboard");

    const myMember = campaign.members.find((m) => m.user_id === user.id);
    const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
    if (!isOrganizer) redirect("/dashboard");

    const requestedStep = Math.min(5, Math.max(1, parseInt(step ?? "1", 10) || 1));
    const campaignData = JSON.parse(JSON.stringify(campaign));

    return (
        <SetupWizard
            campaign={campaignData}
            slug={slug}
            initialStep={requestedStep}
            isEditMode
            amountRaised={Number(campaign.total_raised)}
        />
    );
}
