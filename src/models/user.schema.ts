import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/index';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const emailValidator = {
  validator: (value: string) => validator.isEmail(value),
  message: 'Please provide a valid email',
};

export enum BnvStatus {
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

export enum EasyBuyRole {
  BUYER = 'buyer',
  PARTNER = 'partner',
}

const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: emailValidator,
    },
    balance: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
    },
    bvn: {
      type: Number,
      default: null,
    },
    bnvStatus: {
      type: String,
      enum: BnvStatus,
      default: null,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    virtualAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VirtualAccount',
    },
    password: {
      type: String,
      required: true,
    },
    accountDisabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'user', 'superAdmin', 'tutor', 'partner', 'investor'],
      default: 'admin',
    },
    pin: {
      type: Boolean,
      default: false,
    },
    transactionPin: {
      type: String,
      default: null,
    },
    isStep: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    referenceId: {
      type: String,
      default: null,
    },
    previousReference: [
      {
        title: String,
        body: String,
        code: String,
      },
    ],
    resetPasswordExpire: {
      type: Date,
    },
    country: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    Address: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isTutorVerified: {
      type: Boolean,
      default: false,
    },
    bvnVerified: {
      type: Boolean,
      default: false,
    },
    dva: {
      type: Schema.Types.ObjectId,
      ref: 'DVA',
    },
    resetPasswordToken: String,

    paystackCustomerCode: {
      type: String,
      default: null,
    },
    referralCode: {
      type: String,
      default: null,
    },

    easyBuyRole: {
      type: String,
      required: false,
      enum: Object.values(EasyBuyRole),
      default: null,
    },
    easyBuyProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EasyBuyProfile',
    },

    notification: [{ title: String, body: String, createdAt: String }],
    profilePicture: String,
    publicId: String,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  return isMatch;
};

userSchema.pre<IUser & mongoose.Document>('save', async function (next) {
  if (this.role === 'user') {
    this.isTutorVerified = null;
  }
});

export default mongoose.model<IUser>('User', userSchema);
