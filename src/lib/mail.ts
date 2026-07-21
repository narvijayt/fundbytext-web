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
   These are the marketing site's real tokens, not email-only approximations —
   see globals.css and MarketingFooter.tsx. Satoshi is the site font; every mail
   client strips @font-face, so the stack falls through to Arial, which is what
   the site's own --font-sans token already names as its fallback. */
const NAVY = "#003060";    // primary brand — headings, footer band
const BLUE = "#0268c0";    // brand blue — links, accent panel, stat figures
const GREEN = "#28c45d";   // logo glyph, progress, positive figures
const ORANGE = "#f47435";  // the CTA colour — flat, as MarketingFooter uses it
const INK = "#2f3a45";     // body copy on light
const MUTED = "#7e8a96";   // secondary/supporting copy
const FAINT = "#aeb5bd";   // uppercase eyebrow captions
const SURFACE = "#f4f8f9"; // light panel fill / page background
const LINE = "#eaeef3";    // hairline borders
const RULE = "#d4dee7";    // stronger borders (pills, outlines)
const FONT = "Satoshi,Arial,Helvetica,sans-serif";

/* Names, campaign titles and stories are user input interpolated into HTML, so
   everything that isn't a hard-coded literal goes through this. */
function esc(value: string | number | null | undefined): string {
    if (value == null) return "";
    return String(value).replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
    ));
}

// ── Building blocks ────────────────────────────────────────────────────────

/** Small uppercase caption — the site's eyebrow: 900 weight, +1px tracking. */
function eyebrow(text: string): string {
    return `<p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:900;color:${FAINT};text-transform:uppercase;letter-spacing:1px;line-height:1">${esc(text)}</p>`;
}

/** Page heading — the site sets headings in 900 with negative tracking. */
function heading(html: string): string {
    return `<h1 class="fbt-h1" style="margin:0 0 12px;font-family:${FONT};font-size:26px;font-weight:900;color:${NAVY};letter-spacing:-0.8px;line-height:1.2;mso-line-height-rule:exactly">${html}</h1>`;
}

/** Body paragraph. */
function para(html: string, marginBottom = 24): string {
    return `<p style="margin:0 0 ${marginBottom}px;font-family:${FONT};font-size:16px;color:${INK};line-height:1.6;mso-line-height-rule:exactly">${html}</p>`;
}

/** Quiet supporting note — the closing line of most emails. */
function note(html: string, opts: { top?: boolean; center?: boolean } = {}): string {
    const border = opts.top ? `border-top:1px solid ${LINE};padding-top:20px;` : "";
    const align = opts.center ? "text-align:center;" : "";
    return `<p style="margin:0;${border}${align}font-family:${FONT};font-size:14px;color:${MUTED};line-height:1.6;mso-line-height-rule:exactly">${html}</p>`;
}

/** Emphasis inside body copy — the site's navy-on-light treatment. */
function strong(text: string): string {
    return `<strong style="color:${NAVY};font-weight:900">${esc(text)}</strong>`;
}

/**
 * Primary call to action. Flat orange, 12px radius, 900/12px/+1px uppercase —
 * the exact treatment of the marketing footer's CTA. The VML block gives
 * Outlook the same rounded filled button instead of a square one.
 */
function button(href: string, text: string, bg: string = ORANGE): string {
    const url = esc(href); // hrefs are attribute values — an unescaped & is invalid markup
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:4px 0 24px">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:52px;v-text-anchor:middle;width:300px" arcsize="24%" stroke="f" fillcolor="${bg}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${text}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" style="display:inline-block;padding:18px 34px;background:${bg};color:#ffffff;text-decoration:none;border-radius:12px;font-family:${FONT};font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;line-height:1;mso-line-height-rule:exactly">${text}</a>
        <!--<![endif]-->
    </td></tr></table>`;
}

/** Light panel grouping details — credentials, campaign facts, a message. */
function panel(inner: string, opts: { accent?: string; marginBottom?: number } = {}): string {
    const { accent, marginBottom = 28 } = opts;
    const accentEdge = accent ? `border-left:4px solid ${accent};` : "";
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 ${marginBottom}px"><tr>
        <td style="background:${SURFACE};border:1px solid ${LINE};${accentEdge}border-radius:16px;padding:24px 26px">${inner}</td>
    </tr></table>`;
}

