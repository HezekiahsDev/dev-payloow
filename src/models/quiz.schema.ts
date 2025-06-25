import mongoose, { Schema } from 'mongoose';
import { IQuiz } from '../types';

const QuizSchema: Schema<IQuiz> = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  lesson_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'quizQuestionsSchema',
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

QuizSchema.pre('find', function (next) {
  this.populate('lesson_id').populate('questions');
  next();
});

QuizSchema.post('save', function (doc, next) {
  doc
    .populate([{ path: 'course_id' }, { path: 'lesson_id' }, { path: 'tutor_id' }, { path: 'questions' }])
    .then(() => next())
    .catch(next);
});

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
