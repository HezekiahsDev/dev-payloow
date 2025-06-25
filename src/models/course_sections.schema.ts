import mongoose, { Schema } from 'mongoose';
import { ISection } from '../types';

const SectionSchema: Schema<ISection> = new Schema<ISection>(
  {
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  },
  { timestamps: true }
);

export default mongoose.model<ISection>('Section', SectionSchema);
