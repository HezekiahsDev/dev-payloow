import mongoose, { Schema } from 'mongoose';
import { IEasyBuyDeliveryInformation } from '../types';

const EasyBuyDeliveryInformationSchema = new Schema<IEasyBuyDeliveryInformation>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: true,
    },

    email: {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEasyBuyDeliveryInformation>(
  'EasyBuyDeliveryInformation',
  EasyBuyDeliveryInformationSchema
);
