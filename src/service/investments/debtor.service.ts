import Joi from 'joi'
import { StatusCodes as HttpStatus } from 'http-status-codes';
import { AuthRequest } from '../../types';
import DebtorModel from '../../models/debtors.schema';
import customError from '../../utils/custom.errors';

class DebtorService {
  async getAllDebtors(req: AuthRequest) {
    const debtors = await DebtorModel.find({}).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
    return debtors;
  }

  async getDebtorById(req: AuthRequest) {

    const { error, value:data } = Joi.object({
      debtorId: Joi.string().required()
    }).validate(req.params);

    if (error) throw new customError(error.message, HttpStatus.BAD_REQUEST);

    const debtors = await DebtorModel.findById(data.debtorId).populate({
      path: 'user',
      select: ["_id", "email", "firstName", "lastName"]
    }).lean().exec();
    return debtors;
  }
}

export default new DebtorService();
