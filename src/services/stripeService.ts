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

// Plan type definition
export type PlanKey = 'free' | 'esencial' | 'pro' | 'prime';

// Plan configurations
export const PLANS: Record<PlanKey, {
  name: string;
  price: number;
  priceMonthly: number;
  priceAnnual: number;
  interval: string;
  priceId: string | null;
  priceIdAnnual?: string | null;
  features: string[];
  limits: {
    projectsPerMonth: number;
    simulationsPerMonth: number;
  };
}> = {
  free: {
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    interval: 'forever',
    priceId: null, // No Stripe price for free plan
    features: [
      'Browse all projects',
      'View project details',
      'Basic ROI calculator',
      'Community support',
      'Investment tracking',
    ],
    limits: {
      projectsPerMonth: 10,
      simulationsPerMonth: 5,
    },
  },
  esencial: {
    name: 'Esencial',
    price: 49000,
    priceMonthly: 49000,
    priceAnnual: 49000, // 15-day plan, no annual option
    interval: '15 días',
    priceId: process.env.STRIPE_PRICE_ESENCIAL || 'price_esencial',
    features: [
      'Acceso completo al listado de remates',
      'Programar alertas personalizadas',
      'Guardar tus remates favoritos',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: 5,
    },
  },
  pro: {
    name: 'Pro',
    price: 98000,
    priceMonthly: 98000,
    priceAnnual: 823200, // 30% discount
    interval: 'mes',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    priceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
    features: [
      'Todo lo del plan Esencial',
      'Evaluador de inversiones',
      '1 Masterclass mensual con expertos',
      'Top 2 oportunidades de la semana',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: -1, // Unlimited
    },
  },
  prime: {
    name: 'Prime',
    price: 139000,
    priceMonthly: 139000,
    priceAnnual: 1167600, // 30% discount
    interval: 'mes',
    priceId: process.env.STRIPE_PRICE_PRIME || 'price_prime',
    priceIdAnnual: process.env.STRIPE_PRICE_PRIME_ANNUAL || 'price_prime_annual',
    features: [
      'Todo lo del plan Esencial',
      'Evaluador de inversiones',
      '2 Masterclass mensuales',
      'Top 3 oportunidades de la semana',
      '1 consultoría mensual con nuestro equipo experto',
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
    planKey: PlanKey,
    successUrl: string,
    cancelUrl: string,
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const plan = PLANS[planKey];
      if (!plan || planKey === 'free') {
        throw new AppError('Invalid plan or plan not available', 400);
      }

      // Get the appropriate price ID based on billing cycle
      let priceId = plan.priceId;
      if (billingCycle === 'annual' && plan.priceIdAnnual) {
        priceId = plan.priceIdAnnual;
      }

      if (!priceId) {
        throw new AppError('Price not configured for this plan', 400);
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
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
          planKey: planKey,
          billingCycle: billingCycle,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planKey: planKey,
            billingCycle: billingCycle,
          },
        },
      });

      logger.info(
        `Checkout session created for user ${user.email}, plan: ${planKey}, billing: ${billingCycle}`
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
      const planKey = subscription.metadata.planKey as PlanKey;

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

      // Validate renewal date
      if (subscription.current_period_end) {
        const renewalDate = new Date(subscription.current_period_end * 1000);
        if (!isNaN(renewalDate.getTime())) {
          user.planRenewal = renewalDate;
        } else {
          logger.warn(`Invalid renewal date for subscription: ${subscription.id}`);
        }
      }

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
      const { userId, subscriptionId, investmentId } = paymentIntent.metadata;

      if (!userId) {
        return; // Skip if no userId in metadata
      }

      // Record payment with proper links
      await Payment.create({
        userId: userId,
        ...(subscriptionId && { subscriptionId }),
        ...(investmentId && { investmentId }),
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        method: 'stripe',
      });

      logger.info(`Payment recorded for user ${userId}${subscriptionId ? `, subscription: ${subscriptionId}` : ''}${investmentId ? `, investment: ${investmentId}` : ''}`);
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

  /**
   * Create Payment Intent for project investment
   */
  static async createInvestmentPaymentIntent(
    userId: string,
    projectId: string,
    amount: number,
    investmentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
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

      // Create Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId: userId,
          projectId: projectId,
          investmentId: investmentId,
          type: 'investment',
        },
        description: `Investment in project ${projectId}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(
        `Payment Intent created for investment ${investmentId}: ${paymentIntent.id}`
      );

      return paymentIntent;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create payment intent');
      throw error;
    }
  }

  /**
   * Handle successful investment payment
   */
  static async handleInvestmentPaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const { userId, projectId, investmentId } = paymentIntent.metadata;

      if (!investmentId) {
        logger.warn('Payment intent missing investmentId in metadata');
        return;
      }

      const { Investment } = await import('../models/Investment');
      const { Project } = await import('../models/Project');

      // Update investment status
      const investment = await Investment.findById(investmentId);
      if (!investment) {
        logger.error(`Investment ${investmentId} not found`);
        return;
      }

      investment.status = 'completed';
      investment.transactionId = paymentIntent.id;
      await investment.save();

      // Update project funding with atomic operation to prevent over-funding
      const project = await Project.findById(projectId);
      if (project) {
        const newFundedAmount = project.fundedAmount + investment.amount;

        // Check if target reached
        const isFunded = newFundedAmount >= project.targetAmount;

        // Use atomic operation to prevent race conditions
        await Project.findByIdAndUpdate(
          projectId,
          {
            $inc: {
              fundedAmount: investment.amount,
              totalInvestors: 1
            },
            ...(isFunded && { status: 'funded' }) // Update status if funded
          },
          { new: true }
        );

        if (isFunded) {
          logger.info(
            `Project ${projectId} fully funded! Total: $${newFundedAmount}. Funded by ${project.totalInvestors + 1} investors.`
          );
        }
      }

      // Record payment with investmentId link
      await Payment.create({
        userId: userId,
        investmentId: investmentId,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        method: 'stripe',
      });

      logger.info(
        `Investment payment completed: ${investmentId}, Transaction: ${paymentIntent.id}`
      );
    } catch (error: any) {
      logger.error(
        { err: error },
        'Failed to handle investment payment success'
      );
      throw error;
    }
  }

  /**
   * Handle failed investment payment
   */
  static async handleInvestmentPaymentFailure(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const { investmentId } = paymentIntent.metadata;

      if (!investmentId) {
        logger.warn('Payment intent missing investmentId in metadata');
        return;
      }

      const { Investment } = await import('../models/Investment');

      // Update investment status
      await Investment.findByIdAndUpdate(investmentId, {
        status: 'failed',
        notes: paymentIntent.last_payment_error?.message || 'Payment failed',
      });

      logger.info(`Investment payment failed: ${investmentId}`);
    } catch (error: any) {
      logger.error(
        { err: error },
        'Failed to handle investment payment failure'
      );
      throw error;
    }
  }

  /**
   * Process refund for investment
   */
  static async processInvestmentRefund(
    transactionId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: transactionId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);

      logger.info(
        `Refund processed: ${refund.id} for payment ${transactionId}`
      );

      return refund;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to process refund');
      throw error;
    }
  }

  /**
   * Retrieve Payment Intent
   */
  static async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to retrieve payment intent');
      throw error;
    }
  }
}

export { stripe };
