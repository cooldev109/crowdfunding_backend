import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

/**
 * @route   GET /api/subscription/plans
 * @desc    Get all available subscription plans
 * @access  Public
 */
router.get('/plans', SubscriptionController.getPlans);

/**
 * @route   POST /api/subscription/checkout
 * @desc    Create checkout session - returns payment form data
 * @access  Private
 */
router.post('/checkout', authGuard, SubscriptionController.createCheckout);

/**
 * @route   POST /api/subscription/pay
 * @desc    Process subscription payment with card
 * @access  Private
 */
router.post('/pay', authGuard, SubscriptionController.processPayment);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Wompi webhook events for subscriptions
 * @access  Public (Wompi only)
 */
router.post('/webhook', SubscriptionController.handleWebhook);

/**
 * @route   GET /api/subscription/verify/:reference
 * @desc    Verify subscription payment status
 * @access  Private
 */
router.get('/verify/:reference', authGuard, SubscriptionController.verifyPayment);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel current subscription
 * @access  Private
 */
router.post('/cancel', authGuard, SubscriptionController.cancelSubscription);

/**
 * @route   GET /api/subscription/current
 * @desc    Get current user subscription
 * @access  Private
 */
router.get('/current', authGuard, SubscriptionController.getCurrentSubscription);

export default router;
