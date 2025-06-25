import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../types/index';

export enum TransactionType {
  CHARGE = 'charge',
  DEPOSIT = "deposit",
  TRANSFER = 'transfer',
  VIRTUAL_ACCOUNT = 'virtual-account-funding',
  EASY_BUY = 'easybuy',
  COURSE_PAYMENT = 'course-payment',
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum TransactionMethodType {
  CREDIT = "credit",
  DEBIT = "debit"
}

export enum TransactionMerchant {
  FLUTTERWAVE  = "flutterwave",
  PAYSTACK =  "paystack",
  PAYLOOW = "payloow"
}

const transactionsSchema: Schema<ITransaction> = new Schema<ITransaction>(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },

    methodType: {
      type: String,
      enum: TransactionMethodType,
    },
    amount: {
      type: Number,
      required: true,
    },

    merchant: {
      type: String,
      enum: TransactionMerchant,
      required: true
  
    },

    status: {
      type: String,
      enum: TransactionStatus,
      required: true,
    },
    reference : {
      type: String,
      required: false,
    },
    narration: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('transactions', transactionsSchema);
