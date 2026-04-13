// Centralised notification creation helpers.
// All functions are fire-and-forget safe — call without awaiting where needed.
// Goal/milestone notifications deduplicate by checking for an existing record first.

import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationStatus, GoalType } from "@/generated/prisma/enums";

function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ts() { return new Date(); }

// ── Low-level creators ────────────────────────────────────────────────────────

function createCampaignNotif(campaignId: string, trigger_event: string, message: string) {
    return prisma.campaignNotification.create({
        data: {
            campaign_id:       campaignId,
            notification_type: NotificationType.campaign,
            trigger_event,
            message,
            status:            NotificationStatus.sent,
            sent_at:           ts(),
        },
    });
}

function createParticipantNotif(campaignId: string, memberId: string, trigger_event: string, message: string) {
    return prisma.campaignNotification.create({
        data: {
            campaign_id:         campaignId,
            recipient_member_id: memberId,
            notification_type:   NotificationType.participant,
            trigger_event,
            message,
            status:              NotificationStatus.sent,
            sent_at:             ts(),
        },
    });
}

// Deduplicated variant — fires only once per campaign+event (for milestone events)
async function createCampaignNotifOnce(campaignId: string, trigger_event: string, message: string) {
    const exists = await prisma.campaignNotification.findFirst({
        where: { campaign_id: campaignId, trigger_event },
        select: { id: true },
    });
    if (!exists) await createCampaignNotif(campaignId, trigger_event, message);
}

// Deduplicated per campaign+member+event (for per-participant milestones)
async function createParticipantNotifOnce(campaignId: string, memberId: string, trigger_event: string, message: string) {
    const exists = await prisma.campaignNotification.findFirst({
        where: { campaign_id: campaignId, recipient_member_id: memberId, trigger_event },
        select: { id: true },
    });
    if (!exists) await createParticipantNotif(campaignId, memberId, trigger_event, message);
}

// ── Campaign Notifications ────────────────────────────────────────────────────

/** C1 — Campaign launched. */
export function notifyCampaignLaunched(campaignId: string) {
    return createCampaignNotif(campaignId, "campaign_launched", "Campaign launched.");
}

/** C2 — Your campaign is now active. */
export function notifyCampaignActive(campaignId: string) {
    return createCampaignNotif(campaignId, "campaign_now_active", "Your campaign is now active.");
}

/** C3 — [name] donated $X to your campaign. */
export function notifyDonationReceived(campaignId: string, donorName: string, amount: number) {
    return createCampaignNotif(
        campaignId,
        "donation_received",
        `${donorName} donated ${fmt(amount)} to your campaign.`,
    );
}

/** C4 — [ParticipantName] has completed their goal. */
export function notifyParticipantGoalCompleted(campaignId: string, participantName: string) {
    return createCampaignNotifOnce(
        campaignId,
        `participant_goal_completed_${participantName}`,
        `${participantName} has completed their goal.`,
    );
}

/** C5 — Open-ended campaign exceeded its goal; new goal set to 20% above raised amount.
 *  Fires once per raised-amount threshold to prevent duplicates. */
export function notifyGoalScaled(campaignId: string, raisedAmt: number, newGoal: number) {
    return createCampaignNotifOnce(
        campaignId,
        `goal_scaled_${Math.round(raisedAmt)}`,
        `${fmt(raisedAmt)} raised and counting! New goal set to ${fmt(newGoal)}.`,
    );
}

/** C6 — Your campaign has completed its goal. */
export function notifyCampaignGoalReached(campaignId: string) {
    return createCampaignNotifOnce(
        campaignId,
        "campaign_goal_completed",
        "Your campaign has completed its goal.",
    );
}

/** C7 — Campaign completed successfully! (auto end via cron) */
export function notifyCampaignCompleted(campaignId: string) {
    return createCampaignNotif(
        campaignId,
        "campaign_completed",
        "Campaign completed successfully!",
    );
}

