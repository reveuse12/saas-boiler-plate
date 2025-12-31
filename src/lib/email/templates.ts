/**
 * Email Templates
 * Reusable HTML email templates
 */

interface BaseTemplateProps {
  previewText?: string;
}

function baseTemplate(content: string, props?: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${props?.previewText ? `<meta name="x-apple-disable-message-reformatting">` : ""}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${props?.previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${props.previewText}</div>` : ""}
  ${content}
</body>
</html>
  `.trim();
}

export interface InvitationEmailProps {
  inviteeName?: string;
  inviterName: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
  expiresIn?: string;
}

export function invitationEmail(props: InvitationEmailProps): { html: string; text: string } {
  const html = baseTemplate(`
    <div style="background: #f9fafb; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111;">You're invited to join ${props.tenantName}</h1>
      <p style="margin: 0 0 24px; color: #666;">
        ${props.inviterName} has invited you to join <strong>${props.tenantName}</strong> as a <strong>${props.role}</strong>.
      </p>
      <a href="${props.inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Accept Invitation
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      This invitation will expire in ${props.expiresIn || "7 days"}.
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  `, { previewText: `${props.inviterName} invited you to join ${props.tenantName}` });

  const text = `
You're invited to join ${props.tenantName}

${props.inviterName} has invited you to join ${props.tenantName} as a ${props.role}.

Accept the invitation: ${props.inviteUrl}

This invitation will expire in ${props.expiresIn || "7 days"}.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  return { html, text };
}

export interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
  expiresIn?: string;
}

export function passwordResetEmail(props: PasswordResetEmailProps): { html: string; text: string } {
  const html = baseTemplate(`
    <div style="background: #f9fafb; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111;">Reset your password</h1>
      <p style="margin: 0 0 24px; color: #666;">
        ${props.userName ? `Hi ${props.userName}, ` : ""}We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <a href="${props.resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Reset Password
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      This link will expire in ${props.expiresIn || "1 hour"}.
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `, { previewText: "Reset your password" });

  const text = `
Reset your password

${props.userName ? `Hi ${props.userName}, ` : ""}We received a request to reset your password.

Reset your password: ${props.resetUrl}

This link will expire in ${props.expiresIn || "1 hour"}.

If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  return { html, text };
}

export interface WelcomeEmailProps {
  userName: string;
  tenantName: string;
  loginUrl: string;
}

export function welcomeEmail(props: WelcomeEmailProps): { html: string; text: string } {
  const html = baseTemplate(`
    <div style="background: #f9fafb; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111;">Welcome to ${props.tenantName}!</h1>
      <p style="margin: 0 0 24px; color: #666;">
        Hi ${props.userName}, your account has been created successfully. You can now log in and start using the platform.
      </p>
      <a href="${props.loginUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Go to Dashboard
      </a>
    </div>
  `, { previewText: `Welcome to ${props.tenantName}!` });

  const text = `
Welcome to ${props.tenantName}!

Hi ${props.userName}, your account has been created successfully.

Log in: ${props.loginUrl}
  `.trim();

  return { html, text };
}


export interface AdminSetupEmailProps {
  adminName: string;
  inviterName: string;
  role: string;
  setupUrl: string;
  expiresIn?: string;
}

export function adminSetupEmail(props: AdminSetupEmailProps): { html: string; text: string } {
  const html = baseTemplate(`
    <div style="background: #f9fafb; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111;">Welcome to the Admin Team!</h1>
      <p style="margin: 0 0 24px; color: #666;">
        Hi ${props.adminName}, ${props.inviterName} has added you as a <strong>${props.role}</strong> on the platform.
      </p>
      <p style="margin: 0 0 24px; color: #666;">
        Click the button below to set up your password and access the admin panel.
      </p>
      <a href="${props.setupUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Set Up Your Account
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      This link will expire in ${props.expiresIn || "48 hours"}.
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 32px;">
      If you didn't expect this invitation, please contact your administrator.
    </p>
  `, { previewText: `${props.inviterName} added you as an admin` });

  const text = `
Welcome to the Admin Team!

Hi ${props.adminName}, ${props.inviterName} has added you as a ${props.role} on the platform.

Set up your account: ${props.setupUrl}

This link will expire in ${props.expiresIn || "48 hours"}.

If you didn't expect this invitation, please contact your administrator.
  `.trim();

  return { html, text };
}
