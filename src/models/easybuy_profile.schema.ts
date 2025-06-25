import mongoose, { Schema } from 'mongoose';
import { IEasyBuyProfile } from '../types';

const EasyBuyProfileSchema = new Schema<IEasyBuyProfile>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    nin: {
      type: String,
      required: true,
    },
    bvn: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      required: false,
    },

    employmentStatus: {
      type: String,
      required: true,
    },
    income: {
      type: Number,
      required: false,
    },
    deliveryInformation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EasyBuyDeliveryInformation',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEasyBuyProfile>('EasyBuyProfile', EasyBuyProfileSchema);
