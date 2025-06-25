import mongoose, { Schema, Document } from 'mongoose';

interface Variation {
  variationID: string;
  plan: string;
  price: string; // Keeping price as string to match your JSON data
}

interface ServiceData extends Document {
  MTN: Variation[];
  Airtel: Variation[];
  Glo: Variation[];
  '9mobile': Variation[];
  DStv: Variation[];
  Electricity: Variation[];
}

const VariationSchema: Schema = new Schema({
  variationID: { type: String, required: true },
  plan: { type: String, required: true },
  price: { type: String, required: true },
});

const ServiceDataSchema: Schema = new Schema({
  MTN: [VariationSchema],
  Airtel: [VariationSchema],
  Glo: [VariationSchema],
  '9mobile': [VariationSchema],
  DStv: [VariationSchema],
  Electricity: [VariationSchema],
});

export default mongoose.model<ServiceData>('ServiceData', ServiceDataSchema);
