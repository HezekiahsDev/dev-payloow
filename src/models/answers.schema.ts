import mongoose, { Schema } from 'mongoose';
import { IUserAnswer } from '../types';

const UserAnswerSchema: Schema<IUserAnswer> = new Schema<IUserAnswer>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selected_option: {
    type: String,
    required: true,
  },
  is_correct: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUserAnswer>('UserAnswer', UserAnswerSchema);
