import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';

export class ChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty.',
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message is too long. Please limit your message to 1,000 characters.',
        });
      }

      // Sanitize history to prevent arbitrary oversized payloads
      const sanitizedHistory = Array.isArray(history)
        ? history
            .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-10)
            .map((item) => ({
              role: item.role as 'user' | 'assistant',
              content: String(item.content).slice(0, 1000),
            }))
        : [];

      const result = await chatService.handleChat({
        message: message.trim(),
        history: sanitizedHistory,
      });

      return res.status(200).json({
        success: true,
        reply: result.reply,
        products: result.products,
        data: {
          reply: result.reply,
          products: result.products,
        },
        providerUsed: result.providerUsed,
      });
    } catch (error: any) {
      console.error('[ChatController] Error processing chat request:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: 'Unable to process your question at this moment. Please try again shortly.',
        reply: 'மன்னிக்கவும், தற்போது சேவையில் சிறு தாமதம் ஏற்பட்டுள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும் (Sorry, there was a temporary delay. Please try again shortly).',
        products: [],
      });
    }
  }
}

export const chatController = new ChatController();
