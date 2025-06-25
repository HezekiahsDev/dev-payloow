import ms from 'ms';
import crypto from "crypto";
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '@aws-sdk/lib-storage';
import { CONFIG, DEPLOYMENT_ENV } from '../config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getSignedCloudFrontUrl } from '@aws-sdk/cloudfront-signer';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  ObjectCannedACL,
  CompleteMultipartUploadCommandOutput,
} from '@aws-sdk/client-s3';
import { AWSUploadError, AWSValidationError, AWSPermissionError, AWSBucketError } from '../utils/aws.errors';

interface UploadFileOptions {
  s3Bucket: string;
  file: Buffer;
  mimetype: string;
  fileName?: string;
  folder: string;
  ACL?: ObjectCannedACL;
}

interface GetFileOptions {
  s3Bucket: string;
  fileName: string;
  expiresIn?: number;
}

interface DeleteFileOptions {
  s3Bucket: string;
  Key: string;
}

interface GetCloudFrontURLOptions {
  Key: string;
  isSigned?: boolean;
  dateLessThan?: moment.Moment | Date;
}

// AWS S3
// =============================================================================
const s3Client = new S3Client({
  region: CONFIG.AWS.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFileToS3 = async ({
  s3Bucket,
  file,
  folder,
  fileName,
  mimetype,
  ACL = ObjectCannedACL.private,
}: UploadFileOptions) => {
  try {
    const finalFileName = fileName ? fileName : uuidv4();

    const Key = `${DEPLOYMENT_ENV}/${folder}/${finalFileName}`;

    const putObjectParams = {
      Bucket: s3Bucket,
      Key: Key,
      Body: file,
      ContentType: mimetype,
      ACL: ACL,
    };

    const upload = new Upload({
      client: s3Client,
      params: putObjectParams,
    });

    // (Optional): Monitor upload progress
    upload.on('httpUploadProgress', (progress) => {
      console.log(`Uploaded: ${progress.loaded} / ${progress.total}`);
    });

    const data = (await upload.done()) as CompleteMultipartUploadCommandOutput;

    if (!data.Location) return null;

    const location = data.Location.split('amazonaws.com/')[1];
    return location;
  } catch (error) {
    // Use Sentry to capture error
    console.log(error);
    // ("From Third-Party: fn (uploadFileToS3V2)"), { extra: { params, response: error }, level: "error" };
    return null;
  }
};

export const getSignedURLFromS3 = async ({
  s3Bucket,
  fileName,
  expiresIn = ms('24h') / 1000,
}: GetFileOptions): Promise<string | null> => {
  try {
    const getObjectParams = {
      Bucket: s3Bucket,
      Key: fileName,
    };

    const command = new GetObjectCommand(getObjectParams);

    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresIn });

    return url;
  } catch (error) {
    console.log(error);
    // Use Sentry to capture error
    return null;
  }
};

export const deleteFileFromS3 = async ({ s3Bucket, Key }: DeleteFileOptions) => {
  try {
    const deleteObjectParams = {
      Bucket: s3Bucket,
      Key: Key,
    };

    const command = new DeleteObjectCommand(deleteObjectParams);

    await s3Client.send(command);
  } catch (error) {
    console.log(error);
    // Use Sentry to capture error
    // ("From Third-Party: fn (deleteFileFromS3)"), { extra: { params, response: error }, level: "error" };
    return false;
  }
};

export const getCloudFrontURLFromS3 = async ({
  Key,
  isSigned,
  dateLessThan = moment().add(1, 'days'),
}: GetCloudFrontURLOptions) => {
  try {
    const cloudFrontUrl = `${CONFIG.AWS.CLOUD_FRONT}/${Key}`;

    if (!isSigned) return cloudFrontUrl;

    // Get signed URL for CloudFront
    const signedCloudFrontUrl = getSignedCloudFrontUrl({
      url: cloudFrontUrl,
      dateLessThan: dateLessThan.toISOString(),
      keyPairId: CONFIG.AWS.AWS_CLOUDFRONT_KEY_PAIR_ID,
      privateKey: CONFIG.AWS.AWS_CLOUDFRONT_PRIVATE_KEY,
    });

    return signedCloudFrontUrl;
  } catch (error) {
    // Use Sentry to capture error
    // ("From Third-Party: fn (getCloudFrontURLFromS3)"), { extra: { params, response: error }, level: "error" };
    return null;
  }
};

