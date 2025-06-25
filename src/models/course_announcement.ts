import mongoose, { Schema } from 'mongoose';
import { ICourseAnnouncement } from '../types/index';

const CourseAnnouncementSchema: Schema<ICourseAnnouncement> = new Schema<ICourseAnnouncement>({
  course_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<ICourseAnnouncement>('CourseAnnouncement', CourseAnnouncementSchema);
