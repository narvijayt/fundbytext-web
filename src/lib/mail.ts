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

const from = `"${process.env.MAIL_FROM_NAME ?? "FundbyText"}" <${process.env.MAIL_FROM_ADDRESS}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ── Brand system ───────────────────────────────────────────────────────────
   The same palette + wordmark used across the app. Custom web fonts (the app's
   "Satoshi") can't be relied on in email — Gmail and others strip @font-face —
   so we use a clean, widely-available system stack for consistent rendering. */
const NAVY = "#003060";
const BLUE = "#0268c0";
const GREEN = "#28c45d";
const ORANGE = "#f47435";
const INK = "#1f2a37";
const BODY = "#51607a";
const FAINT = "#9aa7b8";
const CARD = "#f5f8fc";
const LINE = "#e7eef6";
const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";

/* Section label (small uppercase caption above a value). */
function label(text: string): string {
    return `<p style="margin:0 0 5px;font-size:11px;font-weight:700;color:${FAINT};text-transform:uppercase;letter-spacing:1px">${text}</p>`;
}

/* Primary call-to-action button. */
function button(href: string, text: string, bg: string = BLUE): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:6px 0 22px">
        <a href="${href}" style="display:inline-block;padding:14px 36px;background:${bg};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;font-family:${FONT};box-shadow:0 6px 14px -6px ${bg}">${text}</a>
    </td></tr></table>`;
}

// ── Shared layout wrapper ──────────────────────────────────────────────────

