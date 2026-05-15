import nodemailer from "nodemailer";

// ── Create transporter ONCE (not inside the function) ──
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // fixes SSL issues on some systems
  },
});

// ── Verify once on server startup (not on every email) ─
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email server connection failed:", error.message);
  } else {
    console.log("✅ Email server connected and ready");
  }
});

// ── Send email (non-blocking — never crashes the app) ──
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"StayFinder 🏠" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} — ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // ✅ Log but DON'T throw — booking should still succeed even if email fails
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;