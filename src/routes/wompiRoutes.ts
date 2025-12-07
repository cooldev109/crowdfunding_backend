import { Router } from 'express';
import express from 'express';
import {
  getWompiConfig,
  getPSEBanks,
  createCardPayment,
  createPSEPayment,
  createBancolombiaPayment,
  getTransactionStatus,
  handleWebhook,
  generateIntegrity,
  getPaymentHistory,
} from '../controllers/wompiController';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

// Public routes (no auth required)
router.get('/config', getWompiConfig);
router.get('/pse/banks', getPSEBanks);

// Webhook route (uses raw body for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Protected routes (auth required)
router.use(authGuard);

// Card payment
router.post('/card', createCardPayment);

// PSE payment
router.post('/pse', createPSEPayment);

// Bancolombia payment
router.post('/bancolombia', createBancolombiaPayment);

// Get transaction status
router.get('/transaction/:transactionId', getTransactionStatus);

// Generate integrity signature for frontend
router.post('/integrity', generateIntegrity);

// Get user's payment history
router.get('/history', getPaymentHistory);

export default router;
