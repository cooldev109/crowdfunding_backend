import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration - supports both naming conventions
export const emailConfig = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  secure: (process.env.EMAIL_PORT || process.env.SMTP_PORT) === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || '',
  },
};

// Create transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    // Only verify if credentials are provided
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      logger.warn('Email credentials not configured - email functionality will be disabled');
      return false;
    }
    await transporter.verify();
    logger.info('Email server is ready to send messages');
    return true;
  } catch (error: any) {
    logger.warn('Email server connection failed - emails will be logged but not sent:', error.message);
    return false;
  }
};

// Default sender
export const defaultSender = {
  name: process.env.EMAIL_FROM_NAME || 'Rendall',
  email: process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'noreply@rendall.com',
};
