import mongoose, { Schema } from 'mongoose';
import { ICourseCart } from '../types';

const CourseCartSchema: Schema<ICourseCart> = new Schema<ICourseCart>({
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
  PaymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ICourseCart>('CourseCart', CourseCartSchema);
