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
// ── Shared layout wrapper ──────────────────────────────────────────────────

function emailLayout(body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:32px 40px;text-align:center">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Fund<span style="color:#fb923c">By</span>Text</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
              You received this email because you are part of a FundByText campaign.<br>
              &copy; ${new Date().getFullYear()} FundByText. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, firstName: string, setPasswordUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Welcome to FundByText — set your password",
        html: emailLayout(`
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b">Welcome to FundByText, ${firstName}! 👋</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
                Your campaign has been created and your account is ready. Set a password so you can log back in anytime to manage your campaign.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 24px">
                <a href="${setPasswordUrl}" style="display:inline-block;padding:15px 36px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px">
                    Set My Password
                </a>
            </td></tr></table>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
                This link expires in 24 hours. If you didn't start a campaign on FundByText, you can safely ignore this email.
            </p>
        `),
    });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Reset your FundByText password",
        html: emailLayout(`
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b">Reset your password</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
                Click the button below to reset your password. This link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 24px">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px">
                    Reset Password
                </a>
            </td></tr></table>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
                If you didn't request this, you can safely ignore this email.
            </p>
        `),
    });
}

// ── Participant credentials (sent on campaign launch — email 1 of 2) ─────────

export async function sendParticipantCredentialsEmail({
    to,
    firstName,
    password,
    loginUrl,
}: {
    to: string;
    firstName: string;
    /** Generated plain-text password — null if participant already had an account */
    password: string | null;
    loginUrl: string;
}) {
    await transporter.sendMail({
        from,
        to,
        subject: "Your FundByText login details",
        html: emailLayout(`
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b">Hi ${firstName},</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
                Here are your login credentials for FundByText. Keep this email somewhere safe.
            </p>

            <!-- Credentials card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:24px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Email</p>
                    <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1e293b;word-break:break-all">${to}</p>

                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Password</p>
                    ${password
                        ? `<p style="margin:0;font-size:18px;font-weight:800;color:#1d4ed8;letter-spacing:2px;font-family:monospace,monospace">${password}</p>`
                        : `<p style="margin:0;font-size:14px;color:#64748b;font-style:italic">Use your existing FundByText password.</p>`
                    }
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 20px">
                <a href="${loginUrl}" style="display:inline-block;padding:15px 36px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px">
                    Log In to FundByText
                </a>
            </td></tr></table>

            ${password ? `
            <p style="margin:0 0 0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center">
                You can change your password anytime from your account settings.
            </p>
            ` : ""}
        `),
    });
}

// ── Participant invite (sent on campaign launch — email 2 of 2) ───────────────

export async function sendParticipantInviteEmail({
    to,
    firstName,
    campaignName,
    organizerName,
    orgDisplayName,
    goalAmount,
    endDate,
    loginUrl,
    campaignUrl,
}: {
    to: string;
    firstName: string;
    campaignName: string;
    organizerName: string;
    orgDisplayName?: string | null;
    goalAmount?: number | null;
    endDate?: string | null;
    loginUrl: string;
    campaignUrl: string;
}) {
    const formattedGoal = goalAmount
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmount)
        : null;
    const formattedEnd = endDate
        ? new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : null;
    const senderLine = orgDisplayName
        ? `${organizerName} from <strong>${orgDisplayName}</strong>`
        : `<strong>${organizerName}</strong>`;

    await transporter.sendMail({
        from,
        to,
        subject: `You're a participant in "${campaignName}" — here's how to get started`,
        html: emailLayout(`
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b">You're officially in! 🎉</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
                Hi ${firstName}, ${senderLine} has launched <strong>${campaignName}</strong> and you've been added as a participant.
                Your job is to reach out to donors and help hit the fundraising goal.
            </p>

            <!-- Campaign stats card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Campaign</p>
                    <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1e293b">${campaignName}</p>
                    ${formattedGoal ? `
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Fundraising Goal</p>
                    <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1d4ed8">${formattedGoal}</p>
                    ` : ""}
                    ${formattedEnd ? `
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Campaign Ends</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b">${formattedEnd}</p>
                    ` : ""}
                </td>
              </tr>
            </table>

            <!-- How it works -->
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px">How it works</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              ${[
                ["1", "Access your personal participant dashboard using the link below."],
                ["2", "Add your donor contacts — friends, family, teammates."],
                ["3", "FundByText will help you reach out via text, email, or a shareable link."],
                ["4", "Track your progress and contributions in real time."],
              ].map(([n, t]) => `
              <tr>
                <td width="32" valign="top" style="padding:0 12px 12px 0">
                  <div style="width:24px;height:24px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff">${n}</div>
                </td>
                <td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.5">${t}</td>
              </tr>`).join("")}
            </table>

            <!-- Primary CTA -->
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 16px">
                <a href="${loginUrl}" style="display:inline-block;padding:15px 36px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.2px">
                    Access My Participant Dashboard
                </a>
            </td></tr></table>

            <!-- Secondary link -->
            <p style="margin:0 0 24px;text-align:center;font-size:13px;color:#94a3b8">
                Or view the public campaign page:
                <a href="${campaignUrl}" style="color:#1d4ed8;text-decoration:none;font-weight:600">${campaignUrl}</a>
            </p>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px">
                This link is unique to you. Please do not share it with others.
            </p>
        `),
    });
}

