import multer, { FileFilterCallback, Field } from "multer";

export class UploadError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UploadError';
    }
}

interface BuildSingleOrArrayUploadMiddlewareOptions {
  fieldName: string;
  maxMb?: number;
  allowedMimeTypes?: string[];
  maxCount?: number; // This is for single array upload
}

interface BuildFieldsUploadMiddlewareOptions {
  fields: (Field & {
    fieldMimeTypes?: string[];
  })[];
  maxMb?: number;
}

export function buildSingleOrArrayUploadMiddleware({ fieldName, maxMb = 5, allowedMimeTypes = [], maxCount }: BuildSingleOrArrayUploadMiddlewareOptions) {
  const storage = multer.memoryStorage();

  const fileFilter = (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedMimeTypes.length === 0 || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UploadError(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxMb * 1024 * 1024 }
  });

  if (maxCount) {
    return upload.array(fieldName, maxCount);
  }

  return upload.single(fieldName);
}

export function buildFieldsUploadMiddleware({ fields, maxMb = 5 }: BuildFieldsUploadMiddlewareOptions) {
  const storage = multer.memoryStorage();

  // Create a map of field names to their allowed mime types for quick lookup
  const fieldMimeTypesMap = new Map<string, string[]>();
  fields.forEach(field => {
    if (field.fieldMimeTypes) {
      fieldMimeTypesMap.set(field.name, field.fieldMimeTypes);
    }
  });

  const fileFilter = (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = fieldMimeTypesMap.get(file.fieldname);

    // If no mime types specified for this field, accept all
    if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
      return cb(null, true);
    }

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new UploadError(
      `Invalid file type for field "${file.fieldname}". Allowed: ${allowedMimeTypes.join(', ')}`
    ));
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxMb * 1024 * 1024 }
  });

  // Remove fieldMimeTypes from fields before passing to multer
  const multerFields = fields.map(({ fieldMimeTypes, ...field }) => field);
  return upload.fields(multerFields);
}



// Middlewares for image upload
export const easyBuyCreateProductImageUpload = buildFieldsUploadMiddleware({
  fields: [
    {
      name: 'image',
      maxCount: 1,
      fieldMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
    },
    {
      name: 'additionalImages',
      maxCount: 5,
      fieldMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
    }
  ],
  maxMb: 5
});