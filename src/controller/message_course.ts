import { Response } from 'express';
import { AuthRequest } from '../types/index';
import { response } from '../utils/response';
import message from '../service/E-learning/message';

class Messages {
  async sendMessage(req: AuthRequest, res: Response) {
    const data = await message.sendMessage(req);
    res.status(data.statusCode).json(response(data.message, data.data));
  }

  async replyToMessage(req: AuthRequest, res: Response) {
    const data = await message.replyToMessage(req);
    res.status(data.statusCode).json(response(data.message, data.data));
  }

  async getReplies(req: AuthRequest, res: Response) {
    const data = await message.getAllMessagesForUser(req);
    res.status(data.statusCode).json(response(data.message, data.data));
  }

  async getMessagesForUser(req: AuthRequest, res: Response) {
    const data = await message.getAllMessagesForUser(req);
    res.status(data.statusCode).json(response(data.message, data.data));
  }

  async updateMessage(req: AuthRequest, res: Response) {
    const data = await message.updateMessage(req);
    res.status(data.statusCode).json(response(data.message));
  }

  async getMessageWithReplies(req: AuthRequest, res: Response) {
    const data = await message.getMessageWithReplies(req);
    res.status(data.statusCode).json(response(data.message, data.data));
  }

  async deleteMessage(req: AuthRequest, res: Response) {
    const data = await message.deleteMessage(req);
    res.status(data.statusCode).json(response(data.message));
  }
}

export default new Messages();
