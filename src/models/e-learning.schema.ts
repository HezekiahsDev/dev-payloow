import mongoose, { Schema } from 'mongoose';
import { ITutors } from '../types';

const tutorProfile: Schema<ITutors> = new Schema<ITutors>(
  {
    isVerified: {
      type: Boolean,
      default: false,
    },
    tutor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tutor_name: {
      type: String,
      required: true,
    },
    tutor_email: {
      type: String,
      required: true,
    },
    tutor_phone: {
      type: String,
      required: true,
    },
    tutor_about: {
      type: String,
      required: true,
    },
    tutor_image: {
      type: String,
      required: true,
    },
    tutor_qualification: {
      type: String,
      required: true,
    },
    tutor_experience: {
      type: String,
      required: true,
    },
    tutor_achievements: {
      type: String,
      required: true,
    },
    tutor_facebook: {
      type: String,
      required: true,
    },
    tutor_twitter: {
      type: String,
      required: true,
    },
    tutor_linkedin: {
      type: String,
      required: true,
    },
    tutor_instagram: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITutors>('TutorProfile', tutorProfile);
