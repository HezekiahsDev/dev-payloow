import { Document, Types } from "mongoose";

export interface IFile extends Document {
  _id: Types.ObjectId;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}