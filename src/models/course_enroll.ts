import mongoose, { Schema } from 'mongoose';
import { ICourseEnroll } from '../types';

const CourseEnrollSchema: Schema<ICourseEnroll> = new Schema<ICourseEnroll>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed'],
    default: 'enrolled',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ICourseEnroll>('CourseEnroll', CourseEnrollSchema);
