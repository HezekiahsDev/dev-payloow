import mongoose, { Schema } from 'mongoose';
import { ICourse } from '../types';

const CourseSchema: Schema<ICourse> = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  duration: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount_price: {
    type: Number,
    default: null,
  },
  category: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: String,
    },
  ],
  sections: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
  ],
  lessons_count: {
    type: Number,
    default: 0,
  },
  students_enrolled: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  thumbnailUrl: { type: String, required: false },
  public_id: { type: String, required: false },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

CourseSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<ICourse>('Course', CourseSchema);
