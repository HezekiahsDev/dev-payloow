import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../types';

const QuestionSchema: Schema<IQuestion> = new Schema<IQuestion>({
  title: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reply',
    },
  ],
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

export default mongoose.model<IQuestion>('Question', QuestionSchema);
