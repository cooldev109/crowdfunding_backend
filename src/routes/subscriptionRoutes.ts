import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authGuard } from '../middlewares/authGuard';
import express from 'express';

const router = Router();

/**
 * @route   GET /api/subscription/plans
 * @desc    Get all available subscription plans
 * @access  Public
 */
router.get('/plans', SubscriptionController.getPlans);

/**
 * @route   POST /api/subscription/checkout
 * @desc    Create Stripe checkout session
 * @access  Private
 */
router.post('/checkout', authGuard, SubscriptionController.createCheckout);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe only)
 * @note    Must be BEFORE express.json() middleware to get raw body
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  SubscriptionController.handleWebhook
);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel current subscription
 * @access  Private
 */
router.post('/cancel', authGuard, SubscriptionController.cancelSubscription);

/**
 * @route   GET /api/subscription/portal
 * @desc    Get Stripe customer portal URL
 * @access  Private
 */
router.get('/portal', authGuard, SubscriptionController.getPortalUrl);

/**
 * @route   GET /api/subscription/current
 * @desc    Get current user subscription
 * @access  Private
 */
router.get('/current', authGuard, SubscriptionController.getCurrentSubscription);

export default router;
