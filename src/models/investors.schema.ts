import { Schema, model, Document ,Types } from 'mongoose';
// import IUser from './user.schema';
import { IUser } from '../types';

export interface IInvestor extends Document {
  user: Types.ObjectId | IUser;
  contactEmail: string;
  contactPhoneNumber: string; 
  isInvestorVerified: boolean;
  industry: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InvestorSchema = new Schema({
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
  isInvestorVerified: {
    type: Boolean,
    default: false
  },
  industry: [{
    type: String,
    maxlength: 3
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date, 
    default: Date.now
  }
}, {
  timestamps: true,
});

InvestorSchema.index({ user: 1, isInvestorVerified: 1 });

export default model<IInvestor>('Investor', InvestorSchema, 'investor');
