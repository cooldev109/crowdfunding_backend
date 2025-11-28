import express from 'express';
import * as chatbotController from '../controllers/chatbotController';

const router = express.Router();

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot
 * @access  Public
 */
router.post('/message', chatbotController.sendMessage);

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Get suggested questions
 * @access  Public
 */
router.get('/suggestions', chatbotController.getSuggestedQuestions);

export default router;
