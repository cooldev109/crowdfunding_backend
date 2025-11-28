import { Request, Response, NextFunction } from 'express';
import { chatbotService, ChatMessage } from '../services/chatbotService';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/errorHandler';

/**
 * Send a message to the chatbot
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, conversationHistory } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Message is required', 400);
    }

    if (message.length > 1000) {
      throw new AppError('Message is too long (max 1000 characters)', 400);
    }

    // Validate conversation history (optional)
    let history: ChatMessage[] = [];
    if (conversationHistory) {
      if (!Array.isArray(conversationHistory)) {
        throw new AppError('Conversation history must be an array', 400);
      }

      // Limit history to last 10 messages to avoid token limits
      history = conversationHistory.slice(-10);

      // Validate each message
      for (const msg of history) {
        if (!msg.role || !msg.content) {
          throw new AppError('Invalid message in conversation history', 400);
        }
        if (!['user', 'assistant'].includes(msg.role)) {
          throw new AppError('Invalid role in conversation history', 400);
        }
      }
    }

    // Get response from chatbot service
    const response = await chatbotService.getChatResponse(message.trim(), history);

    // Log the interaction
    logger.info({
      userMessage: message.slice(0, 100), // Log first 100 chars
      responseLength: response.message.length,
    }, 'Chatbot interaction');

    res.status(200).json({
      success: true,
      data: {
        message: response.message,
        suggestedQuestions: response.suggestedQuestions,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error({ err: error }, 'Error in chatbot controller');

    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError('Failed to process chatbot message', 500));
  }
};

/**
 * Get suggested questions (for initial chat widget load)
 */
export const getSuggestedQuestions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const suggestions = [
      "How do I create an account?",
      "What's the minimum investment requirement?",
      "How are projects vetted?",
      "Is my investment secure?",
      "What subscription plans do you offer?",
    ];

    res.status(200).json({
      success: true,
      data: {
        suggestions,
      },
    });

  } catch (error: any) {
    logger.error({ err: error }, 'Error getting suggested questions');
    return next(new AppError('Failed to get suggested questions', 500));
  }
};
