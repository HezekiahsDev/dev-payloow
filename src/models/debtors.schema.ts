import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from '../types';

export interface IDebtor extends Document {
  user: Types.ObjectId | IUser;
  contactEmail: string;
  contactPhoneNumber: string;
  payloowCreditScore: number;
  proofOfCreditScore?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhoneNumber: {
    type: String,
    required: true
  },
  payloowCreditScore: {
    type: Number,
    default: 300
  },
  proofOfCreditScore: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

DebtorSchema.index({ user: 1 });
DebtorSchema.index({ payloowCreditScore: 1 });

export default model<IDebtor>('Debtor', DebtorSchema, 'debtor');
