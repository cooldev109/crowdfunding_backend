import Stripe from 'stripe';
import { ENV } from '../config/env';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';

// Initialize Stripe
const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Plan configurations
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null, // No Stripe price for free plan
    features: [
      'Browse basic projects',
      'Limited project details',
      'Basic ROI calculator',
      'Email support',
    ],
    limits: {
      projectsPerMonth: 10,
      simulationsPerMonth: 5,
    },
  },
  basic: {
    name: 'Basic',
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_BASIC || 'price_basic',
    features: [
      'All Free features',
      'Access to 50+ projects',
      'Advanced ROI calculator',
      'Investment recommendations',
      'Priority email support',
    ],
    limits: {
      projectsPerMonth: 50,
      simulationsPerMonth: 20,
    },
  },
  plus: {
    name: 'Plus',
    price: 59.99,
    priceId: process.env.STRIPE_PRICE_PLUS || 'price_plus',
    features: [
      'All Basic features',
      'Unlimited project access',
      'Premium investment opportunities',
      'Detailed analytics & reports',
      'Excel export capabilities',
      '24/7 priority support',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: 100,
    },
  },
  premium: {
    name: 'Premium',
    price: 99.99,
    priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
    features: [
      'All Plus features',
      'Exclusive premium projects',
      'Personal investment advisor',
      'Custom portfolio management',
      'API access for integrations',
      'White-label options',
      'Dedicated account manager',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: -1, // Unlimited
    },
  },
};

export class StripeService {
  /**
   * Create checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    planKey: 'basic' | 'plus' | 'premium',
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const plan = PLANS[planKey];
      if (!plan || !plan.priceId) {
        throw new AppError('Invalid plan or plan not available', 400);
      }

      // Check if user already has this plan
      if (user.planKey === planKey && user.planStatus === 'active') {
        throw new AppError('You already have this plan', 400);
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
          planKey: planKey,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planKey: planKey,
          },
        },
      });

      logger.info(
        `Checkout session created for user ${user.email}, plan: ${planKey}`
      );

      return session;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create checkout session');
      throw error;
    }
  }

  /**
   * Handle successful subscription payment
   */
  static async handleSubscriptionSuccess(
    subscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      const planKey = subscription.metadata.planKey as
        | 'basic'
        | 'plus'
        | 'premium';

      if (!userId || !planKey) {
        throw new AppError('Missing metadata in subscription', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update user subscription
      user.planKey = planKey;
      user.planStatus = 'active';
      user.planRenewal = new Date(subscription.current_period_end * 1000);
      await user.save();

      // Create subscription record
      await Subscription.create({
        userId: userId,
        planKey: planKey,
        price: PLANS[planKey].price,
        startDate: new Date(subscription.current_period_start * 1000),
        renewalDate: new Date(subscription.current_period_end * 1000),
        paymentGateway: 'stripe',
        status: 'active',
        lastInvoiceId: subscription.latest_invoice as string,
      });

      logger.info(
        `Subscription activated for user ${user.email}, plan: ${planKey}`
      );
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to handle subscription success');
      throw error;
    }
  }

  /**
   * Handle subscription cancellation
   */
  static async handleSubscriptionCanceled(
    subscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const userId = subscription.metadata.userId;

      if (!userId) {
        throw new AppError('Missing userId in subscription metadata', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update user to free plan
      user.planKey = 'free';
      user.planStatus = 'expired';
      user.planRenewal = undefined;
      await user.save();

      // Update subscription record
      await Subscription.updateMany(
        { userId: userId, status: 'active' },
        { status: 'canceled' }
      );

      logger.info(`Subscription canceled for user ${user.email}`);
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to handle subscription cancellation');
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  static async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const userId = paymentIntent.metadata.userId;

      if (!userId) {
        return; // Skip if no userId in metadata
      }

      // Record payment
      await Payment.create({
        userId: userId,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        method: 'stripe',
      });

      logger.info(`Payment recorded for user ${userId}`);
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to record payment');
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.stripeCustomerId) {
        throw new AppError('No active subscription found', 400);
      }

      // Find active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
      });

      if (subscriptions.data.length === 0) {
        throw new AppError('No active subscription found', 400);
      }

      // Cancel the subscription
      await stripe.subscriptions.cancel(subscriptions.data[0].id);

      logger.info(`Subscription cancellation initiated for user ${user.email}`);
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to cancel subscription');
      throw error;
    }
  }

  /**
   * Get customer portal URL
   */
  static async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<string> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        throw new AppError('No Stripe customer found', 400);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create portal session');
      throw error;
    }
  }
}

export { stripe };