/** C8 — Campaign ended early by organizer. */
export function notifyCampaignEndedEarly(campaignId: string) {
    return createCampaignNotif(
        campaignId,
        "campaign_ended_early",
        "Campaign ended early.",
    );
}

/** C9 — Campaign reactivated. */
export function notifyCampaignReactivated(campaignId: string) {
    return createCampaignNotif(
        campaignId,
        "campaign_reactivated",
        "Campaign reactivated.",
    );
}

/** C10 — Donations paused. */
export function notifyDonationsPaused(campaignId: string) {
    return createCampaignNotif(
        campaignId,
        "donations_paused",
        "Donations have been paused for this campaign.",
    );
}

/** C11 — Donations resumed. */
export function notifyDonationsResumed(campaignId: string) {
    return createCampaignNotif(
        campaignId,
        "donations_resumed",
        "Donations have been resumed for this campaign.",
    );
}

/** C12 — Campaign start date updated to [date]. */
export function notifyStartDateChanged(campaignId: string, newStartDate: Date) {
    const formatted = newStartDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        + " at "
        + newStartDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return createCampaignNotif(
        campaignId,
        "start_date_changed",
        `Campaign start date updated to ${formatted}.`,
    );
}

/** C13 — Campaign end date extended to [date] at [time]. */
export function notifyCampaignExtended(campaignId: string, newEndDate: Date) {
    const formatted = newEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        + " at "
        + newEndDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return createCampaignNotif(
        campaignId,
        "campaign_extended",
        `Campaign end date extended to ${formatted}.`,
    );
}

/** P6 — Campaign end date extended to [date] at [time]. (broadcast to all participants) */
export async function broadcastCampaignExtended(campaignId: string, memberIds: string[], newEndDate: Date) {
    if (memberIds.length === 0) return;
    const formatted = newEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        + " at "
        + newEndDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    await prisma.campaignNotification.createMany({
        data: memberIds.map((memberId) => ({
            campaign_id:         campaignId,
            recipient_member_id: memberId,
            notification_type:   NotificationType.participant,
            trigger_event:       "campaign_extended",
            message:             `Campaign end date extended to ${formatted}.`,
            status:              NotificationStatus.sent,
            sent_at:             new Date(),
        })),
    });
}

// ── Participant Notifications ─────────────────────────────────────────────────

/** P1 — [OrganizerName] has added you as a participant in [CampaignName]. */
export function notifyParticipantAdded(
    campaignId:    string,
    memberId:      string,
    organizerName: string,
    campaignName:  string,
) {
    return createParticipantNotif(
        campaignId,
        memberId,
        "participant_added",
        `${organizerName} has added you as a participant in ${campaignName}.`,
    );
}

/** P2 — [DonorName] donated $X. */
export function notifyParticipantDonationReceived(
    campaignId: string,
    memberId:   string,
    donorName:  string,
    amount:     number,
) {
    return createParticipantNotif(
        campaignId,
        memberId,
        "donation_received",
        `${donorName} donated ${fmt(amount)}.`,
    );
}

/** P3 — You have completed your funding goal. */
export function notifyParticipantOwnGoalCompleted(campaignId: string, memberId: string) {
    return createParticipantNotifOnce(
        campaignId,
        memberId,
        "participant_goal_completed",
        "You have completed your funding goal.",
    );
}

/** P4 — Campaign has completed its goal. (broadcast to all participants) */
export async function broadcastCampaignGoalReached(campaignId: string, memberIds: string[]) {
    if (memberIds.length === 0) return;
    // Deduplicate: only notify members who haven't received this yet
    const existing = await prisma.campaignNotification.findMany({
        where: {
            campaign_id:         campaignId,
            trigger_event:       "campaign_goal_completed_broadcast",
            recipient_member_id: { in: memberIds },
        },
        select: { recipient_member_id: true },
    });
    const alreadyNotified = new Set(existing.map((n) => n.recipient_member_id));
    const pending = memberIds.filter((id) => !alreadyNotified.has(id));
    if (pending.length === 0) return;
    await prisma.campaignNotification.createMany({
        data: pending.map((memberId) => ({
            campaign_id:         campaignId,
            recipient_member_id: memberId,
            notification_type:   NotificationType.participant,
            trigger_event:       "campaign_goal_completed_broadcast",
            message:             "Campaign has completed its goal.",
            status:              NotificationStatus.sent,
            sent_at:             ts(),
        })),
    });
}

