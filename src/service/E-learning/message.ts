import Joi from 'joi';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import customError from '../../utils/custom.errors';
import messagesSchema from '../../models/messages.schema';

class MessageService {
  async sendMessage(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      text: Joi.string().required(),
      course_id: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const message = new messagesSchema({
      text: data.text,
      sender_id: req.user?._id,
      course_id: data.course_id,
    });

    await message.save();

    return {
      message: 'Message sent successfully',
      statusCode: StatusCodes.OK,
      data: message,
    };
  }

  async replyToMessage(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      text: Joi.string().required(),
      message_id: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const originalMessage = await messagesSchema.findById(data.message_id);
    if (!originalMessage) throw new customError('Message not found', StatusCodes.NOT_FOUND);

    const reply = new messagesSchema({
      text: data.text,
      sender_id: req.user?._id,
      course_id: originalMessage.course_id,
      reply_to: data.message_id,
    });

    await reply.save();

    return {
      message: 'Reply sent successfully',
      statusCode: StatusCodes.OK,
      data: reply,
    };
  }

  async getMessageWithReplies(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      message_id: Joi.string().required(),
    }).validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const message = await messagesSchema.findById(data.message_id);
    if (!message) throw new customError('Message not found', StatusCodes.NOT_FOUND);

    const replies = await messagesSchema.find({ reply_to: data.message_id }).sort({ createdAt: -1 });

    return {
      message: 'Message with replies retrieved successfully',
      statusCode: StatusCodes.OK,
      data: { message, replies },
    };
  }

  async getAllMessagesForUser(req: AuthRequest) {
    const messages = await messagesSchema.find({ sender_id: req.user?._id, reply_to: null }).sort({ createdAt: -1 });

    return {
      message: 'Messages retrieved successfully',
      statusCode: StatusCodes.OK,
      data: messages,
    };
  }

  async updateMessage(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      message_id: Joi.string().required(),
      text: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const message = await messagesSchema.findById(data.message_id);
    if (!message) throw new customError('Message not found', StatusCodes.NOT_FOUND);

    message.text = data.text;
    await message.save();

    return {
      message: 'Message updated successfully',
      statusCode: StatusCodes.OK,
      data: message,
    };
  }

  async deleteMessage(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      message_id: Joi.string().required(),
    }).validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const message = await messagesSchema.findById(data.message_id);
    if (!message) throw new customError('Message not found', StatusCodes.NOT_FOUND);

    await messagesSchema.deleteOne({ _id: data.message_id });
    await messagesSchema.deleteMany({ reply_to: data.message_id });

    return {
      message: 'Message and replies deleted successfully',
      statusCode: StatusCodes.OK,
    };
  }
}

export default new MessageService();
