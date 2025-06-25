import mongoose, { Schema } from 'mongoose';

export interface IVTU {
  topUpAccount?: 0 | 1 | 2;
  token: string;
}

const VTUSchema: Schema<IVTU> = new Schema<IVTU>(
  {
    topUpAccount: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVTU>('VTU', VTUSchema);
