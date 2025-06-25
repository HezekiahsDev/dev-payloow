import mongoose, { Schema } from 'mongoose';
import { IProgress } from '../types';

const StudentCourseProgressSchema: Schema<IProgress> = new Schema<IProgress>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    progressPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StudentCourseProgressSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

StudentCourseProgressSchema.methods.calculateProgress = async function () {
  const course = await mongoose.model('Course').findById(this.course_id).populate('sections');

  if (!course) throw new Error('Course not found');

  const totalLessons = await mongoose.model('Lesson').countDocuments({ course_id: this.course_id });
  const completedLessons = this.completedLessons.length;

  this.progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  await this.save();
};

StudentCourseProgressSchema.methods.markLessonCompleted = async function (lessonId: string) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    await this.calculateProgress();
  }
  return this;
};

export default mongoose.model('Progress', StudentCourseProgressSchema);
