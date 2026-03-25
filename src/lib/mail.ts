import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: false, // STARTTLS on port 587
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

const from = `"${process.env.MAIL_FROM_NAME ?? "FundByText"}" <${process.env.MAIL_FROM_ADDRESS}>`;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Reset your FundByText password",
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2>Reset your password</h2>
                <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                <a href="${resetUrl}"
                style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;
                        text-decoration:none;border-radius:6px;font-weight:bold">
                Reset Password
                </a>
                <p style="margin-top:24px;color:#6b7280;font-size:13px">
                If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}
