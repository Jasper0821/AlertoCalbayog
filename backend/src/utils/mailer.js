const nodemailer = require("nodemailer");
const path = require("path");

let transporterInstance = null;

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

async function createTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASS?.replace(/\s+/g, "").trim();

  if (
    gmailUser &&
    gmailPass &&
    gmailUser !== "your_gmail@gmail.com" &&
    gmailPass !== "your_16_char_app_password" &&
    gmailPass !== ""
  ) {
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      authMethod: "LOGIN",
      tls: {
        rejectUnauthorized: false,
      },
      logger: false,
      debug: false,
    });

    await transporterInstance.verify();
    console.log("\n📧  [Mailer] Gmail SMTP verified and ready to send emails.");
    return transporterInstance;
  }

  throw new Error("Gmail SMTP credentials are not configured or invalid. Set GMAIL_USER and GMAIL_APP_PASS in backend/.env.");
}

async function sendOtpEmail(toEmail, otpCode, expiryMinutes = 7) {
  const recipient = toEmail?.toString().trim().toLowerCase();
  if (!recipient) {
    throw new Error("Invalid recipient email address.");
  }

  const transporter = await createTransporter();
  const fromAddress = process.env.GMAIL_USER?.trim() || "noreply@alertocalbayog.local";
  const brandedPasswordResetEmail = {
    subject: "Your Alerto Calbayog password reset code",
    text: `Hello,\n\nWe received a request to reset your Alerto Calbayog password. Your verification code is: ${otpCode}\n\nThis code expires in ${expiryMinutes} minutes. If you did not request a password reset, you can safely ignore this email.\n\nAlerto Calbayog Emergency Response System\nCalbayog City`,
    html: `
      <div style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Inter,'Segoe UI',Arial,sans-serif;color:#1e293b;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;border-collapse:separate;overflow:hidden;border-radius:18px;background:#ffffff;box-shadow:0 12px 30px rgba(15,23,42,.12);">
          <tr>
            <td align="center" style="padding:30px 32px 24px;background:linear-gradient(135deg,#0f172a 0%,#0f766e 100%);">
              <img src="cid:alerto-calbayog-logo" width="92" height="92" alt="Alerto Calbayog" style="display:block;width:92px;height:92px;object-fit:contain;margin:0 auto 14px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-.4px;">Alerto Calbayog</h1>
              <p style="margin:7px 0 0;color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Password recovery</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">We received a request to reset your password. Use the verification code below to continue.</p>
              <div style="margin:0 0 22px;padding:20px;border:1px solid #99f6e4;border-radius:12px;background:#f0fdfa;text-align:center;">
                <p style="margin:0 0 8px;color:#0f766e;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Verification code</p>
                <p style="margin:0;color:#0f172a;font-size:36px;font-weight:900;letter-spacing:9px;line-height:1;">${otpCode}</p>
              </div>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.55;color:#475569;">This code expires in <strong style="color:#0f766e;">${expiryMinutes} minutes</strong>.</p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:#64748b;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:11px;line-height:1.5;">Alerto Calbayog Emergency Response System<br />Calbayog City, Philippines</p>
            </td>
          </tr>
        </table>
      </div>
    `,
    attachments: [{
      filename: "alerto-calbayog-logo.png",
      path: path.resolve(__dirname, "../../../web/public/logo.png"),
      cid: "alerto-calbayog-logo",
    }],
  };

  const mailOptions = {
    from: `"AlertoCalbayog" <${fromAddress}>`,
    to: recipient,
    replyTo: fromAddress,
    subject: "🔐 Your AlerteCalbayog Password Reset Code",
    text: `Your password reset code is: ${otpCode}\n\nThis code expires in 5 minutes. If you did not request a password reset, please ignore this email.`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f4f7fc;padding:32px 16px;">
        <div style="background:#fff;border-radius:16px;padding:36px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;background:#0a1e3f;width:56px;height:56px;border-radius:14px;margin-bottom:12px;">
              <span style="font-size:28px;">🛡️</span>
            </div>
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#0a1e3f;letter-spacing:-0.5px;">AlertoCalbayog</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Password Recovery</p>
          </div>

          <p style="font-size:14px;color:#334155;margin:0 0 20px;">
            We received a request to reset your password. Use the code below — it expires in <strong>5 minutes</strong>.
          </p>

          <div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Your OTP Code</p>
            <span style="font-size:40px;font-weight:900;color:#0a1e3f;letter-spacing:10px;">${otpCode}</span>
          </div>

          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
            If you did not request this, please ignore this email.<br/>
            This code will expire automatically after 5 minutes.
          </p>

          <div style="border-top:1px solid #e2e8f0;margin-top:28px;padding-top:16px;text-align:center;">
            <p style="font-size:11px;color:#cbd5e1;margin:0;">AlertoCalbayog Emergency Response System · Calbayog City</p>
          </div>
        </div>
      </div>
    `,
    ...brandedPasswordResetEmail,
    headers: {
      "X-Mailer": "AlertoCalbayog Mailer",
    },
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("\n⚠️  [Mailer] Failed to send OTP email to", recipient, "-", err.message || err);
    throw err;
  }

  if (info.rejected?.length) {
    console.error(`\n⚠️  [Mailer] SMTP rejected recipient(s): ${info.rejected.join(", ")}`);
    throw new Error(`Failed to deliver OTP email to ${recipient}.`);
  }

  console.log(`\n✅  [OTP] Code for ${recipient}: ${otpCode}`);
  console.log(`   MessageId: ${info.messageId}`);
  console.log(`   Accepted: ${JSON.stringify(info.accepted)}`);
  console.log(`   Rejected: ${JSON.stringify(info.rejected)}`);
  console.log(`   Response: ${info.response}`);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📬  [Ethereal Preview] View email at: ${previewUrl}\n`);
  }

  return info;
}

