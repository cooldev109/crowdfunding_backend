import { Request, Response, NextFunction } from 'express';
import { contactFormSchema } from '../utils/contactValidation';
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

      // Send notification to admin
      const adminNotificationSent = await EmailService.sendContactFormNotification(
        validatedData
      );

      if (!adminNotificationSent) {
        throw new AppError('Failed to send contact form notification', 500);
      }

      // Send confirmation to user
      await EmailService.sendContactFormConfirmation(
        validatedData.email,
        validatedData.name
      );

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
}
