import { Request, Response, NextFunction } from 'express';
import { contactFormSchema, meetingRequestSchema } from '../utils/contactValidation';
import { EmailService } from '../services/emailService';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';
import { z } from 'zod';

export class ContactController {
  /**
   * Handle contact form submission
   * POST /api/contact
   * @access Public
   */
  static async submitContactForm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = contactFormSchema.parse(req.body);

      logger.info(`Contact form submission from: ${validatedData.email}`);

      // Fire-and-forget email sending (don't await)
      EmailService.sendContactFormNotification(validatedData).catch((err: any) => {
        logger.warn(`Email notification failed: ${err?.message || err}`);
      });
      EmailService.sendContactFormConfirmation(validatedData.email, validatedData.name).catch((err: any) => {
        logger.warn(`Email confirmation failed: ${err?.message || err}`);
      });

      logger.info(`Contact form processed successfully from: ${validatedData.email}`);

      res.status(200).json({
        success: true,
        message:
          'Thank you for contacting us! We have received your message and will respond soon.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * Handle meeting request submission
   * POST /api/contact/meeting
   * @access Public
   */
  static async submitMeetingRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = meetingRequestSchema.parse(req.body);

      logger.info(`Meeting request from: ${validatedData.email}`);

      // Fire-and-forget email sending (don't await)
      EmailService.sendMeetingRequestNotification(validatedData).catch((err: any) => {
        logger.warn(`Meeting notification email failed: ${err?.message || err}`);
      });
      EmailService.sendMeetingRequestConfirmation(
        validatedData.email,
        validatedData.name,
        validatedData.preferredDate,
        validatedData.preferredTime
      ).catch((err: any) => {
        logger.warn(`Meeting confirmation email failed: ${err?.message || err}`);
      });

      logger.info(`Meeting request processed successfully from: ${validatedData.email}`);

      res.status(200).json({
        success: true,
        message:
          'Tu solicitud de reunión ha sido recibida. Te contactaremos pronto para confirmar.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  }
}
