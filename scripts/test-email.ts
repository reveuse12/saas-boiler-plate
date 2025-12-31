/**
 * Test email sending via SMTP
 * Usage: bun run test-email your-email@example.com
 */
import nodemailer from "nodemailer";

const testEmail = process.argv[2];

const config = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
};

if (!config.host || !config.user || !config.pass) {
  console.error("❌ SMTP not configured. Set these environment variables:");
  console.log("   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
  console.log("\nExample for Gmail:");
  console.log('   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com SMTP_PASS=app-password bun run test-email test@example.com');
  process.exit(1);
}

if (!testEmail) {
  console.error("❌ Please provide an email address");
  console.log("Usage: bun run test-email your@email.com");
  process.exit(1);
}

async function main() {
  console.log(`\n📧 Sending test email to: ${testEmail}`);
  console.log(`   From: ${config.from}`);
  console.log(`   SMTP: ${config.host}:${config.port}\n`);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: testEmail,
      subject: "Test Email from Your App",
      html: `
        <h1>🎉 Email is working!</h1>
        <p>Your SMTP integration is configured correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: "Email is working! Your SMTP integration is configured correctly.",
    });

    console.log("✅ Email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n📬 Check your inbox at: ${testEmail}\n`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();
