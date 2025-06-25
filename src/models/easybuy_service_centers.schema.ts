import mongoose, { Schema } from 'mongoose';
import { IEasyBuyServiceCenters } from '../types';

const EasyBuyServiceCentersSchema: Schema<IEasyBuyServiceCenters> = new Schema<IEasyBuyServiceCenters>(
  {
    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    partner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },

  {
    timestamps: true,
  }
);

// Indexing the user and product fields
EasyBuyServiceCentersSchema.index({ partner: 1 });

export default mongoose.model<IEasyBuyServiceCenters>('EasyBuyServiceCenters', EasyBuyServiceCentersSchema);