/** Eyebrow caption stacked above a value — the panel's basic unit. */
function field(labelText: string, valueHtml: string, last = false): string {
    return `${eyebrow(labelText)}<p style="margin:0 0 ${last ? 0 : 20}px;font-family:${FONT};font-size:17px;font-weight:900;color:${NAVY};line-height:1.35;word-break:break-word">${valueHtml}</p>`;
}

/** "Or paste this link" fallback, for clients that mangle the button. */
function linkFallback(url: string, lead = "Or paste this link into your browser:"): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px"><tr><td align="center">
        <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;color:${MUTED};line-height:1.5">${lead}</p>
        <a href="${esc(url)}" style="font-family:${FONT};font-size:13px;color:${BLUE};text-decoration:none;word-break:break-all">${esc(url)}</a>
    </td></tr></table>`;
}

// ── Shared layout ──────────────────────────────────────────────────────────

/**
 * One white card — logo header, content, navy footer band — mirroring the
 * marketing site, which sets its footer as a navy section beneath white cards.
 */
function emailLayout(body: string, preheader = ""): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>FundbyText</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
    @media only screen and (max-width:620px){
      .fbt-shell{padding:20px 12px !important}
      .fbt-pad{padding-left:24px !important;padding-right:24px !important}
      .fbt-h1{font-size:23px !important}
      .fbt-stack{display:block !important;width:100% !important;padding:0 0 18px 0 !important}
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background:${SURFACE};font-family:${FONT};-webkit-font-smoothing:antialiased">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;color:${SURFACE};font-size:1px;line-height:1px">${esc(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE}">
    <tr><td align="center" class="fbt-shell" style="padding:40px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;box-shadow:0 12px 32px -16px rgba(0,91,172,0.22)">

        <!-- Header -->
        <tr>
          <td class="fbt-pad" style="padding:28px 40px;border-bottom:1px solid ${LINE}">
            <a href="${APP_URL}" style="text-decoration:none">
              <img src="${APP_URL}/assets/email/logo-navy.png" alt="FundbyText" width="153" height="30" style="width:153px;height:30px;display:block">
            </a>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td class="fbt-pad" style="padding:36px 40px 34px">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="fbt-pad" style="padding:32px 40px;background:${NAVY};border-radius:0 0 24px 24px">
            <img src="${APP_URL}/assets/email/logo.png" alt="FundbyText" width="140" height="27" style="width:140px;height:27px;display:block">
            <p style="margin:14px 0 20px;font-family:${FONT};font-size:15px;color:#c3d2df;line-height:1.5">
              Start Your FundbyText Campaign Today.
            </p>
            <p style="margin:0;font-family:${FONT};font-size:13px;color:#99adc0;line-height:1.9">
              &copy; FundbyText ${year} — All Rights Reserved.<br>
              <a href="${APP_URL}/privacy" style="color:#99adc0;text-decoration:none">Privacy.</a>&nbsp;
              <a href="${APP_URL}/terms" style="color:#99adc0;text-decoration:none">Terms &amp; Conditions.</a>&nbsp;
              <a href="${APP_URL}/cookies" style="color:#99adc0;text-decoration:none">Cookies.</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Every message ships a plain-text alternative — better deliverability, and
    it's what a legitimate sender looks like to a spam filter. */
function plain(lines: string[]): string {
    return `${lines.join("\n")}\n\n—\nFundbyText — Start Your FundbyText Campaign Today.\n${APP_URL}`;
}

// ── Formatters ─────────────────────────────────────────────────────────────

const usd = (n: number, maxFractionDigits = 0) =>
    new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: maxFractionDigits,
    }).format(n);

const longDate = (date: string, timezone?: string | null) =>
    new Intl.DateTimeFormat("en-US", {
        timeZone: timezone ?? "America/New_York",
        month: "long", day: "numeric", year: "numeric",
    }).format(new Date(date));

// ── Account: welcome / set password ────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string, setPasswordUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Welcome to FundbyText — set your password",
        text: plain([
            `Welcome aboard, ${firstName}.`,
            ``,
            `Your campaign has been created and your account is ready. Set a password so you can log back in any time to manage it.`,
            ``,
            `Set your password: ${setPasswordUrl}`,
            ``,
            `This link expires in 24 hours. If you didn't start a campaign on FundbyText, you can ignore this email.`,
        ]),
        html: emailLayout(`
            ${eyebrow("Welcome")}
            ${heading(`Welcome aboard, ${esc(firstName)}`)}
            ${para(`Your campaign has been created and your account is ready. Set a password so you can log back in any time to manage it.`)}
            ${button(setPasswordUrl, "Set My Password")}
            ${note(`This link expires in 24 hours. If you didn't start a campaign on FundbyText, you can safely ignore this email.`, { top: true })}
        `, "Set your password to finish setting up your FundbyText account."),
    });
}

// ── Account: password reset ────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Reset your FundbyText password",
        text: plain([
            `Reset your password`,
            ``,
            `Use the link below to choose a new password. For your security it expires in 1 hour.`,
            ``,
            `${resetUrl}`,
            ``,
            `Didn't request this? You can ignore this email — your password won't change.`,
        ]),
        html: emailLayout(`
            ${eyebrow("Account security")}
            ${heading("Reset your password")}
            ${para(`Choose a new password using the button below. For your security, this link expires in ${strong("1 hour")}.`)}
            ${button(resetUrl, "Reset Password")}
            ${linkFallback(resetUrl)}
            ${note(`Didn't request this? You can safely ignore this email — your password won't change.`, { top: true })}
        `, "Reset your FundbyText password (link expires in 1 hour)."),
    });
}

// ── Account: verify email ──────────────────────────────────────────────────

export async function sendEmailVerificationEmail(to: string, firstName: string, verifyUrl: string) {
    await transporter.sendMail({
        from,
        to,
        subject: "Verify your FundbyText email address",
        text: plain([
            `Verify your email, ${firstName}`,
            ``,
            `Confirm that ${to} is your email address so we can keep your account secure and reach you about your campaigns.`,
            ``,
            `${verifyUrl}`,
            ``,
            `This link expires in 24 hours. Didn't request this? You can ignore this email.`,
        ]),
        html: emailLayout(`
            ${eyebrow("Confirm your address")}
            ${heading(`Verify your email, ${esc(firstName)}`)}
            ${para(`Confirm that ${strong(to)} is your email address so we can keep your account secure and reach you about your campaigns. This link expires in ${strong("24 hours")}.`)}
            ${button(verifyUrl, "Verify My Email")}
            ${linkFallback(verifyUrl)}
            ${note(`Didn't request this? You can safely ignore this email — nothing will change.`, { top: true })}
        `, "Verify your FundbyText email address (link expires in 24 hours)."),
    });
}

// ── Participant credentials (campaign launch — email 1 of 2) ───────────────

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
        text: plain([
            `Hi ${firstName},`,
            ``,
            `Here are your login details for FundbyText. Keep this email somewhere safe.`,
            ``,
            `Email: ${to}`,
            password ? `Password: ${password}` : `Password: use your existing FundbyText password.`,
            ``,
            `Log in: ${loginUrl}`,
            ...(password ? [``, `You can change this password any time from your account settings.`] : []),
        ]),
        html: emailLayout(`
            ${eyebrow("Your account")}
            ${heading(`Hi ${esc(firstName)}, you're all set`)}
            ${para(`Here are your login details for FundbyText. Keep this email somewhere safe.`)}

            ${panel(`
                ${field("Email", esc(to))}
                ${eyebrow("Password")}
                ${password
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#ffffff;border:1px dashed ${RULE};border-radius:10px;padding:12px 18px">
                         <span style="font-family:'SF Mono',Consolas,Menlo,monospace;font-size:20px;font-weight:700;color:${NAVY};letter-spacing:3px">${esc(password)}</span>
                       </td></tr></table>`
                    : `<p style="margin:0;font-family:${FONT};font-size:16px;color:${INK};line-height:1.5">Use your existing FundbyText password.</p>`
                }
            `)}

            ${button(loginUrl, "Log In to FundbyText")}

            ${note(password
                ? `For your security, you can change this password any time from your account settings.`
                : `Forgotten your password? You can reset it from the login page.`, { top: true })}
        `, "Your FundbyText login details are inside."),
    });
}

