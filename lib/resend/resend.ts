import { Resend } from "resend";

type RecoveryEmailInput = {
  email: string;
  invoiceId: string;
  amount: number;
  token: string;
};

export async function sendRecoveryEmail({
  email,
  invoiceId,
  amount,
  token,
}: RecoveryEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !from || !appUrl) {
    throw new Error("Resend configuration is incomplete");
  }

  const resend = new Resend(apiKey);
  const updateUrl = `${appUrl.replace(/\/$/, "")}/update-payment?token=${encodeURIComponent(token)}`;
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);

  return resend.emails.send({
    from,
    to: email,
    subject: "Action needed: update your payment method",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#10231c">
        <h1 style="font-size:28px">Let’s keep your service running</h1>
        <p>We couldn’t process your latest invoice for <strong>${formattedAmount}</strong>.</p>
        <p>Update your payment details securely and we’ll retry the payment right away.</p>
        <p><a href="${updateUrl}" style="display:inline-block;background:#164b35;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:700">Update payment details</a></p>
        <p style="font-size:12px;color:#64756c">Invoice reference: ${invoiceId}</p>
      </div>
    `,
  });
}
