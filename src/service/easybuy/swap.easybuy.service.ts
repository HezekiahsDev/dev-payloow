import Joi from 'joi';
import fs from 'fs';
import { CONFIG } from '../../config';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import customError from '../../utils/custom.errors';
import { uploadFileToS3 } from '../../libraries/aws';
import swapEasybuySchema from '../../models/swap.easybuy.schema';
import EasyBuyProductModel from '../../models/easybuy_products.schema';

class SwapEasybuyService {
  async swapEasybuyCategories(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      productToSwapId: Joi.string().required(),
      productName: Joi.string().required(),
      productModel: Joi.string().required(),
      productBrand: Joi.string().required(),
      productDescription: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const productToSwap = await EasyBuyProductModel.findOne({ _id: data.productToSwapId }).lean().exec();

      if (!productToSwap) throw new customError('Product to swap not found', StatusCodes.NOT_FOUND);

      const { front, back, receipt, box } = req.files as { front: Express.Multer.File[]; back: Express.Multer.File[]; receipt: Express.Multer.File[]; box: Express.Multer.File[] };

      const uploadToS3 = async (file: Express.Multer.File, folder: string): Promise<string | null> => {
        try {
          // const buffer = fs.readFileSync(file.tempFilePath);
          const uploadedKey = await uploadFileToS3({
            s3Bucket: CONFIG.AWS.AWS_S3_BUCKET_NAME,
            file: file.buffer, // Using express-fileupload data property
            folder: `swapEasybuy/${data.productToSwapId}/${folder}`,
            mimetype: file.mimetype,
          });

          return uploadedKey ? `${CONFIG.AWS.CLOUD_FRONT}/${uploadedKey}` : null;
        } catch (uploadError) {
          console.error(`Failed to upload ${folder}:`, uploadError);
          return null;
        }
      };

      const imageView = {
        front: front ? await uploadToS3(Array.isArray(front) ? front[0] : front, 'front') : null,
        back: back ? await uploadToS3(Array.isArray(back) ? back[0] : back, 'back') : null,
        receipt: receipt ? await uploadToS3(Array.isArray(receipt) ? receipt[0] : receipt, 'receipt') : null,
        box: box ? await uploadToS3(Array.isArray(box) ? box[0] : box, 'box') : null,
      };

      const product = await swapEasybuySchema.create({
        product_id: data.productToSwapId,
        product_name: data.productName,
        model_name: data.productModel,
        brand_name: data.productBrand,
        description: data.productDescription,
        user_id: req.user?._id,
        image_view: imageView,
      });

      return product;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getSingleSwapEasybuyProduct(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      swapId: Joi.string().required(),
    }).validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const product = await swapEasybuySchema.findById(data.swapId).lean().exec();

      if (!product) throw new customError('Product not found', StatusCodes.NOT_FOUND);

      return product;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getAllSwapEasybuyProduct(req: AuthRequest) {
    try {
      const products = await swapEasybuySchema.find().lean().exec();

      return products;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async deleteSingleSwapEasybuyProduct(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      swapId: Joi.string().required(),
    }).validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const product = await swapEasybuySchema.findByIdAndDelete(data.swapId).lean().exec();

      if (!product) throw new customError('Product not found', StatusCodes.NOT_FOUND);

      return product;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }
}

export default new SwapEasybuyService();
