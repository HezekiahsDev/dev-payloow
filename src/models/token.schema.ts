import mongoose, { Schema } from 'mongoose';
import { IToken } from '../types/index';

const tokenSchema: Schema<IToken> = new Schema<IToken>(
  {
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    isValid: {
      type: Boolean,
      required: true,
      default: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IToken>('Token', tokenSchema);
