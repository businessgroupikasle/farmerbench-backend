import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        this.isConfigured = true;
        console.log(`📧 Nodemailer SMTP initialized for ${env.SMTP_HOST}:${env.SMTP_PORT} (${env.SMTP_USER})`);
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
      console.log(`From: ${env.SMTP_FROM}`);
      if (options.text) {
        console.log(`Body:\n${options.text}`);
      }
      console.log('======================================================\n');
      return { messageId: `dev-sim-${Date.now()}`, simulated: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM,
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
    const subject = `🌾 ${otp} is your FarmerBench Verification Code`;
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
            <h1>FarmerBench</h1>
            <p>Direct-to-Farmer Agricultural Commerce & Services</p>
          </div>
          <div class="content">
            <div class="greeting">Vanakkam, ${name || 'Farmer Friend'}!</div>
            <div class="desc">Thank you for registering with FarmerBench. Please use the one-time verification code below to confirm your account and get started:</div>
            <div class="otp-box">${otp}</div>
            <div class="validity">⏳ This OTP is valid for 5 minutes. Do not share this code with anyone.</div>
            <p style="font-size: 13px; color: #64748B;">If you did not request this code, please disregard this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} FarmerBench. All rights reserved. • AgriFlow Ecosystem
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Vanakkam ${name}!\n\nYour FarmerBench OTP verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nBest regards,\nFarmerBench Team`;
    return this.sendMail({ to, subject, html, text });
  }

  async sendLoginOtpEmail(to: string, otp: string, name: string) {
    const subject = `🔐 ${otp} is your FarmerBench Login Code`;
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
            <h1>FarmerBench</h1>
            <p>Secure Account Access</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0;">Sign In Verification</h2>
            <p style="font-size: 14px; color: #64748B;">Hello ${name || 'Farmer'}, here is your one-time passcode to sign into your account:</p>
            <div class="otp-box">${otp}</div>
            <div class="validity">⏳ Valid for 5 minutes. Never share this code.</div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} FarmerBench. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hello ${name}!\n\nYour FarmerBench sign-in code is: ${otp}\n\nExpires in 5 minutes.`;
    return this.sendMail({ to, subject, html, text });
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = `🌱 Welcome to FarmerBench, ${name}!`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #0F4726;">Welcome to FarmerBench!</h2>
        <p>Dear ${name},</p>
        <p>Your account is now fully verified. You can now shop bio-inputs, book soil tests, consult agronomists, and diagnose crop issues with our Crop Doctor.</p>
        <p>Happy Farming!</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94A3B8;">FarmerBench Support Team</p>
      </div>
    `;
    return this.sendMail({ to, subject, html, text: `Welcome to FarmerBench, ${name}!` });
  }

  async sendTestSmtpEmail(to: string) {
    const subject = `✅ FarmerBench SMTP Configuration Test`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #16A34A; border-radius: 12px; background-color: #F0FDF4;">
        <h2 style="color: #15803D; margin-top: 0;">🎉 SMTP Test Successful!</h2>
        <p>This is a test email sent from the FarmerBench backend server at <strong>${new Date().toISOString()}</strong>.</p>
        <p>Your SMTP credentials, transport encryption, and email dispatch pipeline are operating properly.</p>
      </div>
    `;
    return this.sendMail({ to, subject, html, text: `FarmerBench SMTP test successful at ${new Date().toISOString()}` });
  }
}

export const emailService = new EmailService();
