import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.GOOGLE_SMTP_EMAIL && env.GOOGLE_SMTP_APP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.GOOGLE_SMTP_HOST,
          port: env.GOOGLE_SMTP_PORT,
          secure: false,
          auth: {
            user: env.GOOGLE_SMTP_EMAIL,
            pass: env.GOOGLE_SMTP_APP_PASSWORD,
          },
        });
        this.isConfigured = true;
        console.log(`📧 Nodemailer SMTP initialized for ${env.GOOGLE_SMTP_HOST}:${env.GOOGLE_SMTP_PORT} (${env.GOOGLE_SMTP_EMAIL})`);
      } catch (err) {
        console.error('❌ Failed to initialize Nodemailer transporter:', err);
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ️ Nodemailer SMTP running in Dev Simulation Mode (No SMTP credentials provided in .env). OTPs & notifications will be logged to console.');
      this.isConfigured = false;
    }
  }

  async sendMail(options: { to: string; subject: string; html: string; text?: string }) {
    if (!this.isConfigured || !this.transporter) {
      console.log('\n======================================================');
      console.log('📨 [DEV SIMULATION EMAIL]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`From: "Agriera" <${env.GOOGLE_SMTP_EMAIL}>`);
      if (options.text) {
        console.log(`Body:\n${options.text}`);
      }
      console.log('======================================================\n');
      return { messageId: `dev-sim-${Date.now()}`, simulated: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Agriera" <${env.GOOGLE_SMTP_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`✅ Email sent successfully to ${options.to} (MessageId: ${info.messageId})`);
      return info;
    } catch (error: any) {
      console.error(`❌ Failed to send email via SMTP to ${options.to}:`, error.message);
      // Fallback log so dev flow is never broken
      console.log(`⚠️ Dev Fallback Content for ${options.to}: ${options.subject}`);
      throw error;
    }
  }

  async sendRegistrationOtpEmail(to: string, otp: string, name: string) {
    const subject = `🌾 ${otp} is your Agriera Verification Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; color: #1E293B; }
          .card { max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
          .header { background: linear-gradient(135deg, #0F4726 0%, #15803D 100%); padding: 28px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #B7D9C3; }
          .content { padding: 32px 24px; text-align: center; }
          .greeting { font-size: 16px; font-weight: 600; color: #0F172A; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { display: inline-block; background-color: #E8F5E9; border: 2px dashed #15803D; border-radius: 10px; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #0F4726; letter-spacing: 6px; margin: 10px 0 20px; }
          .validity { font-size: 12px; color: #E11D48; font-weight: 600; margin-bottom: 20px; }
          .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 11px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Agriera</h1>
            <p>Direct-to-Farmer Agricultural Commerce & Services</p>
          </div>
          <div class="content">
            <div class="greeting">Vanakkam, ${name || 'Farmer Friend'}!</div>
            <div class="desc">Thank you for registering with Agriera. Please use the one-time verification code below to confirm your account and get started:</div>
            <div class="otp-box">${otp}</div>
            <div class="validity">⏳ This OTP is valid for 5 minutes. Do not share this code with anyone.</div>
            <p style="font-size: 13px; color: #64748B;">If you did not request this code, please disregard this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Agriera. All rights reserved. • AgriFlow Ecosystem
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Vanakkam ${name}!\n\nYour Agriera OTP verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nBest regards,\nAgriera Team`;
    return this.sendMail({ to, subject, html, text });
  }

  async sendLoginOtpEmail(to: string, otp: string, name: string) {
    const subject = `🔐 ${otp} is your Agriera Login Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; color: #1E293B; }
          .card { max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
          .header { background: linear-gradient(135deg, #0F4726 0%, #15803D 100%); padding: 28px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 32px 24px; text-align: center; }
          .otp-box { display: inline-block; background-color: #E8F5E9; border: 2px dashed #15803D; border-radius: 10px; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #0F4726; letter-spacing: 6px; margin: 10px 0 20px; }
          .validity { font-size: 12px; color: #E11D48; font-weight: 600; margin-bottom: 20px; }
          .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 11px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Agriera</h1>
            <p>Secure Account Access</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0;">Sign In Verification</h2>
            <p style="font-size: 14px; color: #64748B;">Hello ${name || 'Farmer'}, here is your one-time passcode to sign into your account:</p>
            <div class="otp-box">${otp}</div>
            <div class="validity">⏳ Valid for 5 minutes. Never share this code.</div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Agriera. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hello ${name}!\n\nYour Agriera sign-in code is: ${otp}\n\nExpires in 5 minutes.`;
    return this.sendMail({ to, subject, html, text });
  }

  async sendPasswordResetOtpEmail(to: string, otp: string, name: string) {
    const subject = `🔐 ${otp} is your Agriera Password Reset Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; color: #1E293B; }
          .card { max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
          .header { background: linear-gradient(135deg, #0F4726 0%, #15803D 100%); padding: 28px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #B7D9C3; }
          .content { padding: 32px 24px; text-align: center; }
          .greeting { font-size: 16px; font-weight: 600; color: #0F172A; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 20px; }
          .otp-box { display: inline-block; background-color: #FEF2F2; border: 2px dashed #DC2626; border-radius: 10px; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #991B1B; letter-spacing: 6px; margin: 10px 0 20px; }
          .validity { font-size: 12px; color: #DC2626; font-weight: 600; margin-bottom: 20px; }
          .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 11px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Agriera</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name || 'Farmer'},</div>
            <div class="desc">We received a request to reset your Agriera account password. Please use the verification code below to set your new password:</div>
            <div class="otp-box">${otp}</div>
            <div class="validity">⏳ This code expires in 5 minutes. Do not share it with anyone.</div>
            <p style="font-size: 13px; color: #64748B;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Agriera. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hello ${name}!\n\nYour Agriera password reset code is: ${otp}\n\nExpires in 5 minutes.`;
    return this.sendMail({ to, subject, html, text });
  }

  async sendPasswordChangedNotificationEmail(to: string, name: string) {
    const subject = `🔒 Your Agriera Password Has Been Changed`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
        <h2 style="color: #0F4726; margin-top: 0;">Password Changed Successfully</h2>
        <p>Dear ${name || 'Farmer'},</p>
        <p>Your Agriera account password was successfully updated on <strong>${new Date().toLocaleString()}</strong>.</p>
        <p>If you made this change, no further action is needed.</p>
        <p style="color: #DC2626; font-size: 13px;">If you did NOT perform this action, please contact our support immediately.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94A3B8;">Agriera Security Team</p>
      </div>
    `;
    return this.sendMail({ to, subject, html, text: `Your Agriera password was changed successfully.` });
  }

  sendWelcomeEmail(to: string, name: string) {
    const subject = `🌱 Welcome to Agriera, ${name}!`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #0F4726;">Welcome to Agriera!</h2>
        <p>Dear ${name},</p>
        <p>Your account is now fully verified. You can now shop bio-inputs, book soil tests, consult agronomists, and diagnose crop issues with our Crop Doctor.</p>
        <p>Happy Farming!</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94A3B8;">Agriera Support Team</p>
      </div>
    `;
    return this.sendMail({ to, subject, html, text: `Welcome to Agriera, ${name}!` });
  }

  async sendTestSmtpEmail(to: string) {
    const subject = `✅ Agriera SMTP Configuration Test`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #16A34A; border-radius: 12px; background-color: #F0FDF4;">
        <h2 style="color: #15803D; margin-top: 0;">🎉 SMTP Test Successful!</h2>
        <p>This is a test email sent from the Agriera backend server at <strong>${new Date().toISOString()}</strong>.</p>
        <p>Your SMTP credentials, transport encryption, and email dispatch pipeline are operating properly.</p>
      </div>
    `;
    return this.sendMail({ to, subject, html, text: `Agriera SMTP test successful at ${new Date().toISOString()}` });
  }
}

export const emailService = new EmailService();
