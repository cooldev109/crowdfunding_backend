import OpenAI from 'openai';
import { ENV } from '../config/env';
import { logger } from '../config/logger';
import { CHATBOT_SYSTEM_PROMPT, COMMON_QUESTIONS_AND_ANSWERS } from '../data/chatbot-knowledge';

// Message interface
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  suggestedQuestions?: string[];
}

class ChatbotService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (ENV.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: ENV.OPENAI_API_KEY,
      });
      logger.info('OpenAI chatbot initialized');
    } else {
      logger.warn('OpenAI API key not found - chatbot will use fallback responses');
    }
  }

  /**
   * Check if a question matches any common question (for instant responses)
   */
  private findQuickAnswer(userMessage: string): string | null {
    const normalizedMessage = userMessage.toLowerCase().trim();

    for (const qa of COMMON_QUESTIONS_AND_ANSWERS) {
      const questionLower = qa.question.toLowerCase();

      // Check for exact or partial match
      if (
        normalizedMessage.includes(questionLower) ||
        questionLower.includes(normalizedMessage) ||
        this.calculateSimilarity(normalizedMessage, questionLower) > 0.7
      ) {
        return qa.answer;
      }
    }

    return null;
  }

  /**
   * Simple string similarity calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get suggested follow-up questions based on context
   */
  private getSuggestedQuestions(userMessage: string): string[] {
    const messageLower = userMessage.toLowerCase();

    // Investment-related questions
    if (messageLower.includes('invest') || messageLower.includes('project')) {
      return [
        "How are projects vetted?",
        "What's the minimum investment?",
        "How do I receive returns?"
      ];
    }

    // Account/signup questions
    if (messageLower.includes('account') || messageLower.includes('sign') || messageLower.includes('register')) {
      return [
        "Is InvestFlow free to use?",
        "What's included in the Free plan?",
        "How do I invest in a project?"
      ];
    }

    // Security questions
    if (messageLower.includes('safe') || messageLower.includes('secure') || messageLower.includes('risk')) {
      return [
        "Is my investment secure?",
        "What happens if a project fails?",
        "Are you regulated?"
      ];
    }

    // Premium/subscription questions
    if (messageLower.includes('premium') || messageLower.includes('subscription') || messageLower.includes('plan')) {
      return [
        "What are the benefits of Premium membership?",
        "Can I upgrade or downgrade my plan?",
        "How do I cancel my subscription?"
      ];
    }

    // Default suggestions
    return [
      "How do I invest in a project?",
      "What's the minimum investment?",
      "Is my investment secure?"
    ];
  }

  /**
   * Get response from AI or fallback
   */
  async getChatResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // First, check for quick answers
      const quickAnswer = this.findQuickAnswer(userMessage);
      if (quickAnswer) {
        logger.info('Returning quick answer for common question');
        return {
          message: quickAnswer,
          suggestedQuestions: this.getSuggestedQuestions(userMessage),
        };
      }

      // If OpenAI is not available, provide a helpful fallback
      if (!this.openai) {
        return this.getFallbackResponse(userMessage);
      }

      // Build messages array for OpenAI
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: CHATBOT_SYSTEM_PROMPT,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: ENV.OPENAI_MODEL || 'gpt-4',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response. Please try again or contact our support team.";

      logger.info('AI chatbot response generated successfully');

      return {
        message: aiResponse,
        suggestedQuestions: this.getSuggestedQuestions(userMessage),
      };

    } catch (error: any) {
      logger.error({ err: error }, 'Error in chatbot service');

      // Return fallback response on error
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Fallback response when OpenAI is not available
   */
  private getFallbackResponse(userMessage: string): ChatResponse {
    const messageLower = userMessage.toLowerCase();

    // Simple keyword-based responses
    if (messageLower.includes('hello') || messageLower.includes('hi')) {
      return {
        message: "Hello! 👋 I'm InvestHelper, your guide to InvestFlow. I can help you understand our platform, answer questions about investing, and guide you through the investment process. What would you like to know?",
        suggestedQuestions: [
          "How do I create an account?",
          "What's the minimum investment?",
          "How does the platform work?"
        ],
      };
    }

    if (messageLower.includes('help')) {
      return {
        message: "I'm here to help! I can answer questions about:\n\n• Creating an account and getting started\n• How to invest in projects\n• Subscription plans and pricing\n• Security and safety\n• Platform features\n\nWhat specific topic would you like to know more about?",
        suggestedQuestions: this.getSuggestedQuestions(userMessage),
      };
    }

    // Default fallback
    return {
      message: "I'm currently unable to process your question with AI assistance. However, I can help you with:\n\n• General platform information\n• Investment process\n• Account creation\n• Subscription plans\n\nFor detailed assistance, please contact our support team at contact@investflow.com or browse our FAQ section. Is there a specific topic from above you'd like to know about?",
      suggestedQuestions: [
        "How do I create an account?",
        "What's the minimum investment?",
        "How do I contact support?"
      ],
    };
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
