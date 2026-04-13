// POST /api/v1/payments/intent
// Creates a Stripe PaymentIntent for a campaign donation.
// No auth required — public donors can pay.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2026-03-25.dahlia" });

const schema = z.object({
    campaign_slug:     z.string().min(1),
    amount_cents:      z.number().int().min(100),                // minimum $1.00
    member_id:         z.string().uuid().nullable().optional(),  // participant attribution
    campaign_donor_id: z.string().uuid().nullable().optional(),  // specific invited donor record
    donor_first_name:  z.string().min(1).max(100),
    donor_last_name:   z.string().min(1).max(100),
    donor_email:       z.string().email().max(255).optional().nullable(),
    donor_phone:       z.string().max(20).optional().nullable(),
    is_anonymous:      z.boolean().default(false),
    donor_country:     z.string().max(100).optional().nullable(),
    donor_zip:         z.string().max(10).optional().nullable(),
});

// PATCH — update metadata on an existing PaymentIntent before confirmation.
// Called by the client just before stripe.confirmPayment() so the webhook
// receives correct donor info and attribution.
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = z.object({
            client_secret:    z.string().min(1),
            member_id:        z.string().uuid().nullable().optional(),
            donor_first_name: z.string().min(1).max(100),
            donor_last_name:  z.string().min(1).max(100),
            donor_email:      z.string().email().max(255).optional().nullable(),
            donor_phone:      z.string().max(20).optional().nullable(),
            is_anonymous:     z.boolean(),
        }).safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request" }, { status: 422 });
        }

        const { client_secret, member_id, donor_first_name, donor_last_name,
                donor_email, donor_phone, is_anonymous } = parsed.data;

        // client_secret format: pi_xxx_secret_yyy — extract the PaymentIntent ID
        const intentId = client_secret.split("_secret_")[0];
        if (!intentId.startsWith("pi_")) {
            return NextResponse.json({ error: "Invalid client_secret" }, { status: 400 });
        }

        const displayName = is_anonymous ? "Anonymous" : `${donor_first_name} ${donor_last_name}`;

        await stripe.paymentIntents.update(intentId, {
            metadata: {
                member_id:          member_id ?? "",
                donor_first_name,
                donor_last_name,
                donor_display_name: displayName,
                donor_email:        donor_email  ?? "",
                donor_phone:        donor_phone  ?? "",
                is_anonymous:       String(is_anonymous),
            },
            receipt_email: donor_email ?? undefined,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[PATCH /payments/intent]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request" }, { status: 422 });
        }

        const {
            campaign_slug, amount_cents, member_id, campaign_donor_id,
            donor_first_name, donor_last_name, donor_email, donor_phone,
            is_anonymous, donor_country, donor_zip,
        } = parsed.data;

        const campaign = await prisma.campaign.findUnique({
            where:  { slug: campaign_slug },
            select: { id: true, name: true, status: true },
        });

        if (!campaign || campaign.status === "draft") {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status === "completed") {
            return NextResponse.json({ error: "This campaign has ended and is no longer accepting donations." }, { status: 403 });
        }

        const displayName = is_anonymous
            ? "Anonymous"
            : `${donor_first_name} ${donor_last_name}`;

        const intent = await stripe.paymentIntents.create({
            amount:   amount_cents,
            currency: "usd",
            payment_method_types: ["card"],
            metadata: {
                campaign_id:       campaign.id,
                campaign_slug,
                member_id:         member_id         ?? "",
                campaign_donor_id: campaign_donor_id ?? "",
                donor_first_name,
                donor_last_name,
                donor_email:       donor_email  ?? "",
                donor_phone:       donor_phone  ?? "",
                donor_display_name: displayName,
                is_anonymous:      String(is_anonymous),
                donor_country:     donor_country ?? "",
                donor_zip:         donor_zip     ?? "",
            },
            receipt_email: donor_email ?? undefined,
            description:   `Donation to ${campaign.name ?? campaign_slug}`,
        });

        return NextResponse.json({ client_secret: intent.client_secret });
    } catch (err) {
        console.error("[POST /payments/intent]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
