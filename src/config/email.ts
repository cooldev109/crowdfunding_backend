import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
};

// Create transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email server is ready to send messages');
    return true;
  } catch (error: any) {
    logger.error('Email server connection failed:', error);
    return false;
  }
};

// Default sender
export const defaultSender = {
  name: process.env.EMAIL_FROM_NAME || 'InvestFlow',
  email: process.env.EMAIL_FROM_ADDRESS || 'noreply@investflow.com',
};
