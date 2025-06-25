import Joi from 'joi'
import { StatusCodes as HttpStatus } from 'http-status-codes';
import { AuthRequest } from '../../types';
import InvestorModel from '../../models/investors.schema';
import customError from '../../utils/custom.errors';

class InvestorService {
  async getAllInvestors(req: AuthRequest) {
    const investors = await InvestorModel.find({}).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
    return investors;
  }

  async getInvestorById(req: AuthRequest) {

    const { error, value:data } = Joi.object({
      investorId: Joi.string().required()
    }).validate(req.params);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const investors = await InvestorModel.findById(data.investorId).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
    return investors;
  }
}

export default new InvestorService();
