/**
 * Retail Gift Aid notification letter templates.
 *
 * HMRC requires charities to notify donors annually (by 31 May) about the Gift Aid
 * claimed on proceeds from their donated goods. Donors have 28 days to opt out if
 * their circumstances have changed (e.g. insufficient tax paid, name change).
 *
 * This module provides both an HTML email template and data for PDF generation.
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://web-production-68151.up.railway.app";

export interface RetailGiftAidLetterData {
  contactName: string;
  contactAddress: string;
  charityName: string;
  charityAddress: string;
  charityNumber: string;
  charityPhone: string;
  claimReference: string;
  taxYearStart: string; // e.g. "6 April 2025"
  taxYearEnd: string; // e.g. "5 April 2026"
  totalProceeds: string; // formatted e.g. "£1,234.56"
  giftAidClaimed: string; // formatted e.g. "£308.64"
  donationCount: number;
  optOutToken: string;
  emailConsentToken: string;
  notificationDeadline: string; // e.g. "15 May 2026"
  hasEmail: boolean;
}

/**
 * Build HTML email for retail gift aid annual notification.
 * Compliant with HMRC simplified template (2024+).
 */
export function buildRetailGiftAidEmailHtml(
  data: RetailGiftAidLetterData
): string {
  const optOutUrl = `${APP_URL}/retail-gift-aid/opt-out/${data.optOutToken}`;
  const emailConsentUrl = `${APP_URL}/retail-gift-aid/email-consent/${data.emailConsentToken}`;
  const updateDetailsUrl = `${APP_URL}/retail-gift-aid/update-details/${data.optOutToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #7c3aed; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                Retail Gift Aid — Annual Notification
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                ${data.charityName} — Tax Year ${data.taxYearStart} to ${data.taxYearEnd}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Dear ${data.contactName},
              </p>

              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Thank you for donating goods to ${data.charityName}. Under the Retail Gift Aid scheme,
                we have acted as your agent in selling your donated items. This letter is to inform you
                of the Gift Aid we have claimed, or intend to claim, on the proceeds from the sale of
                your goods for the tax year ${data.taxYearStart} to ${data.taxYearEnd}.
              </p>

              <!-- Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ff; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total net proceeds from your donated goods</p>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 22px; font-weight: 700;">${data.totalProceeds}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Gift Aid claimed (25%)</p>
                          <p style="margin: 4px 0 0; color: #7c3aed; font-size: 22px; font-weight: 700;">${data.giftAidClaimed}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Number of donations</p>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.donationCount}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Claim Reference</p>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 14px; font-weight: 500; font-family: monospace;">${data.claimReference}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">Important — Please read</p>
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 13px; line-height: 1.5;">
                      If you have not paid enough Income Tax and/or Capital Gains Tax to cover the Gift Aid
                      claimed on all your donations (to all charities and Community Amateur Sports Clubs) in
                      the tax year, it is your responsibility to pay any difference.
                    </p>
                    <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                      <strong>You have until ${data.notificationDeadline}</strong> (28 days from this notification)
                      to opt out of this claim if you wish.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Opt Out Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${optOutUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                      I need to opt out of this claim
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #6B7280; font-size: 13px; text-align: center;">
                Only use this if you need to opt out. No action is needed if everything is correct.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr><td style="border-top: 1px solid #e5e7eb;"></td></tr>
              </table>

              <!-- Update Details Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">Has your name or address changed?</p>
                    <p style="margin: 0 0 12px; color: #1e3a5f; font-size: 13px; line-height: 1.5;">
                      If your name or address has changed since your Gift Aid declaration, please update
                      your details so your declaration remains valid. You do not need to opt out for this.
                    </p>
                    <a href="${updateDetailsUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Update my details
                    </a>
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">
                      You can also call us${data.charityPhone ? ` on ${data.charityPhone}` : ""} to update your details over the phone.
                    </p>
                  </td>
                </tr>
              </table>

              ${
                !data.hasEmail
                  ? ""
                  : `
              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr><td style="border-top: 1px solid #e5e7eb;"></td></tr>
              </table>

              <!-- Email Consent Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #115e59; font-size: 14px; font-weight: 600;">Go Paperless — Save the charity money</p>
                    <p style="margin: 0 0 12px; color: #134e4a; font-size: 13px; line-height: 1.5;">
                      Help us reduce printing and postage costs by approving email for future Gift Aid
                      notifications. Every penny saved goes directly to our charitable work.
                    </p>
                    <a href="${emailConsentUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Switch to email notifications
                    </a>
                  </td>
                </tr>
              </table>
              `
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px; color: #374151; font-size: 12px; font-weight: 600;">${data.charityName}</p>
              ${data.charityAddress ? `<p style="margin: 0 0 4px; color: #6B7280; font-size: 12px;">${data.charityAddress}</p>` : ""}
              ${data.charityNumber ? `<p style="margin: 0 0 8px; color: #6B7280; font-size: 12px;">Registered Charity No. ${data.charityNumber}</p>` : ""}
              <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
                This notification is sent in accordance with HMRC Retail Gift Aid requirements.
                If you believe you have received this in error, please contact the charity.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Build plain text version of the letter for PDF/postal use.
 */
export function buildRetailGiftAidLetterText(
  data: RetailGiftAidLetterData
): string {
  const optOutUrl = `${APP_URL}/retail-gift-aid/opt-out/${data.optOutToken}`;
  const emailConsentUrl = `${APP_URL}/retail-gift-aid/email-consent/${data.emailConsentToken}`;
  const updateDetailsUrl = `${APP_URL}/retail-gift-aid/update-details/${data.optOutToken}`;

  return `${data.charityName}
${data.charityAddress || ""}
${data.charityNumber ? `Registered Charity No. ${data.charityNumber}` : ""}

${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

${data.contactName}
${data.contactAddress || ""}

Dear ${data.contactName},

RETAIL GIFT AID — ANNUAL NOTIFICATION
Tax Year: ${data.taxYearStart} to ${data.taxYearEnd}
Claim Reference: ${data.claimReference}

Thank you for donating goods to ${data.charityName}. Under the Retail Gift Aid scheme, we have acted as your agent in selling your donated items. This letter is to inform you of the Gift Aid we have claimed, or intend to claim, on the proceeds from the sale of your goods for the tax year ${data.taxYearStart} to ${data.taxYearEnd}.

SUMMARY
Total net proceeds from your donated goods: ${data.totalProceeds}
Gift Aid claimed (25%): ${data.giftAidClaimed}
Number of donations: ${data.donationCount}

IMPORTANT INFORMATION
If you have not paid enough Income Tax and/or Capital Gains Tax to cover the Gift Aid claimed on all your donations (to all charities and Community Amateur Sports Clubs) in the tax year, it is your responsibility to pay any difference.

You have until ${data.notificationDeadline} (28 days from this notification) to opt out of this claim if you wish.

TO OPT OUT
Visit: ${optOutUrl}

Or contact us directly to let us know.

HAS YOUR NAME OR ADDRESS CHANGED?
If your name or address has changed, you do not need to opt out — simply update your details so your Gift Aid declaration remains valid.

Visit: ${updateDetailsUrl}

You can also call us${data.charityPhone ? ` on ${data.charityPhone}` : ""} to update your details over the phone.

GO PAPERLESS
Help us save on printing and postage costs by switching to email notifications for future Gift Aid claims. Every penny saved goes directly to our charitable work.

Visit: ${emailConsentUrl}

Yours sincerely,
${data.charityName}`;
}
