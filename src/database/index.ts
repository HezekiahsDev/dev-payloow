import mongoose from 'mongoose';
import customError from '../utils/custom.errors';
import { StatusCodes } from 'http-status-codes';

export const connectDB = async (url: string) => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!url || url.trim() === '') {
      throw new Error('MongoDB connection string is empty or undefined');
    }
    
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000,
      dbName: "payloow"
    });
    
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection error:', (error as Error).message);
    console.error('Connection URL (masked):', url ? `${url.substring(0, 8)}...` : 'undefined');
    throw new customError(
      `Database connection failed: ${(error as Error).message}`, 
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
