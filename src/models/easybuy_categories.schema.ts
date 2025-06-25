import mongoose, { Schema } from 'mongoose';
import { IEasyBuyCategories } from '../types';

const EasyBuyCategoriesSchema = new Schema<IEasyBuyCategories>(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEasyBuyCategories>('EasyBuyCategories', EasyBuyCategoriesSchema);
