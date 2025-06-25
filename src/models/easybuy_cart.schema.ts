import mongoose, { Schema } from 'mongoose';
import { IEasyBuyCart } from '../types';

const EasyBuyCartSchema: Schema<IEasyBuyCart> = new Schema<IEasyBuyCart>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EasyBuyProduct',
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

// Indexing the user and product fields
EasyBuyCartSchema.index({ user: 1, product: 1 });

export default mongoose.model<IEasyBuyCart>('EasyBuyCart', EasyBuyCartSchema);