// ── Participant invite (campaign launch — email 2 of 2) ────────────────────

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
    const formattedGoal = goalAmount ? usd(goalAmount) : null;
    const formattedEnd = endDate ? longDate(endDate, timezone) : null;
    const senderLine = orgDisplayName
        ? `${esc(organizerName)} from ${strong(orgDisplayName)}`
        : strong(organizerName);

    const steps: [string, string][] = [
        ["1", "Open your personal participant dashboard using the button below."],
        ["2", "Add your donor contacts — friends, family, teammates."],
        ["3", "FundbyText helps you reach out by text, email, or a shareable link."],
        ["4", "Track your progress and contributions in real time."],
    ];

    await transporter.sendMail({
        from,
        to,
        subject: `You're a participant in "${campaignName}" — here's how to start`,
        text: plain([
            `Hi ${firstName}, you're officially in.`,
            ``,
            `${organizerName}${orgDisplayName ? ` from ${orgDisplayName}` : ""} has launched "${campaignName}" and added you as a participant.`,
            ``,
            `Campaign: ${campaignName}`,
            ...(formattedGoal ? [`Goal: ${formattedGoal}`] : []),
            ...(formattedEnd ? [`Ends: ${formattedEnd}`] : []),
            ``,
            `How it works:`,
            ...steps.map(([n, t]) => `  ${n}. ${t}`),
            ``,
            `Your dashboard: ${loginUrl}`,
            `Campaign page: ${campaignUrl}`,
            ``,
            `This link is unique to you — please don't share it.`,
        ]),
        html: emailLayout(`
            ${eyebrow("Campaign invitation")}
            ${heading("You're officially in")}
            ${para(`Hi ${esc(firstName)}, ${senderLine} has launched ${strong(campaignName)} and added you as a participant. Your mission: reach out to donors and help hit the goal.`)}

            ${panel(`
                ${field("Campaign", esc(campaignName), !formattedGoal && !formattedEnd)}
                ${formattedGoal ? `${eyebrow("Fundraising goal")}<p style="margin:0 0 ${formattedEnd ? 20 : 0}px;font-family:${FONT};font-size:26px;font-weight:900;color:${BLUE};line-height:1.1;letter-spacing:-0.5px">${formattedGoal}</p>` : ""}
                ${formattedEnd ? field("Campaign ends", formattedEnd, true) : ""}
            `)}

            ${eyebrow("How it works")}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0 28px">
              ${steps.map(([n, t]) => `
              <tr>
                <td width="40" valign="top" style="padding:0 14px 16px 0">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:${BLUE};border-radius:13px;font-family:${FONT};font-size:12px;font-weight:900;color:#ffffff;line-height:26px;mso-line-height-rule:exactly">${n}</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:3px 0 16px;font-family:${FONT};font-size:15px;color:${INK};line-height:1.5">${t}</td>
              </tr>`).join("")}
            </table>

            ${button(loginUrl, "Open My Dashboard")}
            ${linkFallback(campaignUrl, "Or view the public campaign page:")}

            ${note(`This link is unique to you. Please don't share it with others.`, { top: true })}
        `, `${organizerName} added you as a participant in ${campaignName}.`),
    });
}

// ── Donor thank-you (after a completed donation) ───────────────────────────

export async function sendDonorThankYouEmail({
    to,
    donorFirstName,
    campaignName,
    campaignUrl,
    amount,
    signerName,
    signerPhotoUrl,
    orgDisplayName,
    thankYouMessage,
}: {
    to: string;
    donorFirstName: string;
    campaignName: string;
    campaignUrl: string;
    amount: number;
    signerName: string;
    signerPhotoUrl?: string | null;
    orgDisplayName?: string | null;
    thankYouMessage: string;
}) {
    const formattedAmount = usd(amount, 2);

    // Sign-off avatar: the signer's photo, or their initials on a soft chip.
    const initials = signerName.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const avatarCell = signerPhotoUrl
        ? `<img src="${esc(signerPhotoUrl)}" width="44" height="44" alt="" style="width:44px;height:44px;border-radius:22px;object-fit:cover;display:block;border:1px solid ${LINE}">`
        : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
             <td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;background:#ffffff;border:1px solid ${RULE};border-radius:22px;font-family:${FONT};font-size:15px;font-weight:900;color:${NAVY};line-height:44px;mso-line-height-rule:exactly">${esc(initials)}</td>
           </tr></table>`;

    await transporter.sendMail({
        from,
        to,
        subject: `Thank you for supporting ${campaignName}`,
        text: plain([
            `Thank you, ${donorFirstName}.`,
            ``,
            `Your donation of ${formattedAmount} to "${campaignName}" has been received.`,
            ``,
            thankYouMessage,
            ``,
            `With gratitude,`,
            `${signerName}${orgDisplayName ? `\n${orgDisplayName}` : ""}`,
            ``,
            `View the campaign: ${campaignUrl}`,
        ]),
        html: emailLayout(`
            ${eyebrow("Donation received")}
            ${heading(`Thank you, ${esc(donorFirstName)}`)}
            ${para(`Your donation to ${strong(campaignName)} has been received. We truly appreciate your generosity.`)}

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px"><tr>
              <td align="center" style="background:${SURFACE};border:1px solid ${LINE};border-radius:16px;padding:26px 24px">
                ${eyebrow("Your contribution")}
                <p style="margin:0;font-family:${FONT};font-size:38px;font-weight:900;color:${GREEN};line-height:1.1;letter-spacing:-1px">${formattedAmount}</p>
              </td>
            </tr></table>

            ${panel(`
                <p style="margin:0 0 18px;font-family:${FONT};font-size:16px;color:${INK};line-height:1.65;mso-line-height-rule:exactly">${esc(thankYouMessage).replace(/\n/g, "<br>")}</p>
                ${eyebrow("With gratitude")}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px"><tr>
                    <td valign="middle" style="padding-right:12px">${avatarCell}</td>
                    <td valign="middle">
                        <p style="margin:0;font-family:${FONT};font-size:15px;font-weight:900;color:${NAVY};line-height:1.3">${esc(signerName)}</p>
                        ${orgDisplayName ? `<p style="margin:2px 0 0;font-family:${FONT};font-size:14px;color:${MUTED};line-height:1.4">${esc(orgDisplayName)}</p>` : ""}
                    </td>
                </tr></table>
            `, { accent: ORANGE })}

            ${button(campaignUrl, "View Campaign")}

            ${note(`Your support makes a real difference — share this campaign to help it reach the goal.`, { top: true, center: true })}
        `, `Thank you for your ${formattedAmount} donation to ${campaignName}.`),
    });
}

// ── Donor invite (when a donor contact is added to a campaign) ─────────────

export async function sendDonorInviteEmail({
    to,
    firstName,
    campaignName,
    senderName,
    story,
    goalAmount,
    suggestedAmount,
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
    suggestedAmount?: number | null;
    endDate?: string | null;
    timezone?: string | null;
    campaignUrl: string;
}) {
    const formattedGoal = goalAmount ? usd(goalAmount) : null;
    const formattedSuggested = suggestedAmount != null && suggestedAmount > 0 ? usd(suggestedAmount, 2) : null;
    const formattedEnd = endDate ? longDate(endDate, timezone) : null;
    const trimmedStory = story ? (story.length > 300 ? `${story.slice(0, 297)}…` : story) : null;

    await transporter.sendMail({
        from,
        to,
        subject: `${senderName} is asking for your support — ${campaignName}`,
        text: plain([
            `Hi ${firstName},`,
            ``,
            `${senderName} thought of you when sharing this fundraising campaign. Your contribution — no matter the size — makes a real difference.`,
            ``,
            `Campaign: ${campaignName}`,
            ...(formattedGoal ? [`Goal: ${formattedGoal}`] : []),
            ...(formattedEnd ? [`Ends: ${formattedEnd}`] : []),
            ...(trimmedStory ? [``, `About this campaign:`, trimmedStory] : []),
            ...(formattedSuggested ? [``, `Suggested amount: ${formattedSuggested} (you can change it)`] : []),
            ``,
            `Support this campaign: ${campaignUrl}`,
            ``,
            `You were added as a potential donor by ${senderName}. You're under no obligation to donate.`,
        ]),
        html: emailLayout(`
            ${eyebrow("An invitation to give")}
            ${heading(`Hi ${esc(firstName)}, you've been asked to help`)}
            ${para(`${strong(senderName)} thought of you when sharing this fundraising campaign. Your contribution — no matter the size — makes a real difference.`)}

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px"><tr>
              <td style="background:${BLUE};border-radius:16px;padding:28px 26px">
                <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:900;color:#a9cdee;text-transform:uppercase;letter-spacing:1px;line-height:1">Fundraising campaign</p>
                <p style="margin:0 0 ${formattedGoal || formattedEnd ? 22 : 0}px;font-family:${FONT};font-size:24px;font-weight:900;color:#ffffff;line-height:1.25;letter-spacing:-0.5px">${esc(campaignName)}</p>
                ${formattedGoal || formattedEnd ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  ${formattedGoal ? `
                  <td class="fbt-stack" valign="top" style="padding-right:28px">
                    <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:900;color:#a9cdee;text-transform:uppercase;letter-spacing:1px;line-height:1">Goal</p>
                    <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:900;color:${GREEN};line-height:1.2">${formattedGoal}</p>
                  </td>` : ""}
                  ${formattedEnd ? `
                  <td class="fbt-stack" valign="top">
                    <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:900;color:#a9cdee;text-transform:uppercase;letter-spacing:1px;line-height:1">Ends</p>
                    <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:900;color:#ffffff;line-height:1.2">${formattedEnd}</p>
                  </td>` : ""}
                </tr></table>` : ""}
              </td>
            </tr></table>

            ${trimmedStory ? `
            ${eyebrow("About this campaign")}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0 28px"><tr>
              <td style="border-left:3px solid ${RULE};padding:2px 0 2px 18px;font-family:${FONT};font-size:16px;color:${INK};line-height:1.65;mso-line-height-rule:exactly">${esc(trimmedStory)}</td>
            </tr></table>` : ""}

            ${formattedSuggested ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px"><tr>
              <td align="center" style="background:${SURFACE};border:1px solid ${RULE};border-radius:16px;padding:22px 24px">
                ${eyebrow("Suggested amount")}
                <p style="margin:0 0 6px;font-family:${FONT};font-size:32px;font-weight:900;color:${NAVY};line-height:1.1;letter-spacing:-1px">${formattedSuggested}</p>
                <p style="margin:0;font-family:${FONT};font-size:13px;color:${MUTED};line-height:1.5">Pre-filled when you donate — you can change it.</p>
              </td>
            </tr></table>` : ""}

            ${button(campaignUrl, "Support This Campaign")}
            ${linkFallback(campaignUrl)}

            ${note(`You were added as a potential donor by ${esc(senderName)}. You're under no obligation to donate.`, { top: true })}
        `, `${senderName} is asking for your support — ${campaignName}.`),
    });
}

// ── Contact form submission (to the site contact inbox) ────────────────────

export async function sendContactEmail({
    to,
    cc,
    bcc,
    inquiryType,
    firstName,
    lastName,
    email,
    message,
}: {
    /** One or many addresses — the recipient lists are admin-configurable. */
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    inquiryType: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}) {
    // Omit cc/bcc entirely when empty — nodemailer treats [] as "no header",
    // but leaving them undefined keeps the sent message cleaner.
    const hasCc = Array.isArray(cc) ? cc.length > 0 : Boolean(cc);
    const hasBcc = Array.isArray(bcc) ? bcc.length > 0 : Boolean(bcc);
    await transporter.sendMail({
        from,
        to,
        ...(hasCc ? { cc } : {}),
        ...(hasBcc ? { bcc } : {}),
        replyTo: `"${firstName} ${lastName}" <${email}>`,
        subject: `New contact form submission — ${inquiryType}`,
        text: plain([
            `New contact submission`,
            ``,
            `Inquiry type: ${inquiryType}`,
            `Name: ${firstName} ${lastName}`,
            `Email: ${email}`,
            ``,
            `Message:`,
            message,
        ]),
        html: emailLayout(`
            ${eyebrow("Contact form")}
            ${heading("New contact submission")}
            ${para(`Someone reached out through the FundbyText contact form. Reply directly to this email to respond to them.`)}

            ${panel(`
                ${field("Inquiry type", esc(inquiryType))}
                ${field("Name", `${esc(firstName)} ${esc(lastName)}`)}
                ${field("Email", `<a href="mailto:${esc(email)}" style="color:${BLUE};text-decoration:none">${esc(email)}</a>`, true)}
            `)}

            ${eyebrow("Message")}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0 0"><tr>
              <td style="border-left:4px solid ${ORANGE};padding:2px 0 2px 18px;font-family:${FONT};font-size:16px;color:${INK};line-height:1.65;white-space:pre-wrap;mso-line-height-rule:exactly">${esc(message)}</td>
            </tr></table>
        `, `New ${inquiryType} message from ${firstName} ${lastName}.`),
    });
}
