// POST /api/v1/payments/webhook
// Stripe webhook — records completed PaymentIntents as Donation rows
// and updates campaign.total_raised.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
    notifyDonationReceived,
    notifyParticipantDonationReceived,
    checkGoalsAfterDonation,
} from "@/lib/notifications";
import { publishDonation } from "@/lib/ably";

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2026-03-25.dahlia" });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig  = req.headers.get("stripe-signature") ?? "";

    let event: Stripe.Event;
    try {
        event = WEBHOOK_SECRET
            ? stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
            : JSON.parse(body) as Stripe.Event;
    } catch (err) {
        console.error("[webhook] signature error:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type !== "payment_intent.succeeded") {
        return NextResponse.json({ received: true });
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const m  = pi.metadata;

    try {
        const amount      = pi.amount / 100;          // cents → dollars
        const platformFee = parseFloat((amount * 0.1).toFixed(2));
        const netAmount   = parseFloat((amount - platformFee).toFixed(2));

        // Idempotent — skip if already recorded
        const existing = await prisma.donation.findUnique({
            where: { stripe_payment_intent_id: pi.id },
        });
        if (existing) return NextResponse.json({ received: true });

        const isAnonymous      = m.is_anonymous === "true";
        const resolvedMemberId = m.member_id || null;
        const displayName      = isAnonymous ? "Anonymous" : (m.donor_display_name || `${m.donor_first_name} ${m.donor_last_name}`);
        const notifName        = isAnonymous ? `${m.donor_first_name} ${m.donor_last_name} (Anonymous)` : displayName;

        // Prefer campaign_donor_id (set when donor used their unique invite link).
        // Fall back to email + member match for organic / walk-up donations.
        const campaignDonor = m.campaign_donor_id
            ? await prisma.campaignDonor.findUnique({ where: { id: m.campaign_donor_id } })
            : m.donor_email
            ? await prisma.campaignDonor.findFirst({
                where: {
                    campaign_id:        m.campaign_id,
                    email:              m.donor_email,
                    assigned_member_id: resolvedMemberId,
                },
              })
            : null;

        const [newDonation, updatedCampaign] = await prisma.$transaction([
            prisma.donation.create({
                data: {
                    campaign_id:             m.campaign_id,
                    member_id:               resolvedMemberId,
                    campaign_donor_id:       campaignDonor?.id ?? null,
                    amount,
                    platform_fee:            platformFee,
                    net_amount:              netAmount,
                    donor_first_name:        m.donor_first_name,
                    donor_last_name:         m.donor_last_name,
                    donor_display_name:      displayName,
                    donor_email:             m.donor_email || null,
                    donor_phone:             m.donor_phone || null,
                    donor_country:           m.donor_country || null,
                    donor_zip:               m.donor_zip || null,
                    is_anonymous:            isAnonymous,
                    stripe_payment_intent_id: pi.id,
                    payment_method:          "card",
                    payment_status:          "completed",
                },
            }),
            prisma.campaign.update({
                where:  { id: m.campaign_id },
                data:   { total_raised: { increment: amount } },
                select: { total_raised: true, slug: true },
            }),
        ]);

        // ── Ably: push real-time update to dashboard (non-fatal) ────────────
        publishDonation(updatedCampaign.slug, {
            id:                 newDonation.id,
            amount,
            donor_display_name: displayName,
            donor_first_name:   m.donor_first_name || "Guest",
            donor_last_name:    m.donor_last_name  || "Donor",
            is_anonymous:       isAnonymous,
            member_id:          resolvedMemberId,
            created_at:         Date.now(),
            total_raised:       parseFloat(updatedCampaign.total_raised.toString()),
        });

        // Mark matched donor contact as donated
        if (campaignDonor) {
            await prisma.campaignDonor.update({
                where: { id: campaignDonor.id },
                data:  { status: "donated" },
            });
        }

        // ── Notifications (non-fatal) ────────────────────────────────────────
        const notifTasks: Promise<unknown>[] = [
            notifyDonationReceived(m.campaign_id, notifName, amount),
        ];
        if (resolvedMemberId) {
            notifTasks.push(
                notifyParticipantDonationReceived(m.campaign_id, resolvedMemberId, notifName, amount),
            );
        }
        notifTasks.push(checkGoalsAfterDonation(m.campaign_id, resolvedMemberId));
        Promise.allSettled(notifTasks).catch(console.error);
    } catch (err) {
        console.error("[webhook] failed to record donation:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
