import mongoose, { Schema } from 'mongoose';

export enum EasyBuyCouponType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
}

export interface IEasyByCoupon extends Document {
  type: EasyBuyCouponType;
  status: boolean;
  discount: number;
  code: string;
  description: string;
  usedBy: mongoose.Schema.Types.ObjectId[];
  maxUsage: number;
  expiryDate: Date;
  createdBy: mongoose.Schema.Types.ObjectId;
}

const EasyBuyCouponSchema = new Schema<IEasyByCoupon>(
  {
    type: {
      type: String,
      enum: Object.values(EasyBuyCouponType),
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    usedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      default: [],
    },
    maxUsage: {
      type: Number,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

EasyBuyCouponSchema.index({ usedBy: 1 });

export default mongoose.model<IEasyByCoupon>('EasyBuyCoupon', EasyBuyCouponSchema);
