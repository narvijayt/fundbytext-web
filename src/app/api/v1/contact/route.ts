import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendContactEmail } from "@/lib/mail";

// All contact submissions are emailed here (overridable via env).
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT ?? "agd.abhaykumar@gmail.com";

const INQUIRY_TYPES = [
    "General Inquiry",
    "Campaign Support",
    "Partnership",
    "Feedback",
    "Press & Media",
    "Other",
] as const;

const schema = z.object({
    inquiry_type: z.enum(INQUIRY_TYPES),
    first_name: z.string().trim().min(1, "First name is required").max(100),
    last_name: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    message: z.string().trim().min(1, "Message is required").max(5000),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const data = parsed.data;

    // 1) Persist the submission so it's never lost (even if email delivery fails).
    const submission = await prisma.contactSubmission.create({ data });

    // 2) Notify the contact inbox. Email failures must not fail the submission.
    try {
        await sendContactEmail({
            to: CONTACT_RECIPIENT,
            inquiryType: data.inquiry_type,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            message: data.message,
        });
    } catch (err) {
        console.error("[contact] email delivery failed:", err);
    }

    return NextResponse.json({
        message: "Thanks for reaching out! We'll get back to you soon.",
        id: submission.id,
    });
}
