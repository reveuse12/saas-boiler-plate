/**
 * Email Service
 * Supports SMTP (Nodemailer) with easy switch to other providers
 */
import nodemailer from "nodemailer";

// Create transporter from env config
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const transporter = createTransporter();
const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface TenantEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Send email using platform configuration
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.error("Email not configured: SMTP settings missing");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await transporter.sendMail({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send email using tenant-specific configuration
 * Falls back to platform config if tenant config not provided
 */
export async function sendTenantEmail(
  options: SendEmailOptions,
  tenantConfig?: TenantEmailConfig | null
): Promise<{ success: boolean; error?: string }> {
  if (!tenantConfig?.smtpHost) {
    return sendEmail(options);
  }

  const tenantTransporter = nodemailer.createTransport({
    host: tenantConfig.smtpHost,
    port: tenantConfig.smtpPort,
    secure: tenantConfig.smtpPort === 465,
    auth: {
      user: tenantConfig.smtpUser,
      pass: tenantConfig.smtpPass,
    },
  });

  const fromAddress = tenantConfig.fromName
    ? `${tenantConfig.fromName} <${tenantConfig.fromEmail}>`
    : tenantConfig.fromEmail;

  try {
    await tenantTransporter.sendMail({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send tenant email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!transporter;
}
