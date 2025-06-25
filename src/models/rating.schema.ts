import mongoose, { Schema } from 'mongoose';
import { IRating } from '../types';

const RatingSchema: Schema<IRating> = new Schema<IRating>({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

RatingSchema.index({ course_id: 1, student_id: 1 }, { unique: true });

RatingSchema.statics.getAverageRating = async function (courseId: mongoose.Schema.Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { course_id: courseId } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, numOfReviews: { $sum: 1 } } },
  ]);

  if (result.length === 0) return;

  try {
    await mongoose.model('Course').findByIdAndUpdate(courseId, {
      averageRating: Math.ceil(result[0]?.averageRating || 0),
      numberOfReviews: result[0]?.numOfReviews || 0,
    });
  } catch (error) {
    console.error(error);
  }
};

RatingSchema.post('save', function () {
  (
    this.constructor as typeof mongoose.Model & {
      getAverageRating: (course_id: Schema.Types.ObjectId) => Promise<void>;
    }
  ).getAverageRating(this.course_id);
});

RatingSchema.post('deleteOne', { document: true, query: false }, function () {
  (
    this.constructor as typeof mongoose.Model & {
      getAverageRating: (course_id: Schema.Types.ObjectId) => Promise<void>;
    }
  ).getAverageRating(this.course_id);
});

export default mongoose.model<IRating>('Rating', RatingSchema);
