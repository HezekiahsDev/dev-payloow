import mongoose, { Schema } from 'mongoose';
import { ITutorReply } from '../types';

const ReplySchema: Schema<ITutorReply> = new Schema<ITutorReply>({
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true,
  },
  reply: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ITutorReply>('Reply', ReplySchema);