function emailLayout(body: string, preheader = ""): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <title>FundbyText</title>
</head>
<body style="margin:0;padding:0;background:#eaf0f7;font-family:${FONT};-webkit-font-smoothing:antialiased">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eaf0f7">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf0f7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px -10px rgba(0,48,96,0.22)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${BLUE} 0%,${NAVY} 100%);padding:30px 40px;text-align:center">
            <img src="${APP_URL}/assets/email/logo.png" alt="FundbyText" height="26" style="height:26px;width:auto;border:0;outline:none;display:inline-block">
          </td>
        </tr>
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${GREEN}">&nbsp;</td></tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 30px">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 30px;background:${CARD};border-top:1px solid ${LINE};text-align:center">
            <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Fund<span style="color:${GREEN}">by</span>Text</p>
            <p style="margin:0;font-size:12px;color:${FAINT};line-height:1.7">
              Fundraising made simple — one text at a time.<br>
              &copy; ${new Date().getFullYear()} FundbyText. All rights reserved.
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
        subject: "Welcome to FundbyText — set your password",
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Welcome aboard, ${firstName}! 👋</h1>
            <p style="margin:0 0 24px;font-size:15px;color:${BODY};line-height:1.7">
                Your campaign has been created and your account is ready. Set a password so you can log back in anytime to manage your campaign.
            </p>
            ${button(setPasswordUrl, "Set My Password")}
            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7">
                This link expires in 24 hours. If you didn't start a campaign on FundbyText, you can safely ignore this email.
            </p>
        `, `Set your password to finish setting up your FundbyText account.`),
    });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Reset your FundbyText password",
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:15px;color:${BODY};line-height:1.7">
                Click the button below to choose a new password. For your security, this link expires in <strong style="color:${INK}">1 hour</strong>.
            </p>
            ${button(resetUrl, "Reset Password")}
            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7">
                Didn't request this? You can safely ignore this email — your password won't change.
            </p>
        `, `Reset your FundbyText password (link expires in 1 hour).`),
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
        subject: "Your FundbyText login details",
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Hi ${firstName},</h1>
            <p style="margin:0 0 24px;font-size:15px;color:${BODY};line-height:1.7">
                Here are your login details for FundbyText. Keep this email somewhere safe.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px">
              <tr>
                <td style="background:${CARD};border:1px solid ${LINE};border-radius:12px;padding:24px">
                    ${label("Email")}
                    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:${INK};word-break:break-all">${to}</p>
                    ${label("Password")}
                    ${password
                        ? `<div style="display:inline-block;background:#ffffff;border:1px dashed ${BLUE};border-radius:8px;padding:10px 16px">
                             <span style="font-size:20px;font-weight:800;color:${BLUE};letter-spacing:3px;font-family:'SF Mono',Consolas,Menlo,monospace">${password}</span>
                           </div>`
                        : `<p style="margin:0;font-size:14px;color:${BODY};font-style:italic">Use your existing FundbyText password.</p>`
                    }
                </td>
              </tr>
            </table>

            ${button(loginUrl, "Log In to FundbyText")}

            ${password ? `
            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7;text-align:center">
                For your security, change your password anytime from your account settings.
            </p>
            ` : ""}
        `, `Your FundbyText login details are inside.`),
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
    timezone,
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
    timezone?: string | null;
    loginUrl: string;
    campaignUrl: string;
}) {
    const formattedGoal = goalAmount
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmount)
        : null;
    const formattedEnd = endDate
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: timezone ?? "America/New_York",
            month: "long", day: "numeric", year: "numeric",
          }).format(new Date(endDate))
        : null;
    const senderLine = orgDisplayName
        ? `${organizerName} from <strong style="color:${INK}">${orgDisplayName}</strong>`
        : `<strong style="color:${INK}">${organizerName}</strong>`;

    await transporter.sendMail({
        from,
        to,
        subject: `You're a participant in "${campaignName}" — here's how to get started`,
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">You're officially in! 🎉</h1>
            <p style="margin:0 0 22px;font-size:15px;color:${BODY};line-height:1.7">
                Hi ${firstName}, ${senderLine} has launched <strong style="color:${INK}">${campaignName}</strong> and added you as a participant.
                Your mission: reach out to donors and help hit the fundraising goal.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px">
              <tr>
                <td style="background:${CARD};border:1px solid ${LINE};border-radius:12px;padding:22px 24px">
                    ${label("Campaign")}
                    <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:${INK}">${campaignName}</p>
                    ${formattedGoal ? `
                    ${label("Fundraising Goal")}
                    <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:${BLUE}">${formattedGoal}</p>
                    ` : ""}
                    ${formattedEnd ? `
                    ${label("Campaign Ends")}
                    <p style="margin:0;font-size:15px;font-weight:600;color:${INK}">${formattedEnd}</p>
                    ` : ""}
                </td>
              </tr>
            </table>

            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:0.6px">How it works</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px">
              ${[
                ["1", "Open your personal participant dashboard using the button below."],
                ["2", "Add your donor contacts — friends, family, teammates."],
                ["3", "FundbyText helps you reach out via text, email, or a shareable link."],
                ["4", "Track your progress and contributions in real time."],
              ].map(([n, t]) => `
              <tr>
                <td width="34" valign="top" style="padding:0 12px 14px 0">
                  <div style="width:26px;height:26px;background:${BLUE};border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#ffffff">${n}</div>
                </td>
                <td style="padding:2px 0 14px;font-size:14px;color:${BODY};line-height:1.55">${t}</td>
              </tr>`).join("")}
            </table>

            ${button(loginUrl, "Access My Participant Dashboard")}

            <p style="margin:0 0 22px;text-align:center;font-size:13px;color:${FAINT}">
                Or view the public campaign page:<br>
                <a href="${campaignUrl}" style="color:${BLUE};text-decoration:none;font-weight:600;word-break:break-all">${campaignUrl}</a>
            </p>

            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7;border-top:1px solid ${LINE};padding-top:18px">
                This link is unique to you. Please don't share it with others.
            </p>
        `, `${organizerName} added you as a participant in ${campaignName}.`),
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
        ? `${organizerName} &mdash; <strong style="color:${INK}">${orgDisplayName}</strong>`
        : `<strong style="color:${INK}">${organizerName}</strong>`;

    await transporter.sendMail({
        from,
        to,
        subject: `Thank you for supporting ${campaignName}!`,
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Thank you, ${donorFirstName}! 🙏</h1>
            <p style="margin:0 0 22px;font-size:15px;color:${BODY};line-height:1.7">
                Your donation of <strong style="color:${GREEN}">${formattedAmount}</strong> to
                <strong style="color:${INK}">${campaignName}</strong> has been received. We truly appreciate your generosity.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px">
              <tr>
                <td style="background:${CARD};border-left:4px solid ${ORANGE};border-radius:0 10px 10px 0;padding:20px 24px">
                    <p style="margin:0 0 14px;font-size:15px;color:${INK};line-height:1.75">${thankYouMessage.replace(/\n/g, "<br>")}</p>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${INK}">With gratitude,</p>
                    <p style="margin:0;font-size:13px;color:${BODY}">${senderLine}</p>
                </td>
              </tr>
            </table>

            ${button(campaignUrl, "View Campaign", ORANGE)}

            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7;border-top:1px solid ${LINE};padding-top:18px;text-align:center">
                Your support makes a real difference. Share this campaign to help reach the goal!
            </p>
        `, `Thank you for your ${formattedAmount} donation to ${campaignName}.`),
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
    timezone,
    campaignUrl,
}: {
    to: string;
    firstName: string;
    campaignName: string;
    senderName: string;
    story?: string | null;
    goalAmount?: number | null;
    endDate?: string | null;
    timezone?: string | null;
    campaignUrl: string;
}) {
    const formattedGoal = goalAmount
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goalAmount)
        : null;
    const formattedEnd = endDate
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: timezone ?? "America/New_York",
            month: "long", day: "numeric", year: "numeric",
          }).format(new Date(endDate))
        : null;

    await transporter.sendMail({
        from,
        to,
        subject: `${senderName} is asking for your support — ${campaignName}`,
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">Hi ${firstName},</h1>
            <p style="margin:0 0 22px;font-size:15px;color:${BODY};line-height:1.7">
                <strong style="color:${INK}">${senderName}</strong> thought of you when sharing this fundraising campaign.
                Your contribution — no matter the size — makes a real difference.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px">
              <tr>
                <td style="background:linear-gradient(135deg,${BLUE} 0%,${NAVY} 100%);border-radius:12px;padding:26px 24px">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px">Fundraising Campaign</p>
                    <p style="margin:0 0 18px;font-size:21px;font-weight:800;color:#ffffff;line-height:1.3">${campaignName}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        ${formattedGoal ? `
                        <td style="padding-right:28px">
                          <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.5px">Goal</p>
                          <p style="margin:0;font-size:17px;font-weight:800;color:${GREEN}">${formattedGoal}</p>
                        </td>` : ""}
                        ${formattedEnd ? `
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.5px">Ends</p>
                          <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff">${formattedEnd}</p>
                        </td>` : ""}
                      </tr>
                    </table>
                </td>
              </tr>
            </table>

            ${story ? `
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:0.6px">About this campaign</p>
            <p style="margin:0 0 26px;font-size:15px;color:${BODY};line-height:1.75;border-left:3px solid ${LINE};padding-left:16px">
                ${story.length > 300 ? story.slice(0, 297) + "…" : story}
            </p>
            ` : ""}

            ${button(campaignUrl, "Support This Campaign", ORANGE)}

            <p style="margin:0 0 6px;text-align:center;font-size:13px;color:${FAINT}">Or copy this link into your browser:</p>
            <p style="margin:0 0 22px;text-align:center">
                <a href="${campaignUrl}" style="font-size:13px;color:${BLUE};text-decoration:none;word-break:break-all">${campaignUrl}</a>
            </p>

            <p style="margin:0;font-size:13px;color:${FAINT};line-height:1.7;border-top:1px solid ${LINE};padding-top:18px">
                You were added as a potential donor by ${senderName}. You're under no obligation to donate.
            </p>
        `, `${senderName} is asking for your support — ${campaignName}.`),
    });
}

