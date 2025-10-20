import { Request, Response, NextFunction } from 'express';
import { StripeService, PLANS } from '../services/stripeService';
import { stripe } from '../services/stripeService';
import { ENV } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/errorHandler';

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
   * Create checkout session
   * POST /api/subscription/checkout
   * @access Private
   */
  static async createCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { planKey } = req.body;
      const userId = String(req.user!._id);

      if (!planKey || !['basic', 'plus', 'premium'].includes(planKey)) {
        throw new AppError('Invalid plan selected', 400);
      }

      // Success and cancel URLs
      const successUrl = `${ENV.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${ENV.CLIENT_URL}/subscription/cancel`;

      const session = await StripeService.createCheckoutSession(
        userId,
        planKey,
        successUrl,
        cancelUrl
      );

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook events
   * POST /api/subscription/webhook
   * @access Public (Stripe only)
   */
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      logger.error({ err }, 'Webhook signature verification failed');
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          logger.info('Checkout session completed');
          // Session completed, but subscription may not be active yet
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          logger.info(`Subscription ${event.type}`);
          await StripeService.handleSubscriptionSuccess(event.data.object);
          break;

        case 'customer.subscription.deleted':
          logger.info('Subscription deleted');
          await StripeService.handleSubscriptionCanceled(event.data.object);
          break;

        case 'payment_intent.succeeded':
          logger.info('Payment succeeded');
          await StripeService.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          logger.warn('Payment failed');
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'Error processing webhook');
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

      await StripeService.cancelSubscription(userId);

      res.status(200).json({
        success: true,
        message: 'Subscription cancellation initiated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer portal URL
   * GET /api/subscription/portal
   * @access Private
   */
  static async getPortalUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user!._id);
      const returnUrl = `${ENV.CLIENT_URL}/subscription/manage`;

      const portalUrl = await StripeService.createPortalSession(
        userId,
        returnUrl
      );

      res.status(200).json({
        success: true,
        data: { url: portalUrl },
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

      const planDetails = PLANS[user.planKey as keyof typeof PLANS];

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