async function sendRegistrationOtpEmail(toEmail, otpCode, expiryMinutes = 7) {
  const recipient = toEmail?.toString().trim().toLowerCase();
  if (!recipient) throw new Error("Invalid recipient email address.");

  const transporter = await createTransporter();
  const fromAddress = process.env.GMAIL_USER?.trim() || "noreply@alertocalbayog.local";

  try {
    const info = await transporter.sendMail({
      from: `"Alerto Calbayog" <${fromAddress}>`,
      to: recipient,
      subject: "Verify your Alerto Calbayog Gmail address",
      text: `Your Alerto Calbayog registration code is: ${otpCode}. This code expires in ${expiryMinutes} minutes. If you did not start registration, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2>Verify your Gmail address</h2><p>Use this code to finish creating your Alerto Calbayog account:</p><p style="font-size:32px;font-weight:700;letter-spacing:7px">${otpCode}</p><p>This code expires in ${expiryMinutes} minutes.</p></div>`,
    });
    if (info.rejected?.length) {
      throw new Error("The Gmail server rejected this recipient address.");
    }
  } catch (error) {
    console.error("[Registration OTP] Failed to send email to", recipient, "-", error.message || error);
    throw new Error("Unable to verify this Gmail address. Please check the address and try again.");
  }
}

async function sendResponderApprovalEmail(toEmail, fullName) {
  const recipient = toEmail?.toString().trim().toLowerCase();
  if (!recipient) {
    throw new Error("Invalid recipient email address.");
  }

  const transporter = await createTransporter();
  const fromAddress = process.env.GMAIL_USER?.trim() || "noreply@alertocalbayog.local";
  const responderName = fullName?.toString().trim() || "Responder";
  const safeResponderName = escapeHtml(responderName);

  const info = await transporter.sendMail({
    from: `"AlertoCalbayog" <${fromAddress}>`,
    to: recipient,
    replyTo: fromAddress,
    subject: "Your AlertoCalbayog responder account has been approved",
    text: `Hello ${responderName},\n\nYour responder registration has been approved. Your AlertoCalbayog account is now active and available for login.\n\nYou can sign in using the email address and password you registered with.\n\nAlertoCalbayog Emergency Response System\nCalbayog City`,
    html: `
      <div style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Inter,'Segoe UI',Arial,sans-serif;color:#1e293b;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;border-collapse:separate;overflow:hidden;border-radius:18px;background:#ffffff;box-shadow:0 12px 30px rgba(15,23,42,.12);">
          <tr>
            <td align="center" style="padding:30px 32px 24px;background:linear-gradient(135deg,#0f172a 0%,#0f766e 100%);">
              <img src="cid:alerto-calbayog-logo" width="92" height="92" alt="Alerto Calbayog" style="display:block;width:92px;height:92px;object-fit:contain;margin:0 auto 14px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-.4px;">Alerto Calbayog</h1>
              <p style="margin:7px 0 0;color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Emergency Response System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="display:inline-block;margin:0 0 18px;padding:6px 11px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;">Account approved</div>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hello ${safeResponderName},</p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#334155;">Your responder registration has been approved. Your Alerto Calbayog account is now active and ready to use.</p>
              <div style="margin:0 0 24px;padding:18px;border:1px solid #99f6e4;border-radius:12px;background:#f0fdfa;">
                <p style="margin:0 0 5px;color:#0f766e;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;">You can now sign in</p>
                <p style="margin:0;color:#334155;font-size:13px;line-height:1.55;">Use the email address and password you entered during registration to access your responder account.</p>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#64748b;">Thank you for helping keep Calbayog City safe and prepared.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:11px;line-height:1.5;">Alerto Calbayog Emergency Response System<br />Calbayog City, Philippines</p>
            </td>
          </tr>
        </table>
      </div>
    `,
    attachments: [{
      filename: "alerto-calbayog-logo.png",
      path: path.resolve(__dirname, "../../../web/public/logo.png"),
      cid: "alerto-calbayog-logo",
    }],
    headers: { "X-Mailer": "AlertoCalbayog Mailer" },
  });

  if (info.rejected?.length) {
    throw new Error(`Failed to deliver approval email to ${recipient}.`);
  }

  console.log(`[Approval email] Sent to ${recipient}. MessageId: ${info.messageId}`);
  return info;
}

module.exports = { sendOtpEmail, sendRegistrationOtpEmail, sendResponderApprovalEmail };