// ── Contact form submission (sent to the site contact inbox) ─────────────────

export async function sendContactEmail({
    to,
    inquiryType,
    firstName,
    lastName,
    email,
    message,
}: {
    to: string;
    inquiryType: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}) {
    const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
    await transporter.sendMail({
        from,
        to,
        replyTo: `"${firstName} ${lastName}" <${email}>`,
        subject: `New contact form submission — ${inquiryType}`,
        html: emailLayout(`
            <h1 style="margin:0 0 8px;font-size:23px;font-weight:800;color:${NAVY};letter-spacing:-0.3px">New contact submission</h1>
            <p style="margin:0 0 24px;font-size:15px;color:${BODY};line-height:1.7">
                Someone reached out through the FundbyText contact form.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:12px;padding:22px 24px">
                ${label("Inquiry Type")}
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:${INK}">${esc(inquiryType)}</p>
                ${label("Name")}
                <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:${INK}">${esc(firstName)} ${esc(lastName)}</p>
                ${label("Email")}
                <p style="margin:0;font-size:16px;font-weight:600"><a href="mailto:${email}" style="color:${BLUE};text-decoration:none">${esc(email)}</a></p>
              </td></tr>
            </table>
            ${label("Message")}
            <p style="margin:0;font-size:15px;color:${INK};line-height:1.75;border-left:4px solid ${ORANGE};padding-left:16px;white-space:pre-wrap">${esc(message)}</p>
        `, `New ${inquiryType} message from ${firstName} ${lastName}.`),
    });
}
