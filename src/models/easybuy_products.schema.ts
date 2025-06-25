import mongoose, { Schema, Document } from 'mongoose';
import { IEasyBuyProduct } from '../types';

const EasyBuyProductSchema = new Schema<IEasyBuyProduct>(
  {
    // This refers to the user who created the product
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    color: {
      type: [String],
      required: false,
      default: [],
    },

    isFeatured: {
      type: Boolean,
      required: true,
      default: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EasyBuyCategories',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    additionalImages: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'File',
      required: false,
      default: [],
    },

    additionalImagesUrls: {
      type: [String],
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEasyBuyProduct>('EasyBuyProduct', EasyBuyProductSchema);
