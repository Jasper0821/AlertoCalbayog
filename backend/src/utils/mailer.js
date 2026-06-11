const nodemailer = require("nodemailer");

async function createTransporter() {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASS?.replace(/\s+/g, "").trim();

  if (
    gmailUser &&
    gmailPass &&
    gmailUser !== "your_gmail@gmail.com" &&
    gmailPass !== "your_16_char_app_password" &&
    gmailPass !== ""
  ) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  console.log("\n📧  [Mailer] No Gmail credentials found — using Ethereal test SMTP.");
  console.log(`    User: ${testAccount.user}`);
  console.log(`    Pass: ${testAccount.pass}\n`);

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function sendOtpEmail(toEmail, otpCode) {
  let transporter = await createTransporter();

  const mailOptions = {
    from: `"AlertoCalbayog" <${process.env.GMAIL_USER?.trim() || "noreply@alertocalbayog.local"}>`,
    to: toEmail,
    subject: "🔐 Your AlertoCalbayog Password Reset Code",
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
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    if (err.code === "EAUTH") {
      console.warn("\n⚠️  [Mailer] Gmail authentication failed — falling back to Ethereal test SMTP.");
      const testAccount = await nodemailer.createTestAccount();
      console.log(`    Ethereal User: ${testAccount.user}`);
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      info = await transporter.sendMail(mailOptions);
    } else {
      throw err;
    }
  }

  console.log(`\n✅  [OTP] Code for ${toEmail}: ${otpCode}`);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📬  [Ethereal Preview] View email at: ${previewUrl}\n`);
  }
}

module.exports = { sendOtpEmail };
