import { Request, Response, NextFunction } from 'express';
import { PLANS, PlanKey } from '../config/plans';
import { wompiService, WompiTransactionStatus } from '../services/wompiService';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/errorHandler';
import crypto from 'crypto';

// Valid paid plan keys (esencial, pro, prime)
const VALID_PLAN_KEYS: PlanKey[] = ['esencial', 'pro', 'prime'];

// Generate unique reference for subscription (max 36 chars for Wompi SKU)
function generateSubscriptionReference(userId: string, planKey: string): string {
  const timestamp = Date.now().toString(36); // Base36 for shorter timestamp
  const random = crypto.randomBytes(3).toString('hex'); // 6 chars
  const plan = planKey.slice(0, 3).toUpperCase(); // 3 chars (ESE, PRO, PRI)
  const user = userId.slice(-4); // 4 chars
  return `S${plan}${user}${timestamp}${random}`; // ~24 chars total
}

// Calculate renewal date based on billing cycle
function calculateRenewalDate(billingCycle: 'monthly' | 'annual', planKey: string): Date {
  const now = new Date();
  if (planKey === 'esencial') {
    // Esencial is 15-day plan
    return new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  }
  if (billingCycle === 'annual') {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return new Date(now.setMonth(now.getMonth() + 1));
}

export class SubscriptionController {
  /**
   * Get all available plans
   * GET /api/subscription/plans
   * @access Public
   */
  static async getPlans(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: { plans: PLANS },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create checkout session - returns info for payment form
   * POST /api/subscription/checkout
   * @access Private
   */
  static async createCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { planKey, billingCycle = 'monthly' } = req.body;
      const userId = String(req.user!._id);
      const user = req.user!;

      if (!planKey || !VALID_PLAN_KEYS.includes(planKey as PlanKey)) {
        throw new AppError(`Invalid plan selected. Available plans: ${VALID_PLAN_KEYS.join(', ')}`, 400);
      }

      if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
        throw new AppError('Invalid billing cycle. Use "monthly" or "annual"', 400);
      }

      const plan = PLANS[planKey as PlanKey];
      if (!plan) {
        throw new AppError('Plan not found', 404);
      }

      // Check if user already has this plan
      if (user.planKey === planKey && user.planStatus === 'active') {
        throw new AppError('Ya tienes este plan activo', 400);
      }

      // Get the appropriate price based on billing cycle
      let amount: number;
      if (planKey === 'esencial') {
        // Esencial is a 15-day plan, no annual option
        amount = plan.priceMonthly;
      } else {
        amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
      }

      // Cancel any existing pending subscriptions for this user
      await Subscription.updateMany(
        { userId, status: 'pending' },
        { status: 'cancelled' }
      );

      // Generate unique reference
      const reference = generateSubscriptionReference(userId, planKey);

      // Get checkout info for frontend payment form
      const checkoutInfo = wompiService.getSubscriptionCheckoutInfo({
        planKey,
        planName: plan.name,
        amount,
        billingCycle: planKey === 'esencial' ? 'monthly' : billingCycle,
        reference,
      });

      // Store pending subscription
      await Subscription.create({
        userId,
        planKey,
        price: amount,
        startDate: new Date(),
        renewalDate: calculateRenewalDate(billingCycle, planKey),
        paymentGateway: 'wompi',
        status: 'pending',
        lastInvoiceId: reference,
      });

      logger.info(`Subscription checkout created for user ${user.email}, plan: ${planKey}, reference: ${reference}`);

      res.status(200).json({
        success: true,
        data: {
          ...checkoutInfo,
          planKey,
          features: plan.features,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process subscription payment with card
   * POST /api/subscription/pay
   * @access Private
   */
  static async processPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference, cardToken, customerName, customerDocument, customerDocumentType = 'CC' } = req.body;
      const userId = String(req.user!._id);
      const user = req.user!;

      if (!reference || !cardToken || !customerName || !customerDocument) {
        throw new AppError('Faltan datos requeridos para el pago', 400);
      }

      // Find pending subscription
      const subscription = await Subscription.findOne({
        userId,
        lastInvoiceId: reference,
        status: 'pending',
      });

      if (!subscription) {
        throw new AppError('Suscripción no encontrada o ya procesada', 404);
      }

      // Process card payment
      let transaction = await wompiService.createCardTransaction({
        cardToken,
        amount: subscription.price,
        reference,
        customerEmail: user.email,
        customerName,
        customerDocument,
        customerDocumentType,
      });

      // Poll for final status if PENDING (Wompi sandbox behavior)
      if (transaction.status === 'PENDING') {
        logger.info(`Transaction ${transaction.id} is PENDING, polling for final status...`);

        // Poll up to 5 times with 2 second intervals
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            const updatedTransaction = await wompiService.getTransaction(transaction.id);
            logger.info(`Poll ${i + 1}: Transaction status is ${updatedTransaction.status}`);

            if (updatedTransaction.status !== 'PENDING') {
              transaction = updatedTransaction;
              break;
            }
          } catch (pollError: any) {
            logger.warn(`Poll ${i + 1} failed: ${pollError?.message || pollError}`);
          }
        }
      }

      if (transaction.status === 'APPROVED') {
        // Update user subscription
        user.planKey = subscription.planKey as any;
        user.planStatus = 'active';
        user.planRenewal = subscription.renewalDate;
        await user.save();

        // Update subscription status
        subscription.status = 'active';
        await subscription.save();

        // Record payment
        await Payment.create({
          userId,
          transactionId: transaction.id,
          amount: subscription.price,
          currency: 'COP',
          status: 'succeeded',
          paymentMethod: 'card',
          paymentGateway: 'wompi',
        });

        logger.info(`Subscription activated for user ${user.email}, plan: ${subscription.planKey}`);

        res.status(200).json({
          success: true,
          data: {
            status: 'APPROVED',
            transactionId: transaction.id,
            planKey: subscription.planKey,
            message: '¡Suscripción activada exitosamente!',
          },
        });
      } else {
        // Payment failed or pending
        logger.warn(`Subscription payment ${transaction.status} for user ${user.email}, reference: ${reference}`);

        res.status(200).json({
          success: true,
          data: {
            status: transaction.status,
            transactionId: transaction.id,
            message: transaction.status === 'PENDING'
              ? 'Pago pendiente de confirmación'
              : 'El pago no fue aprobado',
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Wompi webhook events for subscriptions
   * POST /api/subscription/webhook
   * @access Public (Wompi only)
   */
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const event = req.body;

      // Validate webhook signature
      if (!wompiService.validateWebhookSignature(event)) {
        logger.warn('Invalid Wompi webhook signature');
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      const transaction = event.data.transaction;
      const reference = transaction.reference;

      // Check if this is a subscription payment (reference starts with SUB-)
      if (!reference || !reference.startsWith('SUB-')) {
        // Not a subscription payment, skip
        res.status(200).json({ received: true });
        return;
      }

      logger.info(`Subscription webhook received: ${event.event}, reference: ${reference}, status: ${transaction.status}`);

      // Find the pending subscription
      const subscription = await Subscription.findOne({
        lastInvoiceId: reference,
        status: 'pending',
      });

      if (!subscription) {
        logger.warn(`Subscription not found for reference: ${reference}`);
        res.status(200).json({ received: true });
        return;
      }

      const userId = subscription.userId.toString();

      if (transaction.status === WompiTransactionStatus.APPROVED) {
        // Payment approved - activate subscription
        const user = await User.findById(userId);
        if (!user) {
          logger.error(`User not found for subscription: ${userId}`);
          res.status(200).json({ received: true });
          return;
        }

        // Update user subscription
        user.planKey = subscription.planKey as any;
        user.planStatus = 'active';
        user.planRenewal = subscription.renewalDate;
        await user.save();

        // Update subscription status
        subscription.status = 'active';
        await subscription.save();

        // Record payment
        await Payment.create({
          userId,
          transactionId: transaction.id,
          amount: transaction.amount_in_cents / 100,
          currency: transaction.currency,
          status: 'succeeded',
          paymentMethod: 'card',
          paymentGateway: 'wompi',
        });

        logger.info(`Subscription activated for user ${user.email}, plan: ${subscription.planKey}`);
      } else if (
        transaction.status === WompiTransactionStatus.DECLINED ||
        transaction.status === WompiTransactionStatus.ERROR ||
        transaction.status === WompiTransactionStatus.VOIDED
      ) {
        // Payment failed - update subscription status
        subscription.status = 'cancelled';
        await subscription.save();

        logger.warn(`Subscription payment failed for reference: ${reference}, status: ${transaction.status}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'Error processing subscription webhook');
      next(error);
    }
  }

  /**
   * Verify subscription payment status
   * GET /api/subscription/verify/:reference
   * @access Private
   */
  static async verifyPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference } = req.params;
      const userId = String(req.user!._id);

      // Find subscription by reference
      const subscription = await Subscription.findOne({
        lastInvoiceId: reference,
        userId,
      });

      if (!subscription) {
        throw new AppError('Suscripción no encontrada', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          status: subscription.status,
          planKey: subscription.planKey,
          renewalDate: subscription.renewalDate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   * POST /api/subscription/cancel
   * @access Private
   */
  static async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const paidPlans = ['esencial', 'pro', 'prime'];
      if (!paidPlans.includes(user.planKey || '')) {
        throw new AppError('No tienes una suscripción activa', 400);
      }

      // Update user to free plan (will take effect at end of billing period)
      user.planKey = 'free';
      user.planStatus = 'cancelled';
      await user.save();

      // Update subscription records
      await Subscription.updateMany(
        { userId, status: 'active' },
        { status: 'cancelled' }
      );

      logger.info(`Subscription cancelled for user ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Suscripción cancelada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current subscription
   * GET /api/subscription/current
   * @access Private
   */
  static async getCurrentSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;

      const planDetails = PLANS[user.planKey as keyof typeof PLANS] || PLANS.free;

      res.status(200).json({
        success: true,
        data: {
          currentPlan: user.planKey,
          planStatus: user.planStatus,
          renewalDate: user.planRenewal,
          planDetails: planDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
