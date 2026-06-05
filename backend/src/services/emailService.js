const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Configured SMTP
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
    console.log(`[SMTP] Configured with host: ${host}`);
  } else {
    // Ethereal Mock SMTP
    console.log("[SMTP] No credentials configured. Creating Ethereal test account...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[SMTP] Ethereal Test Account created: ${testAccount.user}`);
    } catch (err) {
      console.error("[SMTP] Failed to create Ethereal test account, email sending will be disabled.", err);
      transporter = null;
    }
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  try {
    const client = await getTransporter();
    if (!client) {
      console.warn(`[SMTP] Email to ${to} skipped because SMTP transporter is not initialized.`);
      return null;
    }

    const from = process.env.SMTP_FROM || '"Eğitim Koçu" <no-reply@egitimkocu.com>';
    
    const info = await client.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    console.log(`[SMTP] Email sent to ${to}: Message ID = ${info.messageId}`);
    
    // If Ethereal test account is used, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[SMTP] Email Preview URL (Ethereal): ${previewUrl}`);
    }
    
    return info;
  } catch (error) {
    console.error("[SMTP] Failed to send email:", error);
    return null;
  }
}

module.exports = {
  sendEmail
};
