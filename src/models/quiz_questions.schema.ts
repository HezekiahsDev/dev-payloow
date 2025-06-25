import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../types';

const quizQuestionsSchema: Schema<IQuestion> = new Schema<IQuestion>({
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  question_text: {
    type: String,
    required: true,
    unique: true,
  },
  options: [
    {
      option: {
        type: String,
        required: true,
      },
      is_correct: {
        type: Boolean,
        required: true,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IQuestion>('quizQuestionsSchema', quizQuestionsSchema);
