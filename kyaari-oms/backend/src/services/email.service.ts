import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

export interface SendCredentialsEmailParams {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    const gmailUser = process.env.SMTP_USER;
    const gmailAppPassword = process.env.SMTP_PASS;

    if (gmailUser && gmailAppPassword && gmailUser.trim() !== '' && gmailAppPassword.trim() !== '') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
      logger.info('Email service initialized with SMTP');
    } else {
      logger.warn('SMTP credentials not configured. Emails will be logged instead of sent.');
    }
  }

  /**
   * Send welcome email with login credentials to new user
   */
  async sendCredentialsEmail(params: SendCredentialsEmailParams): Promise<void> {
    try {
      const { to, name, email, password, role } = params;

      // If Gmail is not configured, just log the credentials
      if (!this.transporter) {
        logger.warn('Email not sent (SMTP not configured). User credentials:', {
          to,
          name,
          email,
          password,
          role,
          message: '⚠️ Configure SMTP_USER and SMTP_PASS in .env to enable email sending'
        });
        console.log('\n==============================================');
        console.log('📧 EMAIL NOT SENT - SMTP NOT CONFIGURED');
        console.log('==============================================');
        console.log(`To: ${to}`);
        console.log(`Name: ${name}`);
        console.log(`Role: ${role}`);
        console.log(`Email: ${email}`);
        console.log(`Temporary Password: ${password}`);
        console.log('==============================================\n');
        return;
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10B981;
      margin-bottom: 10px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .credentials-box {
      background-color: #f7fafc;
      border-left: 4px solid #10B981;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .credential-item {
      margin: 15px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #4a5568;
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .credential-value {
      font-size: 16px;
      color: #1a202c;
      background-color: white;
      padding: 10px 15px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .warning {
      background-color: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #10B981;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
      text-align: center;
    }
    .steps {
      margin: 25px 0;
    }
    .step {
      margin: 15px 0;
      padding-left: 25px;
      position: relative;
    }
    .step::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #10B981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌱 Kyaari OMS</div>
    </div>

    <h1>Welcome to Kyaari OMS, ${name}!</h1>
    
    <p>Your account has been created successfully. You've been assigned the role of <strong>${role}</strong> in our Order Management System.</p>

    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Email Address:</span>
        <div class="credential-value">${email}</div>
      </div>
      
      <div class="credential-item">
        <span class="credential-label">Temporary Password:</span>
        <div class="credential-value">${password}</div>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ Important Security Notice:</strong>
      <br>
      This is a temporary password. Please change it immediately after your first login for security purposes.
    </div>

    <div class="steps">
      <p><strong>Getting Started:</strong></p>
      <div class="step">Visit the Kyaari OMS portal</div>
      <div class="step">Click on your role dashboard (${role})</div>
      <div class="step">Login with the credentials above</div>
      <div class="step">Change your password in Profile Settings</div>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button">
        Login to Dashboard
      </a>
    </div>

    <div class="footer">
      <p>If you did not expect this email or have any questions, please contact your administrator immediately.</p>
      <p style="margin-top: 15px;">
        <strong>Kyaari OMS</strong><br>
        Order Management System
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const textContent = `
Welcome to Kyaari OMS!

Hello ${name},

Your account has been created successfully. You've been assigned the role of ${role} in our Order Management System.

Your Login Credentials:
------------------------
Email: ${email}
Temporary Password: ${password}

IMPORTANT: This is a temporary password. Please change it immediately after your first login.

Getting Started:
1. Visit the Kyaari OMS portal
2. Click on your role dashboard (${role})
3. Login with the credentials above
4. Change your password in Profile Settings

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

If you did not expect this email or have any questions, please contact your administrator immediately.

---
Kyaari OMS
Order Management System
      `;

      const info = await this.transporter.sendMail({
        from: `"Kyaari OMS" <${process.env.SMTP_USER}>`,
        to,
        subject: `Welcome to Kyaari OMS - Your ${role} Account Credentials`,
        html: htmlContent,
        text: textContent,
      });

      logger.info('Credentials email sent successfully', { to, role, messageId: info.messageId });
      console.log(`✅ Email sent to ${to} - Password: ${password}`);
    } catch (error) {
      logger.error('Failed to send credentials email', { error, to: params.to });
      // Log credentials in console so admin can manually share them
      console.error('\n⚠️ EMAIL FAILED - User credentials:');
      console.error(`Email: ${params.email}, Password: ${params.password}\n`);
      throw new Error('Failed to send credentials email');
    }
  }

  /**
   * Send password reset email with 6-digit code
   */
  async sendPasswordResetCode(to: string, name: string, resetCode: string): Promise<void> {
    try {
      if (!this.transporter) {
        logger.warn('Password reset code email not sent (SMTP not configured)', { to, resetCode });
        console.log('\n==============================================');
        console.log('📧 PASSWORD RESET CODE - SMTP NOT CONFIGURED');
        console.log('==============================================');
        console.log(`To: ${to}`);
        console.log(`Name: ${name}`);
        console.log(`Reset Code: ${resetCode}`);
        console.log(`Expires in: 15 minutes`);
        console.log('==============================================\n');
        return;
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10B981;
      margin-bottom: 10px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .code-box {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .code {
      font-size: 42px;
      font-weight: bold;
      color: white;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .code-label {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-bottom: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .info-box {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-item {
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    .info-icon {
      color: #10B981;
      margin-right: 10px;
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌱 Kyaari OMS</div>
    </div>

    <h1>Password Reset Request</h1>
    
    <p>Hello ${name},</p>
    <p>We received a request to reset your password for your Kyaari OMS account. Use the verification code below to complete your password reset:</p>

    <div class="code-box">
      <div class="code-label">Your Verification Code</div>
      <div class="code">${resetCode}</div>
    </div>

    <div class="warning">
      <strong>⏱️ Time Sensitive:</strong>
      <br>
      This code will expire in <strong>15 minutes</strong>. If you didn't request this password reset, please ignore this email or contact your administrator immediately.
    </div>

    <div class="info-box">
      <div class="info-item">
        <span class="info-icon">✓</span>
        <span>Enter this code in the password reset form</span>
      </div>
      <div class="info-item">
        <span class="info-icon">✓</span>
        <span>Create a new strong password</span>
      </div>
      <div class="info-item">
        <span class="info-icon">✓</span>
        <span>Login with your new credentials</span>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p style="margin-top: 15px;">
        <strong>Kyaari OMS</strong><br>
        Order Management System
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const textContent = `
Password Reset Request - Kyaari OMS

Hello ${name},

We received a request to reset your password for your Kyaari OMS account.

Your Verification Code: ${resetCode}

This code will expire in 15 minutes.

Steps to reset your password:
1. Enter this code in the password reset form
2. Create a new strong password
3. Login with your new credentials

If you didn't request this password reset, please ignore this email or contact your administrator immediately.

---
Kyaari OMS
Order Management System
      `;

      await this.transporter.sendMail({
        from: `"Kyaari OMS" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Password Reset Code - Kyaari OMS',
        html: htmlContent,
        text: textContent,
      });

      logger.info('Password reset code email sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send password reset code email', { error, to });
      throw new Error('Failed to send password reset code email');
    }
  }

  /**
   * Send password reset email with link (legacy method - kept for backwards compatibility)
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
    try {
      if (!this.transporter) {
        logger.warn('Password reset email not sent (SMTP not configured)', { to, resetToken });
        console.log(`\n📧 Password reset token for ${to}: ${resetToken}\n`);
        return;
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Reset Request</h1>
    <p>Hello ${name},</p>
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    <p style="margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link: ${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
      `;

      await this.transporter.sendMail({
        from: `"Kyaari OMS" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Reset Your Kyaari OMS Password',
        html: htmlContent,
      });

      logger.info('Password reset email sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, to });
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = new EmailService();

