import { IDva } from '../types/index';
import mongoose, { Schema } from 'mongoose';

const DvaSchema: Schema<IDva> = new Schema<IDva>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    },
    customerCode: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    dvaReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDva>('Dva', DvaSchema);
