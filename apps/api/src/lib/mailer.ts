import { config } from "../config.js";

const MAILEROO_ENDPOINT = "https://smtp.maileroo.com/api/v2/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/** Auth flows (verification, password reset) send through this — Maileroo is the only email provider wired up. */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const res = await fetch(MAILEROO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.mailerooApiKey}`,
    },
    body: JSON.stringify({
      from: { address: config.mailFromEmail, display_name: config.mailFromName },
      to: [{ address: to }],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`maileroo send failed: ${res.status} ${body}`);
  }
}
