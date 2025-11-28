import { Request, Response, NextFunction } from 'express';
import { wompiService, WompiTransactionStatus, WompiWebhookEvent } from '../services/wompiService';
import { Payment, PaymentStatus } from '../models/Payment';
import { Investment } from '../models/Investment';
import { Project } from '../models/Project';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/errorHandler';

/**
 * Get Wompi configuration for frontend
 */
export const getWompiConfig = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const publicKey = wompiService.getPublicKey();

    res.json({
      success: true,
      data: {
        publicKey,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get PSE banks list
 */
export const getPSEBanks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banks = await wompiService.getPSEBanks();

    res.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create card payment
 */
export const createCardPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const {
      cardToken,
      investmentId,
      customerEmail,
      customerName,
      customerDocument,
      customerDocumentType,
      installments,
    } = req.body;

    // Validate required fields
    if (!cardToken || !investmentId || !customerEmail || !customerName || !customerDocument) {
      throw new AppError('Missing required fields', 400);
    }

    // Get investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Verify ownership
    if (investment.userId.toString() !== userId?.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Create unique reference
    const reference = `INV-${investmentId}-${Date.now()}`;

    // Create Wompi transaction
    const transaction = await wompiService.createCardTransaction({
      cardToken,
      amount: investment.amount,
      reference,
      customerEmail,
      customerName,
      customerDocument,
      customerDocumentType,
      installments,
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      investmentId,
      transactionId: transaction.id,
      amount: investment.amount,
      currency: 'COP',
      status: mapWompiStatusToPaymentStatus(transaction.status),
      paymentMethod: 'card',
      paymentGateway: 'wompi',
      gatewayReference: reference,
      metadata: {
        wompiTransactionId: transaction.id,
        paymentMethodType: transaction.payment_method_type,
      },
    });

    // Update investment status if approved
    if (transaction.status === WompiTransactionStatus.APPROVED) {
      await Investment.findByIdAndUpdate(investmentId, {
        status: 'completed',
        paymentId: payment._id,
      });

      // Update project funded amount
      await Project.findByIdAndUpdate(investment.projectId, {
        $inc: { fundedAmount: investment.amount },
      });
    } else if (transaction.status === WompiTransactionStatus.PENDING) {
      await Investment.findByIdAndUpdate(investmentId, {
        status: 'pending',
        paymentId: payment._id,
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        paymentId: payment._id,
        redirectUrl: transaction.redirect_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create PSE payment
 */
export const createPSEPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const {
      investmentId,
      customerEmail,
      customerName,
      customerDocument,
      customerDocumentType,
      financialInstitutionCode,
      userType,
      redirectUrl,
    } = req.body;

    // Validate required fields
    if (!investmentId || !customerEmail || !customerName || !customerDocument || !financialInstitutionCode) {
      throw new AppError('Missing required fields', 400);
    }

    // Get investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Verify ownership
    if (investment.userId.toString() !== userId?.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Create unique reference
    const reference = `INV-${investmentId}-${Date.now()}`;

    // Create Wompi PSE transaction
    const transaction = await wompiService.createPSETransaction({
      amount: investment.amount,
      reference,
      customerEmail,
      customerName,
      customerDocument,
      customerDocumentType: customerDocumentType || 'CC',
      financialInstitutionCode,
      userType: userType || 0,
      redirectUrl: redirectUrl || `${process.env.CLIENT_URL}/payment/status/${investmentId}`,
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      investmentId,
      transactionId: transaction.id,
      amount: investment.amount,
      currency: 'COP',
      status: PaymentStatus.PENDING,
      paymentMethod: 'pse',
      paymentGateway: 'wompi',
      gatewayReference: reference,
      metadata: {
        wompiTransactionId: transaction.id,
        paymentMethodType: transaction.payment_method_type,
        financialInstitutionCode,
      },
    });

    // Update investment status
    await Investment.findByIdAndUpdate(investmentId, {
      status: 'pending',
      paymentId: payment._id,
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        paymentId: payment._id,
        redirectUrl: transaction.redirect_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Bancolombia payment
 */
export const createBancolombiaPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { investmentId, customerEmail, redirectUrl } = req.body;

    // Validate required fields
    if (!investmentId || !customerEmail) {
      throw new AppError('Missing required fields', 400);
    }

    // Get investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Verify ownership
    if (investment.userId.toString() !== userId?.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Create unique reference
    const reference = `INV-${investmentId}-${Date.now()}`;

    // Create Wompi Bancolombia transaction
    const transaction = await wompiService.createBancolombiaTransaction({
      amount: investment.amount,
      reference,
      customerEmail,
      redirectUrl: redirectUrl || `${process.env.CLIENT_URL}/payment/status/${investmentId}`,
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      investmentId,
      transactionId: transaction.id,
      amount: investment.amount,
      currency: 'COP',
      status: PaymentStatus.PENDING,
      paymentMethod: 'bancolombia',
      paymentGateway: 'wompi',
      gatewayReference: reference,
      metadata: {
        wompiTransactionId: transaction.id,
        paymentMethodType: transaction.payment_method_type,
      },
    });

    // Update investment status
    await Investment.findByIdAndUpdate(investmentId, {
      status: 'pending',
      paymentId: payment._id,
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        paymentId: payment._id,
        redirectUrl: transaction.redirect_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction status
 */
export const getTransactionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    const transaction = await wompiService.getTransaction(transactionId);

    // Also get payment record
    const payment = await Payment.findOne({ transactionId });

    res.json({
      success: true,
      data: {
        transaction,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Wompi webhook events
 */
export const handleWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const event: WompiWebhookEvent = req.body;

    // Validate webhook signature
    const isValid = wompiService.validateWebhookSignature(event);
    if (!isValid) {
      logger.warn('Invalid Wompi webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    logger.info(`Wompi webhook received: ${event.event}`);

    const transaction = event.data.transaction;

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: transaction.id });
    if (!payment) {
      logger.warn(`Payment not found for transaction: ${transaction.id}`);
      res.status(200).json({ received: true });
      return;
    }

    // Update payment status
    const newStatus = mapWompiStatusToPaymentStatus(transaction.status);
    payment.status = newStatus;
    payment.metadata = {
      ...payment.metadata,
      lastWebhookEvent: event.event,
      lastWebhookTimestamp: event.timestamp,
      statusMessage: transaction.status_message,
    };
    await payment.save();

    // Update investment based on status
    if (payment.investmentId) {
      const investment = await Investment.findById(payment.investmentId);
      if (investment) {
        if (transaction.status === WompiTransactionStatus.APPROVED) {
          investment.status = 'completed';
          await investment.save();

          // Update project funded amount
          await Project.findByIdAndUpdate(investment.projectId, {
            $inc: { fundedAmount: investment.amount },
          });

          logger.info(`Investment ${investment._id} completed successfully`);
        } else if (transaction.status === WompiTransactionStatus.DECLINED ||
                   transaction.status === WompiTransactionStatus.ERROR ||
                   transaction.status === WompiTransactionStatus.VOIDED) {
          investment.status = 'failed';
          await investment.save();
          logger.info(`Investment ${investment._id} failed: ${transaction.status}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Wompi webhook error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Generate integrity signature for frontend
 */
export const generateIntegrity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reference, amountInCents, currency } = req.body;

    if (!reference || !amountInCents) {
      throw new AppError('Missing required fields', 400);
    }

    const signature = wompiService.generateIntegritySignature(
      reference,
      amountInCents,
      currency || 'COP'
    );

    res.json({
      success: true,
      data: {
        signature,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to map Wompi status to Payment status
function mapWompiStatusToPaymentStatus(wompiStatus: WompiTransactionStatus): PaymentStatus {
  switch (wompiStatus) {
    case WompiTransactionStatus.APPROVED:
      return PaymentStatus.SUCCEEDED;
    case WompiTransactionStatus.PENDING:
      return PaymentStatus.PENDING;
    case WompiTransactionStatus.DECLINED:
    case WompiTransactionStatus.ERROR:
      return PaymentStatus.FAILED;
    case WompiTransactionStatus.VOIDED:
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}
