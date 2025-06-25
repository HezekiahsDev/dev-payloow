import mongoose from 'mongoose';
import { ISwapEasyBuy } from 'src/types';

const SwapEasyBuy = new mongoose.Schema<ISwapEasyBuy>({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  image_view: {
    type: Map,
    of: String,
    required: true,
    validate: {
      validator: (value: Map<string, string>) => ['front', 'back', 'receipt', 'box'].every((key) => value.has(key)),
      message: 'All required image views (front, back, receipt, box) must be provided.',
    },
  },

  product_name: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  brand_name: {
    type: String,
    required: true,
  },
  model_name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

export default mongoose.model<ISwapEasyBuy>('SwapEasyBuy', SwapEasyBuy);