class AwsService {
  s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: CONFIG.AWS.AWS_REGION, // TODO: replace with the appropriate regions
      credentials: {
        accessKeyId: CONFIG.AWS.AWS_ACCESS_KEY_ID,
        secretAccessKey: CONFIG.AWS.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFileToS3({ s3Bucket, file, folder, fileName, ACL = ObjectCannedACL.private }: { s3Bucket: string; file: Express.Multer.File; folder: string; fileName?: string; ACL?: ObjectCannedACL }): Promise<string> {
    const finalFileName = fileName ? fileName : `${crypto.randomBytes(30).toString("hex")}`;

    // Validate inputs
    if (!file || !file.buffer) {
      throw new AWSValidationError("Invalid file: File or file buffer is missing");
    }

    if (!s3Bucket || !folder) {
      throw new AWSValidationError("Invalid parameters: s3Bucket and folder are required");
    }

    const params = {
      ACL, 
      Bucket: s3Bucket,
      Body: file instanceof Buffer ? file : file.buffer,
      ContentType: file.mimetype,
      Key: `${DEPLOYMENT_ENV}/${folder}/${finalFileName}`,
    };

    try {
      const uploadData = new Upload({
        params: params,
        client: this.s3Client,
        leavePartsOnError: false,
      });

      const data = (await uploadData.done()) as CompleteMultipartUploadCommandOutput;

      if (!data.Location) {
        throw new AWSUploadError("Upload completed but no location was returned from S3", {
          bucket: s3Bucket,
          key: params.Key
        });
      }

      return data.Location as string;
    } catch (error: any) {
      // If it's already one of our custom errors, just re-throw it
      if (error instanceof AWSUploadError) {
        throw error;
      }

      // Log the full error details for debugging
      console.error("S3 Upload Error:", {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        bucket: s3Bucket,
        key: params.Key,
        contentType: file.mimetype,
        fileSize: file.size
      });

      // Create generic upload error with all context
      const errorMessage = error.message || "Unknown S3 upload error";
      throw new AWSUploadError(`S3 upload failed: ${errorMessage}`, {
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        bucket: s3Bucket,
        key: params.Key,
        originalError: error
      });
    }
  }

  async deleteFileFromS3({ s3Bucket, Key }: { s3Bucket: string; Key: string }) {
    const params = {
      Bucket: s3Bucket,
      Key: Key,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(params));

      return true;
    } catch (error: any) {
      // Sentry.captureException(new Error("From Third-Party: fn (deleteFileFromS3)"), { extra: { params, response: error }, level: "error" });
      return false;
    }
  }

  async getSignedUrlFromS3({ s3Bucket, Key, Expires }: { s3Bucket: string; Key: string; Expires?: number }) {
    // If the expires is not provided, use the default expiry duration
    // The default expiry duration is 1 day (in milliseconds), so we need to convert it to seconds
    if (!Expires) {
      const defaultExpiryMs = CONFIG.AWS.AWS_S3_SIGNED_URL_EXPIRY_DURATION ?? ms("1d");
      Expires = defaultExpiryMs / 1000;
    }

    const params = {
      Bucket: s3Bucket,
      Key: Key,
    };

    try {
      const signedUrl = await getSignedUrl(this.s3Client, new GetObjectCommand(params), { expiresIn: Expires });

      return signedUrl;
    } catch (error: any) {
      console.log("error", error);
      throw error
      // Sentry.captureException(new Error("From Third-Party: fn (getSignedUrlFromS3)"), { extra: { params, response: error }, level: "error" });
    }
  }

  async getCloudFrontURLFromS3({ Key, isSigned, dateLessThan = moment().add(1, "days") }: { Key: string; isSigned: boolean; dateLessThan?: moment.Moment }) {
    try {
      const cloudFrontUrl = `${CONFIG.AWS.AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME}/${Key}`;
      if (!isSigned) {
        return cloudFrontUrl;
      }

      // Get signed URL for CloudFront
      const signedCloudFrontUrl = getSignedCloudFrontUrl({
        url: cloudFrontUrl,
        dateLessThan: dateLessThan.toISOString(),
        keyPairId: CONFIG.AWS.AWS_CLOUDFRONT_KEY_PAIR_ID,
        privateKey: CONFIG.AWS.AWS_CLOUDFRONT_PRIVATE_KEY,
      });

      return signedCloudFrontUrl;
    } catch (error) {
      console.log(error);
      throw error
      // Use Sentry to capture error
      // ("From Third-Party: fn (getCloudFrontURLFromS3)"), { extra: { params, response: error }, level: "error" };
    }
  }
}


export default new AwsService();