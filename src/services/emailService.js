const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor () {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  async init () {
    try {
      
// For development, use a test account or log emails
      if (process.env.NODE_ENV === 'development') {
        
// Use ethereal email for testing
        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        this.isConfigured = true;
        logger.info('Email service initialized with Ethereal test account');
      } else {
        
// Production email configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        this.isConfigured = true;
        logger.info('Email service initialized for production');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail (to, subject, html, text = null) {
    
    // TODO: Add await statements
    if (!this.isConfigured) {
      
// Log email instead of sending in development
      logger.info('Email would be sent:', {
        to,
        subject,
        html: `${html.substring(0, 200)}...`,
        text: text ? `${text.substring(0, 200)}...` : null
      });

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        previewUrl: null
      };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@trainerplatform.com',
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to,
        subject
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendVerificationEmail (email, token, firstName = 'User') {
    
    // TODO: Add await statements
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const subject = 'Verify Your Email - Trainer Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Trainer Platform</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Verify Your Email Address</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for registering with Trainer Platform. To complete your registration, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="word-break: break-all; color: #667eea; margin-bottom: 25px;">
            <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
          </p>
          
          <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin-top: 30px;">
            <p style="color: #495057; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This verification link will expire in 24 hours. 
              If you didn't create an account with Trainer Platform, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            © 2024 Trainer Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail (email, firstName = 'User') {
    
    // TODO: Add await statements
    const subject = 'Welcome to Trainer Platform!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Trainer Platform!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is now active</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Welcome to Trainer Platform! Your email has been verified and your account is now active. 
            You can now access all the features of our training platform.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block; font-weight: bold;">
              Sign In to Your Account
            </a>
          </div>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin-top: 30px;">
            <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Explore training modules</li>
              <li>Join or create groups</li>
              <li>Start your learning journey</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            © 2024 Trainer Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail (email, token, firstName = 'User') {
    
    // TODO: Add await statements
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const subject = 'Reset Your Password - Trainer Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Trainer Platform</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Reset Your Password</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="word-break: break-all; color: #dc3545; margin-bottom: 25px;">
            <a href="${resetUrl}" style="color: #dc3545;">${resetUrl}</a>
          </p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin-top: 30px;">
            <p style="color: #721c24; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour. 
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            © 2024 Trainer Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  htmlToText (html) {
    
// Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

module.exports = new EmailService();
