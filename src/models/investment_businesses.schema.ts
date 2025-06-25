import { Schema, model, Document, Types } from 'mongoose';
import { IDebtor } from './debtors.schema';
import { IUser } from '../types';

enum BusinessStageChoice {
  IDEA_CONCEPT = 'idea_concept',
  // Add other business stage choices as needed
}

enum CustomerModelChoice {
  B2C = 'B2C',
  // Add other customer model choices as needed
}

enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REPAID = 'repaid',
  DEFAULTED = 'defaulted'
}

interface IOnline {
  website: string;
  twitter_url?: string;
  linkedIn_url?: string;
  facebook_url?: string;
  youTube_url?: string;
  instagram_url?: string;
  tikTok_url?: string;
}

interface IBusinessDetails {
  financial_statements?: string[];
  growth_plans?: string[];
  loan_requirements?: string[];
}

interface ILoan {
  loan_amount: number;
  collateral?: string;
  credit_score: number;
  status: LoanStatus;
  amount_disbursed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business extends Document {
  debtor: Types.ObjectId | IDebtor;
  user: Types.ObjectId | IUser;
  business_name: string;
  business_description: string;
  founding_date?: Date;
  business_stage: BusinessStageChoice;
  customer_model: CustomerModelChoice;
  industry: string[];
  online?: IOnline;
  business_details?: IBusinessDetails;
  loan?: ILoan;
  createdAt: Date;
  updatedAt: Date;
}

const OnlineSchema = new Schema({
  website: { type: String, required: true },
  twitter_url: String,
  linkedIn_url: String,
  facebook_url: String,
  youTube_url: String,
  instagram_url: String,
  tikTok_url: String
});

const BusinessDetailsSchema = new Schema({
  financial_statements: [String],
  growth_plans: [String],
  loan_requirements: [String]
});

const LoanSchema = new Schema({
  loan_amount: { 
    type: Number, 
    required: true 
  },
  collateral: String,
  credit_score: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(LoanStatus),
    default: LoanStatus.PENDING 
  },
  amount_disbursed: { 
    type: Number, 
    default: 0.00 
  }
}, {
  timestamps: true
});

const BusinessSchema = new Schema({
  debtor: {
    type: Schema.Types.ObjectId,
    ref: 'Debtor',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business_name: {
    type: String,
    required: true,
    maxlength: 200
  },
  business_description: {
    type: String,
    required: true,
    maxlength: 500
  },
  founding_date: Date,
  business_stage: {
    type: String,
    enum: Object.values(BusinessStageChoice),
    default: BusinessStageChoice.IDEA_CONCEPT
  },
  customer_model: {
    type: String,
    enum: Object.values(CustomerModelChoice),
    default: CustomerModelChoice.B2C
  },
  industry: [{
    type: String,
    maxlength: 3
  }],
  online: OnlineSchema,
  business_details: BusinessDetailsSchema,
  loan: LoanSchema
}, {
  timestamps: true
});

// Indexes
BusinessSchema.index({ debtor: 1, customer_model: 1 });
LoanSchema.index({ 
  interest_rate: 1, 
  loan_amount: 1, 
  repayment_term: 1, 
  credit_score: 1, 
  status: 1 
});

export default model<Business>('Business', BusinessSchema, 'business');