/** P5 — Campaign completed successfully! (broadcast to all participants) */
export async function broadcastCampaignCompleted(campaignId: string, memberIds: string[]) {
    if (memberIds.length === 0) return;
    const existing = await prisma.campaignNotification.findMany({
        where: {
            campaign_id:         campaignId,
            trigger_event:       "campaign_completed_broadcast",
            recipient_member_id: { in: memberIds },
        },
        select: { recipient_member_id: true },
    });
    const alreadyNotified = new Set(existing.map((n) => n.recipient_member_id));
    const pending = memberIds.filter((id) => !alreadyNotified.has(id));
    if (pending.length === 0) return;
    await prisma.campaignNotification.createMany({
        data: pending.map((memberId) => ({
            campaign_id:         campaignId,
            recipient_member_id: memberId,
            notification_type:   NotificationType.participant,
            trigger_event:       "campaign_completed_broadcast",
            message:             "Campaign completed successfully!",
            status:              NotificationStatus.sent,
            sent_at:             ts(),
        })),
    });
}

// ── Post-donation goal checks ─────────────────────────────────────────────────
// Call this after every successfully recorded donation.

export async function checkGoalsAfterDonation(campaignId: string, memberId: string | null) {
    const campaign = await prisma.campaign.findUnique({
        where:  { id: campaignId },
        select: {
            goal_amount:  true,
            goal_type:    true,
            total_raised: true,
            members: {
                where:  { roles: { some: { role: "participant" } } },
                select: { id: true },
            },
        },
    });
    if (!campaign) return;

    const goalAmt    = campaign.goal_amount ? Number(campaign.goal_amount) : null;
    const raised     = Number(campaign.total_raised);
    const memberIds  = campaign.members.map((m) => m.id);

    // C5: open_ended goal scaled — new goal is always 20% above current raised amount
    // Using raised (not old goal) handles single donations that leap past the goal
    if (campaign.goal_type === GoalType.open_ended && goalAmt && raised >= goalAmt) {
        const newGoal = Math.ceil(raised * 1.2);
        await Promise.all([
            notifyGoalScaled(campaignId, raised, newGoal),
            prisma.campaign.update({
                where: { id: campaignId },
                data:  { goal_amount: newGoal },
            }),
        ]);
    }

    // C6 + P4: campaign goal reached (non-open-ended)
    if (campaign.goal_type !== GoalType.open_ended && goalAmt && raised >= goalAmt) {
        await Promise.all([
            notifyCampaignGoalReached(campaignId),
            broadcastCampaignGoalReached(campaignId, memberIds),
        ]);
    }

    // C4 + P3: participant hit their goal (participant_goal type only)
    if (memberId && campaign.goal_type === GoalType.participant_goal && goalAmt) {
        const memberRaised = await prisma.donation.aggregate({
            where:   { campaign_id: campaignId, member_id: memberId, payment_status: "completed" },
            _sum:    { amount: true },
        });
        const mRaised = Number(memberRaised._sum.amount ?? 0);
        if (mRaised >= goalAmt) {
            const member = await prisma.campaignMember.findUnique({
                where:  { id: memberId },
                select: { first_name: true, last_name: true },
            });
            const name = member ? `${member.first_name} ${member.last_name}` : "A participant";
            await Promise.all([
                notifyParticipantGoalCompleted(campaignId, name),
                notifyParticipantOwnGoalCompleted(campaignId, memberId),
            ]);
        }
    }
}
