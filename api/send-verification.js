import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, firstName, verificationLink } = req.body;

  if (!email || !firstName || !verificationLink) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await resend.emails.send({
      from: "Omnidev <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Omnidev email address",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#0b0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0f;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="500" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid #1f1f1f;overflow:hidden;max-width:500px;width:100%;">
                    <tr>
                      <td style="background:#0d9488;padding:28px 32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">OmniDev</h1>
                        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Cryptocurrency Trading Platform</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 32px;">
                        <div style="text-align:center;margin-bottom:24px;">
                          <div style="width:64px;height:64px;background:rgba(13,148,136,0.15);border:2px solid #0d9488;border-radius:50%;display:inline-block;line-height:64px;">
                            <span style="font-size:28px;">✉️</span>
                          </div>
                        </div>
                        <h2 style="color:#fff;margin:0 0 12px;font-size:20px;font-weight:700;text-align:center;">Verify your email address</h2>
                        <p style="color:#9ca3af;margin:0 0 8px;font-size:15px;line-height:1.6;text-align:center;">
                          Hi <strong style="color:#fff;">${firstName}</strong>,
                        </p>
                        <p style="color:#9ca3af;margin:0 0 28px;font-size:14px;line-height:1.7;text-align:center;">
                          Welcome to Omnidev! Click the button below to verify your email and activate your account.
                        </p>
                        <div style="text-align:center;margin-bottom:28px;">
                          <a href="${verificationLink}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">
                            Verify Email Address
                          </a>
                        </div>
                        <p style="color:#6b7280;margin:0 0 10px;font-size:12px;text-align:center;">Or copy this link:</p>
                        <p style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:10px 14px;margin:0 0 28px;font-size:11px;color:#0d9488;word-break:break-all;text-align:center;">
                          ${verificationLink}
                        </p>
                        <hr style="border:none;border-top:1px solid #1f1f1f;margin:0 0 20px;" />
                        <p style="color:#4b5563;margin:0;font-size:12px;text-align:center;line-height:1.6;">
                          This link expires in 24 hours. If you didn't create an Omnidev account, ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0a0a0a;padding:20px 32px;text-align:center;border-top:1px solid #1f1f1f;">
                        <p style="color:#374151;margin:0;font-size:11px;">© ${new Date().getFullYear()} OmniDev. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
