import mongoose, { Schema } from 'mongoose';
import { IQuizAttempt } from '../types';

const QuizAttemptSchema: Schema<IQuizAttempt> = new Schema<IQuizAttempt>({
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
  score: {
    type: Number,
    required: true,
  },
  max_score: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
