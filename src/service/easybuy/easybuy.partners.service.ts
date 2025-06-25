import fs from 'fs';
import Joi, { Root } from 'joi';
import { CONFIG } from '../../config';
import { AuthRequest } from '../../types';
import JoiPhoneNumber from 'joi-phone-number';
import customError from '../../utils/custom.errors';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import UserModel, { EasyBuyRole } from '../../models/user.schema';
import EasybuyOrdersModel from '../../models/easybuy_orders.schema';
import EasyBuyProfileModel from '../../models/easybuy_profile.schema';
import EasyBuyProductModel from '../../models/easybuy_products.schema';
import EasyBuyCategoryModel from '../../models/easybuy_categories.schema';
import { uploadFileToS3 } from '../../libraries/aws';
import fileService from '../file.service';
import EasybuyServiceCentersModel from '../../models/easybuy_service_centers.schema';

class EasyBuyService {
  async createEasyBuyProfile(req: AuthRequest) {
    const CustomJoi: Root = Joi.extend(JoiPhoneNumber);

    const { error, value: data } = CustomJoi.object({
      fullName: CustomJoi.string().required(),
      phoneNumber: CustomJoi.string().phoneNumber({ defaultCountry: 'NG', format: 'e164', strict: true }).required(),
      address: CustomJoi.string().required(),
      state: CustomJoi.string().required(),
      country: CustomJoi.string().required(),
      nin: CustomJoi.string().required(),
      bvn: CustomJoi.string().required(),
      easyBuyRole: CustomJoi.string()
        .valid(...Object.values(EasyBuyRole))
        .required(),
      employmentStatus: CustomJoi.string().required(),
      referralCode: CustomJoi.string().allow(null),
      income: CustomJoi.number().optional(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (user?.easyBuyRole) throw new customError('User already has an easybuy profile', HttpStatus.BAD_REQUEST);

    if (data.referralCode) {
      const referee = await UserModel.findOne({ referralCode: data.referralCode });
      // if(!user) throw new customError('Invalid referral code', HttpStatus.BAD_REQUEST);

      // Do something here
    }

    const [_, easyBuyProfile] = await Promise.all([
      UserModel.findByIdAndUpdate(req.user?._id, { easyBuyRole: data.easyBuyRole }).exec(),
      EasyBuyProfileModel.create({ ...data, user: req.user?._id }),
    ]);

    await UserModel.findByIdAndUpdate(req.user?._id, { easyBuyProfile: easyBuyProfile._id }).exec();

    return { ...easyBuyProfile, easyBuyRole: data.easyBuyRole };
  }

  async createEasyBuyCategories(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      name: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const category = await EasyBuyCategoryModel.create(req.body);

    return category;
  }

  async getEasyBuyCategories(req: AuthRequest) {
    const categories = await EasyBuyCategoryModel.find().select(['_id', 'name']).lean().exec();

    return categories;
  }

  async createEasyBuyProduct(req: AuthRequest) {
    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER) {
      throw new customError("You're not an EasyBuy Partner", HttpStatus.BAD_REQUEST);
    }

    // Parse the color field to an array
    if (typeof req.body.color === 'string') {
      req.body.color = req.body.color.split(',');
    } else {
      req.body.color = [];
    }

    const { error, value: data } = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      color: Joi.array().items(Joi.string()).optional(),
      category: Joi.string().required(),
      stock: Joi.number().required(),
    }).validate(req.body, { stripUnknown: true });

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);


    const category = await EasyBuyCategoryModel.findById(data.category).select(['_id']).lean().exec();

    if (!category) throw new customError('Invalid category', HttpStatus.BAD_REQUEST);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    const mainImage = files?.image?.[0] as Express.Multer.File

    const additionalImages = files?.additionalImages as Express.Multer.File[]

    const mainImageFile = await fileService.uploadFile({ file: mainImage, folder: 'easybuy/products' });

    const additionalImagesFiles = await Promise.all(additionalImages.map(async (image) => fileService.uploadFile({ file: image, folder: 'easybuy/products' })));

