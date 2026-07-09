// POST /api/v1/payments/record
// Called by the client immediately after stripe.confirmPayment() succeeds.
// Verifies the PaymentIntent with Stripe, then idempotently creates the Donation
// record and updates campaign.total_raised.
//
// This covers the common case where Stripe webhooks are not set up (local dev)
// or haven't fired yet. The webhook handler is still the authoritative path for
// redirect-based payment methods (PayPal etc.) — both paths are idempotent.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendDonorThankYouEmail } from "@/lib/mail";
import {
    notifyDonationReceived,
    notifyParticipantDonationReceived,
    checkGoalsAfterDonation,
} from "@/lib/notifications";
import { publishDonation } from "@/lib/ably";

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2026-03-25.dahlia" });

const schema = z.object({
    payment_intent_id: z.string().min(1).startsWith("pi_"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid payment_intent_id" }, { status: 422 });
        }

        const { payment_intent_id } = parsed.data;

        // Verify with Stripe and expand payment_method (card details) + latest_charge (receipt URL)
        const pi = await stripe.paymentIntents.retrieve(payment_intent_id, {
            expand: ["payment_method", "latest_charge"],
        });

        if (pi.status !== "succeeded") {
            return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
        }

        const m = pi.metadata;
        const receiptUrl = (pi.latest_charge as import("stripe").Stripe.Charge | null)?.receipt_url ?? null;

        if (!m.campaign_id) {
            return NextResponse.json({ error: "Missing campaign metadata" }, { status: 400 });
        }

        // Idempotent — already recorded (e.g. webhook fired first)
        const existing = await prisma.donation.findUnique({
            where:  { stripe_payment_intent_id: pi.id },
            select: { card_brand: true, card_last4: true },
        });
        if (existing) return NextResponse.json({ ok: true, card_brand: existing.card_brand, card_last4: existing.card_last4, receipt_url: receiptUrl });

        const amount      = pi.amount / 100;
        const platformFee = 0;
        const netAmount   = amount;

        // Extract card details from the expanded payment method
        const pm   = pi.payment_method as import("stripe").Stripe.PaymentMethod | null;
        const card = pm?.type === "card" ? pm.card : null;
        const cardBrand    = card?.brand      ?? null;
        const cardLast4    = card?.last4      ?? null;
        const cardExpMonth = card?.exp_month  ?? null;
        const cardExpYear  = card?.exp_year   ?? null;

        const isAnonymous = m.is_anonymous === "true";
        const displayName = isAnonymous
            ? "Anonymous"
            : (m.donor_display_name || `${m.donor_first_name} ${m.donor_last_name}`);
        const notifName   = isAnonymous
            ? `${m.donor_first_name} ${m.donor_last_name} (Anonymous)`
            : displayName;

        const resolvedMemberId = m.member_id || null;

        const donorSource = (m.donor_source as "link_self" | "") || null;

        // Resolve the donor record in priority order:
        // 1. campaign_donor_id in metadata → exact donor invited via unique link
        // 2. link_self source → always create new (skip email match; donor came via link but paying separately)
        // 3. email + member assignment match → walk-up or direct donation with same email
        // 4. No match → create a new contact (covers anonymous / organic donations)
        let campaignDonor = m.campaign_donor_id
            ? await prisma.campaignDonor.findUnique({
                where: { id: m.campaign_donor_id },
              })
            : donorSource === "link_self"
            ? null  // skip matching — new entry will be created below
            : m.donor_email
            ? await prisma.campaignDonor.findFirst({
                where: {
                    campaign_id:        m.campaign_id,
                    email:              m.donor_email?.toLowerCase(),
                    assigned_member_id: resolvedMemberId,
                },
              })
            : null;

        // No matching contact — create one.
        if (!campaignDonor) {
            campaignDonor = await prisma.campaignDonor.create({
                data: {
                    campaign_id:        m.campaign_id,
                    assigned_member_id: resolvedMemberId,
                    first_name:         m.donor_first_name || "Guest",
                    last_name:          m.donor_last_name  || "Donor",
                    email:              m.donor_email?.toLowerCase() || null,
                    phone:              m.donor_phone      || null,
                    status:             "donated",
                    source:             donorSource === "link_self" ? "link_self" : "walk_in",
                },
            });
        }

        const [newDonation, updatedCampaign] = await prisma.$transaction([
            prisma.donation.create({
                data: {
                    campaign_id:              m.campaign_id,
                    member_id:                resolvedMemberId,
                    campaign_donor_id:        campaignDonor?.id ?? null,
                    amount,
                    platform_fee:             platformFee,
                    net_amount:               netAmount,
                    donor_first_name:         m.donor_first_name  || "Guest",
                    donor_last_name:          m.donor_last_name   || "Donor",
                    donor_display_name:       displayName,
                    donor_email:              m.donor_email?.toLowerCase() || null,
                    donor_phone:              m.donor_phone   || null,
                    donor_country:            m.donor_country || null,
                    donor_zip:                m.donor_zip     || null,
                    is_anonymous:             isAnonymous,
                    stripe_payment_intent_id: pi.id,
                    payment_method:           "card",
                    payment_status:           "completed",
                    card_brand:               cardBrand,
                    card_last4:               cardLast4,
                    card_exp_month:           cardExpMonth,
                    card_exp_year:            cardExpYear,
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

        // Send thank-you email if the campaign has a thank_you_message and donor has an email
        const donorEmail = m.donor_email || null;
        if (donorEmail && !isAnonymous) {
            const campaignFull = await prisma.campaign.findUnique({
                where:  { id: m.campaign_id },
                select: {
                    name:              true,
                    slug:              true,
                    goal_type:         true,
                    thank_you_message: true,
                    org_display_name:  true,
                    members: {
                        where: { roles: { some: { role: "organizer" } } },
                        select: { first_name: true, last_name: true, profile_photo_url: true, user: { select: { profile_photo_url: true } } },
                        take: 1,
                    },
                },
            });

            if (campaignFull?.thank_you_message) {
                const organizer    = campaignFull.members[0];
                const organizerName = organizer
                    ? `${organizer.first_name} ${organizer.last_name}`
                    : "The Organizer";

                // The note is signed (name + photo) by the participant it's attributed
                // to on a participant-goal campaign, otherwise by the organizer.
                let signerName = organizerName;
                let signerPhotoUrl: string | null = organizer?.profile_photo_url ?? organizer?.user?.profile_photo_url ?? null;
                if (campaignFull.goal_type === "participant_goal" && resolvedMemberId) {
                    const participant = await prisma.campaignMember.findUnique({
                        where:  { id: resolvedMemberId },
                        select: { first_name: true, last_name: true, profile_photo_url: true, user: { select: { profile_photo_url: true } } },
                    });
                    if (participant) {
                        signerName     = `${participant.first_name} ${participant.last_name}`.trim();
                        signerPhotoUrl = participant.profile_photo_url ?? participant.user?.profile_photo_url ?? null;
                    }
                }

                const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

                sendDonorThankYouEmail({
                    to:              donorEmail,
                    donorFirstName:  m.donor_first_name || "there",
                    campaignName:    campaignFull.name ?? "the campaign",
                    campaignUrl:     `${APP_URL}/campaigns/${campaignFull.slug}`,
                    amount,
                    signerName,
                    signerPhotoUrl,
                    orgDisplayName:  campaignFull.org_display_name ?? null,
                    thankYouMessage: campaignFull.thank_you_message,
                }).catch((err) => console.error("[sendDonorThankYouEmail]", err));
            }
        }

        return NextResponse.json({ ok: true, card_brand: cardBrand, card_last4: cardLast4, receipt_url: receiptUrl });
    } catch (err) {
        console.error("[POST /payments/record]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
