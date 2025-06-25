import mongoose, { Schema } from 'mongoose';
import { IWallet } from '../types/index';

const Wallet: Schema<IWallet> = new Schema<IWallet>(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>('Wallet', Wallet);