    const product = await EasyBuyProductModel.create({
      ...data,
      category: category._id,
      image: mainImageFile._id,
      partner: req.user?._id,
      additionalImages: additionalImagesFiles.map((image) => image._id),
      imageUrl: await fileService.getFileUrl({ fileId: String(mainImageFile._id), isSigned: false, useCloudFront: true }),
      additionalImagesUrls: await Promise.all(additionalImagesFiles.map(async (image) => await fileService.getFileUrl({ fileId: String(image._id), isSigned: false, useCloudFront: true }))),
    });

    const { image, additionalImages: _ , ...cleanProduct } = product.toObject();

    return cleanProduct;
  }

  async getEasyBuyProduct(req: AuthRequest) {
    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
      throw new customError("You're not an EasyBuy Partner", HttpStatus.BAD_REQUEST);

    const { error, value: data } = Joi.object({
      productId: Joi.string().required(),
    }).validate(req.params);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const product = await EasyBuyProductModel.findById(data.productId)
      .select(['_id', 'partner', 'name', 'description', 'price', 'color', 'imageUrl', 'additionalImages'])
      .lean()
      .exec();

    if (!product) throw new customError('Product not found', HttpStatus.NOT_FOUND);

    return product;
  }

  async getEasyBuyProducts(req: AuthRequest) {
    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER)
      throw new customError("You're not an EasyBuy Partner", HttpStatus.BAD_REQUEST);

    const products = await EasyBuyProductModel.find({ partner: req.user?._id })
      .select(['_id', 'partner', 'name', 'description', 'price', 'imageKey'])
      .lean()
      .exec();

    return products;
  }

  async uploadProductImage(image: Express.Multer.File) {
    // Read the temporary file into a buffer
    // const buffer = fs.readFileSync(image.tempFilePath);

    const res = await uploadFileToS3({
      s3Bucket: CONFIG.AWS.AWS_S3_BUCKET_NAME,
      file: image.buffer,
      folder: 'easybuy/products',
      mimetype: image.mimetype,
      ACL: ObjectCannedACL.private,
    });

    // fs.unlinkSync(image.tempFilePath);

    return res;
  }

  async createServiceCenter(req: AuthRequest) {
    const CustomJoi: Root = Joi.extend(JoiPhoneNumber);

    const { error, value: data } = CustomJoi.object({
      name: CustomJoi.string().required(),
      address: CustomJoi.string().required(),
      phoneNumber: CustomJoi.string().phoneNumber({ defaultCountry: 'NG', format: 'e164', strict: true }).required(),
      email: CustomJoi.string().email().required(),
      location: CustomJoi.object({
        longitude: CustomJoi.number().required(),
        latitude: CustomJoi.number().required(),
      }).required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);


    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec(); 

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER) throw new customError("You're not an EasyBuy Partner", HttpStatus.BAD_REQUEST);

    const { name, address, phoneNumber, email } = data;

    const serviceCenter = await EasybuyServiceCentersModel.create({
      name,
      address,
      phoneNumber,
      email,
      location: {
        type: 'Point',
        coordinates: [data.location.longitude, data.location.latitude],
      },
      partner: user._id,
    })

    return serviceCenter;
  }

  async getServiceCenters(req: AuthRequest) {
    const user = await UserModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (!user?.easyBuyRole || user.easyBuyRole !== EasyBuyRole.PARTNER) throw new customError("You're not an EasyBuy Partner", HttpStatus.BAD_REQUEST);

    const serviceCenters = await EasybuyServiceCentersModel.find({ partner: user._id }).lean().exec();

    return serviceCenters;
  }

  async getCustomers(req: AuthRequest) {
    const customers = await EasybuyOrdersModel.find({
      'cartItems': {
        $elemMatch: {
          partner: req.user?._id,
        },
      },
    }).select(["_id", "user", "createdAt"]).populate({
      path: 'user',
      select: ['_id', 'fullName', 'email', 'phoneNumber', 'Address', 'profilePicture'],
    }).lean().exec();

    return customers;
  }
}

export default new EasyBuyService();
