import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/generated/prisma/enums";
import SetupWizard from "./SetupWizard";

export default async function CampaignSetupPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ step?: string }>;
}) {
    const { slug } = await params;
    const { step } = await searchParams;
    const requestedStep = Math.min(5, Math.max(1, parseInt(step ?? "1", 10) || 1));

    const user = await getAuthUser();
    if (!user) redirect(`/login?from=/campaigns/${slug}/create`);

    const [campaign, donationCount] = await Promise.all([
        prisma.campaign.findUnique({
            where: { slug },
            include: {
                media:   { orderBy: { sort_order: "asc" } },
                payout:  true,
                members: { include: { roles: { select: { role: true } } }, orderBy: { created_at: "asc" } },
                // Only the donors the organizer added (source "invited"); walk-ins and
                // other organic entries from the live campaign don't belong in this list.
                donors:  { where: { source: "invited" }, orderBy: { created_at: "asc" }, select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
            },
        }),
        prisma.donation.count({ where: { campaign: { slug }, payment_status: "completed" } }),
    ]);

    if (!campaign) redirect("/dashboard");

    const myMember = campaign.members.find((m) => m.user_id === user.id);
    const isOrganizer = myMember?.roles.some((r) => r.role === MemberRole.organizer);
    if (!isOrganizer) redirect("/dashboard");

    let defaultOrgDisplayName: string | null = null;
    if (campaign.campaign_type === "organization" && !campaign.org_display_name) {
        const prev = await prisma.campaignMember.findFirst({
            where: {
                user_id: user.id,
                campaign: {
                    campaign_type: "organization",
                    org_display_name: { not: null },
                    id: { not: campaign.id },
                },
            },
            select: { campaign: { select: { org_display_name: true } } },
            orderBy: { created_at: "desc" },
        });
        defaultOrgDisplayName = prev?.campaign.org_display_name ?? null;
    }

    // campaign is non-null past this point — TypeScript needs the reassignment
    // Returns the first step where a mandatory field is missing.
    // When coming from dashboard, user lands where work is needed.
    function firstIncompleteStep(): number {
        if (!campaign!.name || !campaign!.end_date) return 1;
        if (campaign!.campaign_type === "organization" && !campaign!.org_display_name?.trim()) return 1;
        const p = campaign!.payout;
        const payoutComplete = p &&
            p.recipient_first_name?.trim() &&
            p.recipient_last_name?.trim() &&
            p.street_address?.trim() &&
            p.city?.trim() &&
            p.state?.trim() &&
            p.zip?.trim();
        if (!campaign!.goal_type || !campaign!.goal_amount || !payoutComplete) return 2;
        if (!campaign!.media.some((m) => m.media_type === "hero")) return 3;
        return campaign!.current_step;
    }

    // Serialise Decimal / Date values for the client component
    const campaignData = JSON.parse(JSON.stringify(campaign));

    // If a specific step was requested via ?step= use it, otherwise find first incomplete
    const initialStep = requestedStep > 1 ? requestedStep : firstIncompleteStep();

    return (
        <SetupWizard
            campaign={campaignData}
            slug={slug}
            initialStep={Math.min(initialStep, 5)}
            defaultOrgDisplayName={defaultOrgDisplayName}
            hasDonations={donationCount > 0}
            organizerInfo={{
                first_name: myMember!.first_name,
                last_name:  myMember!.last_name,
                email:      myMember!.email ?? "",
                phone:      myMember!.phone ?? "",
            }}
        />
    );
}
