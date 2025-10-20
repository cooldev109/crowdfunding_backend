import { transporter, defaultSender } from '../config/email';
import { logger } from '../config/logger';
import {
  welcomeEmailTemplate,
  investmentConfirmationTemplate,
  passwordResetTemplate,
  investmentCancelledTemplate,
  subscriptionConfirmationTemplate,
} from '../templates/emailTemplates';

export class EmailService {
  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: 'Welcome to InvestFlow! 🎉',
        html: welcomeEmailTemplate(name),
      });

      logger.info(`Welcome email sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send welcome email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send investment confirmation email
   */
  static async sendInvestmentConfirmation(
    to: string,
    data: {
      name: string;
      projectTitle: string;
      amount: number;
      expectedReturn: number;
      investmentDate: string;
      investmentId: string;
    }
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: `Investment Confirmed - ${data.projectTitle}`,
        html: investmentConfirmationTemplate(data),
      });

      logger.info(`Investment confirmation email sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send investment confirmation email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: 'Reset Your Password - InvestFlow',
        html: passwordResetTemplate(name, resetUrl),
      });

      logger.info(`Password reset email sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send password reset email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send investment cancelled email
   */
  static async sendInvestmentCancelledEmail(
    to: string,
    data: {
      name: string;
      projectTitle: string;
      amount: number;
      refundReason: string;
      investmentId: string;
    }
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: `Investment Cancelled - ${data.projectTitle}`,
        html: investmentCancelledTemplate(data),
      });

      logger.info(`Investment cancelled email sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send investment cancelled email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send subscription confirmation email
   */
  static async sendSubscriptionConfirmation(
    to: string,
    data: {
      name: string;
      planName: string;
      price: number;
      features: string[];
    }
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: `Welcome to ${data.planName} Plan! 🚀`,
        html: subscriptionConfirmationTemplate(data),
      });

      logger.info(`Subscription confirmation email sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send subscription confirmation email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send contact form notification to admin
   */
  static async sendContactFormNotification(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@investflow.com';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #4b5563; margin-bottom: 5px; display: block; }
            .value { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Contact Form Submission</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">InvestFlow Platform</p>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">From:</span>
                <div class="value">${data.name} &lt;${data.email}&gt;</div>
              </div>

              <div class="field">
                <span class="label">Subject:</span>
                <div class="value">${data.subject}</div>
              </div>

              <div class="field">
                <span class="label">Message:</span>
                <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
              </div>

              <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px;">
                <strong>Action Required:</strong> Please respond to ${data.email} at your earliest convenience.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your InvestFlow contact form.</p>
              <p style="margin-top: 5px;">Do not reply to this email directly. Reply to: ${data.email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to: adminEmail,
        replyTo: data.email,
        subject: `Contact Form: ${data.subject}`,
        html,
      });

      logger.info(`Contact form notification sent to admin from: ${data.email}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send contact form notification:`, error);
      return false;
    }
  }

  /**
   * Send contact form confirmation to user
   */
  static async sendContactFormConfirmation(
    to: string,
    name: string
  ): Promise<boolean> {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .checkmark { font-size: 48px; color: #10b981; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
            </div>
            <div class="content" style="text-align: center;">
              <div class="checkmark">✓</div>
              <h2>Hello ${name},</h2>
              <p style="font-size: 16px; margin: 20px 0;">
                We've received your message and will get back to you as soon as possible.
              </p>
              <p style="color: #6b7280; margin-top: 30px;">
                Our team typically responds within 24-48 hours during business days.
              </p>
              <div style="margin-top: 40px; padding: 20px; background: #eff6ff; border-radius: 10px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Need immediate assistance?</strong><br>
                  Check out our FAQ section or explore our help center.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 InvestFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject: 'We Received Your Message - InvestFlow',
        html,
      });

      logger.info(`Contact form confirmation sent to: ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send contact form confirmation to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send generic email
   */
  static async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"${defaultSender.name}" <${defaultSender.email}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to: ${to} - Subject: ${subject}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }
}
