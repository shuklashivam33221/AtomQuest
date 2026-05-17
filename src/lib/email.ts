import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

// Cached test account to speed up subsequent test emails
let cachedTestAccount: nodemailer.TestAccount | null = null;

export async function sendEmail({ to, subject, body }: EmailPayload) {
  const isProductionSmtp = 
    process.env.SMTP_HOST && 
    process.env.SMTP_PORT && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  let transporter: nodemailer.Transporter;

  try {
    if (isProductionSmtp) {
      // 1. Real Inbox Delivery Mode (configured via .env)
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"AtomQuest Portal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0070f3; margin-top: 0;">AtomQuest Notification</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 16px; color: #333;">${body.replace(/\n/g, "<br/>")}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; margin-bottom: 0;">This is an automated notification from the AtomQuest Goal Setting & Tracking Portal.</p>
        </div>`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ [PRODUCTION EMAIL SENT] ID: ${info.messageId} To: ${to}`);
      return true;

    } else {
      // 2. Ethereal Sandbox Mode (Fallback when no .env credentials are provided)
      if (!cachedTestAccount) {
        cachedTestAccount = await nodemailer.createTestAccount();
      }

      transporter = nodemailer.createTransport({
        host: cachedTestAccount.smtp.host,
        port: cachedTestAccount.smtp.port,
        secure: cachedTestAccount.smtp.secure,
        auth: {
          user: cachedTestAccount.user,
          pass: cachedTestAccount.pass,
        },
      });

      const mailOptions = {
        from: `"AtomQuest Portal (Sandbox)" <${cachedTestAccount.user}>`,
        to,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0070f3; margin-top: 0;">AtomQuest Notification (Sandbox)</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 16px; color: #333;">${body.replace(/\n/g, "<br/>")}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; margin-bottom: 0;">This email was generated in a local sandbox mode for evaluation. Click the Ethereal link below to view it.</p>
        </div>`,
      };

      const info = await transporter.sendMail(mailOptions);
      const viewUrl = nodemailer.getTestMessageUrl(info);

      const border = "=".repeat(65);
      console.log(`\n${border}`);
      console.log(`✉️  [REAL EMAIL DISPATCHED IN SANDBOX]`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`-----------------------------------------------------------------`);
      console.log(`👉 VIEW RENDERED EMAIL HERE: ${viewUrl}`);
      console.log(`${border}\n`);

      return true;
    }
  } catch (error) {
    console.error("❌ Failed to dispatch email notification:", error);
    return false;
  }
}
