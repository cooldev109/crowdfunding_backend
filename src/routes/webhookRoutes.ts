import express, { Request, Response } from 'express';
import { stripe, StripeService } from '../services/stripeService';
import { ENV } from '../config/env';
import { logger } from '../config/logger';

const router = express.Router();

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * IMPORTANT: This route must use raw body parser, not JSON parser
 * Register this route BEFORE app.use(express.json()) in server.ts
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: any;

    try {
      // Verify webhook signature
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
      logger.info(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        // ==================== SUBSCRIPTION EVENTS ====================
        case 'checkout.session.completed':
          logger.info('Checkout session completed');
          // Session completed, subscription may not be active yet
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          logger.info(`Subscription ${event.type}`);
          await StripeService.handleSubscriptionSuccess(event.data.object);
          break;

        case 'customer.subscription.deleted':
          logger.info('Subscription cancelled');
          await StripeService.handleSubscriptionCanceled(event.data.object);
          break;

        // ==================== INVESTMENT PAYMENT EVENTS ====================
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          logger.info(
            `Payment succeeded: ${paymentIntent.id}, Type: ${paymentIntent.metadata.type || 'unknown'}`
          );

          // Check if this is an investment payment
          if (paymentIntent.metadata.type === 'investment') {
            await StripeService.handleInvestmentPaymentSuccess(paymentIntent);
          } else {
            // Handle subscription payment
            await StripeService.handlePaymentSuccess(paymentIntent);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          logger.warn(
            `Payment failed: ${paymentIntent.id}, Type: ${paymentIntent.metadata.type || 'unknown'}`
          );

          // Check if this is an investment payment
          if (paymentIntent.metadata.type === 'investment') {
            await StripeService.handleInvestmentPaymentFailure(paymentIntent);
          }
          break;
        }

        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object;
          logger.info(`Payment cancelled: ${paymentIntent.id}`);

          if (paymentIntent.metadata.type === 'investment') {
            await StripeService.handleInvestmentPaymentFailure(paymentIntent);
          }
          break;
        }

        // ==================== REFUND EVENTS ====================
        case 'charge.refunded': {
          const charge = event.data.object;
          logger.info(`Charge refunded: ${charge.id}`);
          // Additional refund handling can be added here
          break;
        }

        // ==================== INVOICE EVENTS ====================
        case 'invoice.payment_succeeded':
          logger.info('Invoice payment succeeded');
          break;

        case 'invoice.payment_failed':
          logger.warn('Invoice payment failed');
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      // Return success response to Stripe
      res.json({ received: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Error processing webhook');
      // Still return 200 to Stripe to avoid retries for processing errors
      res.status(200).json({ received: true, error: error.message });
    }
  }
);

export default router;
