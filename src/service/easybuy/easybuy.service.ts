import Joi, { Root } from 'joi';
import { AuthRequest } from '../../types';
import JoiPhoneNumber from 'joi-phone-number';
import customError from '../../utils/custom.errors';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import userModel, { EasyBuyRole } from '../../models/user.schema';
import EasyBuyProfileModel from '../../models/easybuy_profile.schema';
import EasyBuyCategoryModel from '../../models/easybuy_categories.schema';
import EasyBuyDeliveryInformation from '../../models/easybuy_deliveryInformation.schema';
import EasyBuyCouponModel, { EasyBuyCouponType } from '../../models/easybuy_coupon.schema';

class EasyBuyService {
  async createEasyBuyProfile(req: AuthRequest) {
    const CustomJoi: Root = Joi.extend(JoiPhoneNumber);

    const { error, value: data } = CustomJoi.object({
      fullName: CustomJoi.string().trim().required(),
      email: CustomJoi.string().trim().email().required(),
      phoneNumber: CustomJoi.string().phoneNumber({ defaultCountry: 'NG', format: 'e164', strict: true }).required(),
      address: CustomJoi.string().trim().required(),
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

    const user = await userModel.findById(req.user?._id).select(['_id', 'easyBuyRole']).lean().exec();

    if (user?.easyBuyRole) throw new customError('User already has an easybuy profile', HttpStatus.BAD_REQUEST);

    if (data.referralCode) {
      const referee = await userModel.findOne({ referralCode: data.referralCode });
      // if(!user) throw new customError('Invalid referral code', HttpStatus.BAD_REQUEST);

      // TODO: Do something here
    }

    // Save the Delivery Information
    const deliveryInformation = await EasyBuyDeliveryInformation.create({
      user: req.user?._id,
      fullName: data.fullName,
      address: data.address,
      email: data.email,
      phoneNumber: data.phoneNumber,
    });

    const [_, easyBuyProfile] = await Promise.all([
      userModel.findByIdAndUpdate(req.user?._id, { easyBuyRole: data.easyBuyRole }).exec(),
      EasyBuyProfileModel.create({ ...data, deliveryInformation: deliveryInformation._id, user: req.user?._id }),
    ]);

    await userModel.findByIdAndUpdate(req.user?._id, { easyBuyProfile: easyBuyProfile._id }).exec();

    const easyBuyProfileData = easyBuyProfile.toObject();

    return { ...easyBuyProfileData, easyBuyRole: data.easyBuyRole };
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

  async createEasyBuyCoupon(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      type: Joi.string()
        .valid(...Object.values(EasyBuyCouponType))
        .required(),
      description: Joi.string().trim().required(),
      discount: Joi.number().greater(0).required(),
      code: Joi.string().trim().required(),
      expiryDate: Joi.date().greater('now').required(),
      maxUsage: Joi.number().greater(0).required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const coupon = await EasyBuyCouponModel.create({ ...data, createdBy: req.user?._id });

    return coupon;
  }

  async getEasyBuyCoupons(req: AuthRequest) {
    const coupons = await EasyBuyCouponModel.find()
      .select(['_id', 'status', 'type', 'code', 'discount', 'description', 'expiryDate', 'maxUsage', 'createdBy'])
      .lean()
      .exec();

    return coupons;
  }

  async checkCoupon(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      code: Joi.string().required(),
    }).validate(req.body);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    let coupon = await EasyBuyCouponModel.findOne({ code: data.code })
      .select(['_id', 'status', 'type', 'code', 'discount', 'description', 'expiryDate', 'maxUsage'])
      .lean()
      .exec();

    if (!coupon) throw new customError('Invalid or expired coupon', HttpStatus.NOT_FOUND);

    // Check if coupon is valid
    if (!coupon.status) throw new customError('Invalid or expired coupon', HttpStatus.NOT_FOUND);

    // Check if coupon has been used up to the maximum usage
    if (coupon.maxUsage <= 0) throw new customError('Invalid or expired coupon', HttpStatus.BAD_REQUEST);

    // Check if coupon has expired
    if (new Date(coupon.expiryDate) < new Date())
      throw new customError('Invalid or expired coupon', HttpStatus.BAD_REQUEST);

    // Check if coupon has been used by the user
    const exists = await EasyBuyCouponModel.exists({ usedBy: { $in: [req.user?._id] } });

    if (exists) throw new customError('Coupon has already been used by you', HttpStatus.BAD_REQUEST);

    const { expiryDate, maxUsage, ...cleanedCoupon } = coupon;

    return cleanedCoupon;
  }
}

export default new EasyBuyService();
