import Joi from 'joi'
import { StatusCodes as HttpStatus } from 'http-status-codes';
import { AuthRequest } from '../../types';
import Business from '../../models/investment_businesses.schema';
import customError from '../../utils/custom.errors';

class BusinessService {
  async getAllBusinesses(req: AuthRequest) {
    const businesses = await Business.find().populate({
      path: 'debtor',
      select: ["_id", "firstName", "lastName"]
    }).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
    return businesses;
  }

  async getBusinessById(req: AuthRequest) {
    const { error, value:data } = Joi.object({
      businessId: Joi.string().required()
    }).validate(req.params);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    return await Business.findById(data.businessId).populate({
        path: 'debtor',
        select: ["_id", "firstName", "lastName"]
      }).populate({
        path: 'user',
        select: ["_id", "email", "firstName", "lastName"]
      }).lean().exec();
  }

  async getDebtorBusinesses(req: AuthRequest) {
    const { error, value:data } = Joi.object({
      debtorId: Joi.string().required()
    }).validate(req.params);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    return Business.find({ debtor: data.debtorId }).populate({
      path: 'debtor',
      select: ["_id", "firstName", "lastName"]
    }).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
  }
}

export default new BusinessService(); 