// ── Donor thank-you (sent after a completed donation) ────────────────────────

export async function sendDonorThankYouEmail({
    to,
    donorFirstName,
    campaignName,
    campaignUrl,
    amount,
    organizerName,
    orgDisplayName,
    thankYouMessage,
}: {
    to: string;
    donorFirstName: string;
    campaignName: string;
    campaignUrl: string;
    amount: number;
    organizerName: string;
    orgDisplayName?: string | null;
    thankYouMessage: string;
}) {
    const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
    }).format(amount);

    const senderLine = orgDisplayName
        ? `${organizerName} &mdash; <strong>${orgDisplayName}</strong>`
        : `<strong>${organizerName}</strong>`;

    await transporter.sendMail({
        from,
        to,
        subject: `Thank you for supporting ${campaignName}!`,
        html: emailLayout(`
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b">Thank you, ${donorFirstName}! 🙏</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
                Your donation of <strong style="color:#16a34a">${formattedAmount}</strong> to
                <strong>${campaignName}</strong> has been received. We truly appreciate your generosity.
            </p>

            <!-- Thank you message -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td style="background:#f8fafc;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:20px 24px">
                    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7">${thankYouMessage.replace(/\n/g, "<br>")}</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1e293b">Thank you so much,</p>
                    <p style="margin:0;font-size:13px;color:#6b7280">${senderLine}</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 20px">
                <a href="${campaignUrl}" style="display:inline-block;padding:13px 32px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.2px">
                    View Campaign
                </a>
            </td></tr></table>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px;text-align:center">
                Your support makes a real difference. Share this campaign to help reach the goal!
            </p>
        `),
    });
}

// ── Donor invite (sent when a donor contact is added to a campaign) ─────────

export async function sendDonorInviteEmail({
    to,
    firstName,
    campaignName,
    senderName,
    story,
    goalAmount,
    endDate,
    campaignUrl,
}: {
    to: string;
    firstName: string;
    campaignName: string;
    senderName: string;
    story?: string | null;
    goalAmount?: number | null;
    endDate?: string | null;
    campaignUrl: string;
}) {
    const formattedGoal = goalAmount
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmount)
        : null;
    const formattedEnd = endDate
        ? new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : null;

    await transporter.sendMail({
        from,
        to,
        subject: `${senderName} is asking for your support — ${campaignName}`,
        html: emailLayout(`
            <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b">Hi ${firstName},</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
                <strong>${senderName}</strong> thought of you when sharing this fundraising campaign.
                Your contribution — no matter the size — makes a real difference.
            </p>

            <!-- Campaign card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);border-radius:10px;padding:24px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px">Fundraising Campaign</p>
                    <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3">${campaignName}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        ${formattedGoal ? `
                        <td style="padding-right:24px">
                          <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px">Goal</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#fb923c">${formattedGoal}</p>
                        </td>` : ""}
                        ${formattedEnd ? `
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px">Ends</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff">${formattedEnd}</p>
                        </td>` : ""}
                      </tr>
                    </table>
                </td>
              </tr>
            </table>

            ${story ? `
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px">About this campaign</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;border-left:3px solid #e2e8f0;padding-left:14px">
                ${story.length > 300 ? story.slice(0, 297) + "…" : story}
            </p>
            ` : ""}

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 20px">
                <a href="${campaignUrl}" style="display:inline-block;padding:15px 40px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.2px">
                    Support This Campaign
                </a>
            </td></tr></table>

            <p style="margin:0 0 6px;text-align:center;font-size:13px;color:#94a3b8">Or copy this link into your browser:</p>
            <p style="margin:0 0 20px;text-align:center">
                <a href="${campaignUrl}" style="font-size:13px;color:#1d4ed8;text-decoration:none;word-break:break-all">${campaignUrl}</a>
            </p>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px">
                You were added as a potential donor by ${senderName}. You are under no obligation to donate.
            </p>
        `),
    });
}
