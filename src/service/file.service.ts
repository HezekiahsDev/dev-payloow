import ms from "ms";
import awsService from "../libraries/aws";
import redisService from "./redis.service";
import { FileModel } from "../models/file.model";
import { CONFIG } from "../config";
import { IFile } from "../types/file";
import customError from "../utils/custom.errors";
import { StatusCodes } from "http-status-codes";

export class FileService {

  async uploadFile(options: { file: Express.Multer.File; folder: string }): Promise<IFile> {
    const uploadResult = await awsService.uploadFileToS3({ s3Bucket: CONFIG.AWS.AWS_S3_BUCKET_NAME, file: options.file, folder: options.folder });

    const key = uploadResult.split("amazonaws.com/").pop();
    const fileDocument = await FileModel.create({ key });

    return fileDocument;
  }
  async getFileUrl(options: { fileId: string; isSigned: boolean; useCloudFront?: boolean }): Promise<string> {
    // Get the file if it exists in the cache
    const cacheKey = `file:${options.fileId}:${options.isSigned}:${options.useCloudFront || false}`;
    const cachedFileUrl = await redisService.get(cacheKey);
    if (cachedFileUrl) {
      return cachedFileUrl as string;
    }

    // Get the file from the database using the fileId
    const file = await FileModel.findById(options.fileId).select(["_id", "key"]).lean().exec();
    if (!file) throw new customError("File not found", StatusCodes.NOT_FOUND);

    let fileUrl: string;
    let cacheTTL: number;

    if (options.isSigned && !options.useCloudFront) {
      // For signed URLs, calculate the expiration time in seconds
      const defaultExpiryMs = CONFIG.AWS.AWS_S3_SIGNED_URL_EXPIRY_DURATION ?? ms("1d");
      const expiresInSeconds = defaultExpiryMs / 1000;

      fileUrl = await awsService.getSignedUrlFromS3({
        s3Bucket: CONFIG.AWS.AWS_S3_BUCKET_NAME,
        Key: file.key,
        Expires: expiresInSeconds,
      });

      // Set cache TTL to be slightly shorter than the signed URL expiration
      // This ensures we never serve an expired URL from cache
      cacheTTL = Math.floor(expiresInSeconds * 0.9); // 90% of the signed URL expiration time
    } else if (options.useCloudFront) {
      fileUrl = await awsService.getCloudFrontURLFromS3({ Key: file.key, isSigned: options.isSigned });
      // For CloudFront URLs, use default cache duration or determine based on signature
      cacheTTL = CONFIG.FILE_CACHE_EXPIRY_DURATION / 1000;
    } else {
      // For non-signed S3 URLs, they don't expire, so use default cache duration
      fileUrl = `https://${CONFIG.AWS.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${file.key}`;
      cacheTTL = CONFIG.FILE_CACHE_EXPIRY_DURATION / 1000;
    }

    // Cache the file URL with appropriate TTL
    if (fileUrl) {
      await redisService.set(cacheKey, fileUrl, { ttl: cacheTTL });
    }

    return fileUrl;
  }


  async deleteFile(options: { fileId: string }): Promise<void> {
    // Delete the file from the cache if it exists
    await redisService.del(`file:${options.fileId}`);

    const file = await FileModel.findById(options.fileId);
    if (!file) throw new customError("File not found", StatusCodes.NOT_FOUND);
    await Promise.all([awsService.deleteFileFromS3({ s3Bucket: CONFIG.AWS.AWS_S3_BUCKET_NAME, Key: file.key }), FileModel.findByIdAndDelete(options.fileId)]);
  }
}


export default new FileService();