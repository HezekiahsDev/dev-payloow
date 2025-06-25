import mongoose, { Schema } from 'mongoose';
import { ILesson } from '../types';

const LessonSchema: Schema<ILesson> = new Schema<ILesson>(
  {
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILesson>('Lesson', LessonSchema);
