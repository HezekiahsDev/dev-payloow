import { Document } from 'mongoose';
import { IEasyBuyOrders } from '../types/index';
import mongoose, { Schema } from 'mongoose';

export enum EasyBuyOrdersPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum EasyBuyOrdersOrderStatus {
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export enum EasyBuyOrdersPaymentMethod {
  WALLET = 'wallet',
  FLUTTERWAVE = 'flutterwave',
}

export enum EasyBuyOrdersInstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum EasyBuyOrdersInstallmentPlan {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

const EasyBuyOrdersSchema: Schema<IEasyBuyOrders> = new Schema<IEasyBuyOrders>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EasyBuyProduct', // Referencing the products in the cart
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true, // Assuming price is fixed for each product
        },
        partner: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: Object.values(EasyBuyOrdersPaymentStatus),
      default: EasyBuyOrdersPaymentStatus.PENDING,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    discountedAmount: {
      type: Number,
      required: false,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: Object.values(EasyBuyOrdersOrderStatus),
      default: EasyBuyOrdersOrderStatus.PROCESSING,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(EasyBuyOrdersPaymentMethod), // Example payment methods
      required: true,
    },

    isDiscounted: {
      type: Boolean,
      default: false,
    },
    transactionReference: {
      type: String,
      required: true,
    },

    installmentDetails: {
      isInstallment: {
        type: Boolean,
        default: false,
      },

      installmentPlan: {
        type: String,
        enum: Object.values(EasyBuyOrdersInstallmentPlan),
        required: false,
        default: null,
      },

      installments: [
        {
          amount: {
            type: Number,
            required: true, // Amount for this installment
          },
          dueDate: {
            type: Date,
            required: true, // Due date for the installment
          },
          status: {
            type: String,
            enum: Object.values(EasyBuyOrdersInstallmentStatus), // Status of the installment
            default: EasyBuyOrdersInstallmentStatus.PENDING,
          },
          paymentDate: {
            type: Date,
            required: false, // Date when the installment was paid
            default: null,
          },
        },
      ],
      orderId: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexing the user field for quick lookups
EasyBuyOrdersSchema.index({ user: 1 });

export default mongoose.model<IEasyBuyOrders>('EasyBuyOrders', EasyBuyOrdersSchema);
