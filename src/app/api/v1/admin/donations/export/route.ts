// GET /api/v1/admin/donations/export — stream CSV of completed donations (admin only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/session";
import { PaymentStatus } from "@/generated/prisma/enums";

function escapeCsv(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function row(cols: (string | number | null | undefined)[]): string {
    return cols.map(escapeCsv).join(",");
}

export async function GET(req: NextRequest) {
    try {
        const admin = await getAuthUserFromRequest(req);
        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sp     = req.nextUrl.searchParams;
        const query  = sp.get("q")?.trim() ?? "";
        const filter = sp.get("filter") ?? "all";
        const sort   = sp.get("sort")   ?? "newest";

        const where = {
            payment_status: PaymentStatus.completed,
            ...(query ? {
                OR: [
                    { donor_first_name:         { contains: query, mode: "insensitive" as const } },
                    { donor_last_name:          { contains: query, mode: "insensitive" as const } },
                    { donor_email:             { contains: query, mode: "insensitive" as const } },
                    { stripe_payment_intent_id: { contains: query, mode: "insensitive" as const } },
                    { campaign: { name:         { contains: query, mode: "insensitive" as const } } },
                ],
            } : {}),
            ...(filter === "flagged"   ? { is_flagged: true }   : {}),
            ...(filter === "anonymous" ? { is_anonymous: true } : {}),
        };

        const orderBy =
            sort === "oldest"  ? { created_at: "asc"  as const }
            : sort === "highest" ? { amount:   "desc" as const }
            : sort === "lowest"  ? { amount:   "asc"  as const }
            : { created_at: "desc" as const };

        const donations = await prisma.donation.findMany({
            where,
            orderBy,
            select: {
                id:                       true,
                amount:                   true,
                platform_fee:             true,
                net_amount:               true,
                donor_first_name:         true,
                donor_last_name:          true,
                donor_email:              true,
                donor_phone:              true,
                donor_country:            true,
                donor_zip:                true,
                is_anonymous:             true,
                is_flagged:               true,
                flag_note:                true,
                stripe_payment_intent_id: true,
                payment_method:           true,
                card_brand:               true,
                card_last4:               true,
                card_exp_month:           true,
                card_exp_year:            true,
                created_at:               true,
                campaign: { select: { slug: true, name: true } },
                member:   { select: { first_name: true, last_name: true } },
            },
        });

        const header = [
            "ID", "Date", "Campaign", "Donor First Name", "Donor Last Name",
            "Donor Email", "Donor Phone", "Donor Country", "Donor ZIP",
            "Anonymous", "Amount (USD)", "Platform Fee (USD)", "Net Amount (USD)",
            "Payment Method", "Card Brand", "Card Last4", "Card Exp Month", "Card Exp Year",
            "Stripe Payment Intent ID", "Attributed To", "Flagged", "Flag Note",
        ].join(",");

        const lines = [header];
        for (const d of donations) {
            lines.push(row([
                d.id,
                d.created_at.toISOString(),
                d.campaign.name,
                d.is_anonymous ? "" : d.donor_first_name,
                d.is_anonymous ? "" : d.donor_last_name,
                d.is_anonymous ? "" : d.donor_email,
                d.is_anonymous ? "" : d.donor_phone,
                d.donor_country,
                d.donor_zip,
                d.is_anonymous ? "Yes" : "No",
                d.amount.toString(),
                d.platform_fee.toString(),
                d.net_amount.toString(),
                d.payment_method,
                d.card_brand,
                d.card_last4,
                d.card_exp_month,
                d.card_exp_year,
                d.stripe_payment_intent_id,
                d.member ? `${d.member.first_name} ${d.member.last_name}` : "",
                d.is_flagged ? "Yes" : "No",
                d.flag_note,
            ]));
        }

        const csv = lines.join("\n");
        const filename = `donations-${new Date().toISOString().slice(0, 10)}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type":        "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error("[GET admin/donations/export]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
