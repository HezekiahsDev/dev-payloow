import mongoose from "mongoose";
import { IFile } from "../types/file";

export const FileSchema: mongoose.Schema<IFile> = new mongoose.Schema<IFile>({
  key: { type: String, required: true, unique: true },
}, { timestamps: true });

export const FileModel = mongoose.model<IFile>("File", FileSchema);