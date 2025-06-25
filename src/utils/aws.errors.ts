export class AWSUploadError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly bucket?: string;
  public readonly key?: string;
  public readonly originalError?: any;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      bucket?: string;
      key?: string;
      originalError?: any;
    } = {}
  ) {
    super(message);
    this.name = 'AWSUploadError';
    this.code = options.code || 'UPLOAD_ERROR';
    this.statusCode = options.statusCode;
    this.bucket = options.bucket;
    this.key = options.key;
    this.originalError = options.originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AWSUploadError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      bucket: this.bucket,
      key: this.key,
      stack: this.stack
    };
  }
}

export class AWSValidationError extends AWSUploadError {
  constructor(message: string) {
    super(message, { code: 'VALIDATION_ERROR' });
    this.name = 'AWSValidationError';
  }
}

export class AWSPermissionError extends AWSUploadError {
  constructor(message: string, bucket?: string) {
    super(message, { code: 'PERMISSION_ERROR', bucket });
    this.name = 'AWSPermissionError';
  }
}

export class AWSBucketError extends AWSUploadError {
  constructor(message: string, bucket: string) {
    super(message, { code: 'BUCKET_ERROR', bucket });
    this.name = 'AWSBucketError';
  }
} 