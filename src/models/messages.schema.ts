import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const messageSchema: Schema<IMessage> = new Schema<IMessage>(
  {
    text: {
      type: String,
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    reply_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', messageSchema);
