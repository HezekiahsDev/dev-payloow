import { StatusCodes } from 'http-status-codes';
import { CONFIG } from '../../../config/index';
import { AuthRequest } from '../../../types';
import customError from '../../../utils/custom.errors';
import userSchema from '../../../models/user.schema';
import VariationSchema from '../../../models/vtu.data';
import axios from 'axios';
import Joi from 'joi';
import mailService from '../../mail.service';

class VTU {
  private readonly baseUrl = CONFIG.VTU.URL;
  async getVTUProvidersWalletBalance(req: AuthRequest) {
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.get(
        `${this.baseUrl}balance?username=${CONFIG.VTU.USERNAME}&password=${CONFIG.VTU.PASSWORD}`
      );

      return {
        statusCode: StatusCodes.OK,
        message: 'Wallet balance retrieved successfully',
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }
  async purchaseAirtime(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      phone: Joi.string().required(),
      network_id: Joi.string().required(),
      amount: Joi.number().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.get(`${this.baseUrl}airtime?username=${CONFIG.VTU.USERNAME}
                &password=${CONFIG.VTU.PASSWORD}&phone=${data.phone}&network_id=${data.network_id}&amount=${data.amount}`);

      user.previousReference?.push({ title: 'Airtime', body: data.network_id, code: data.phone });
      await user.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Airtime purchase successful',
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message === 'TRANSACTION FAILED') {
          const errorMessage = error.response?.data?.message || 'An unknown error occurred';
          const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

          return {
            statusCode: customErrors.status,
            message: 'transaction failed, your funds would be refunded',
          };
        }

        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }

  async purchaseData(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      phone: Joi.string().required(),
      network_id: Joi.string().required(),
      variation_id: Joi.string().required(),
      amount: Joi.number().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response =
        await axios.get(`${this.baseUrl}data?username=${CONFIG.VTU.USERNAME}&password=${CONFIG.VTU.PASSWORD}
                &phone=${data.phone}&network_id=${data.network_id}&variation_id=${data.variation_id}&amount=${data.amount}`);

      user.previousReference?.push({ title: 'Data', body: data.network_id, code: data.phone });
      await user.save();

      return { statusCode: StatusCodes.OK, message: 'Data purchased successfully', data: response.data };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }

  async purchaseElectricity(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      phone: Joi.string().required(),
      meter_number: Joi.string().required(),
      service_id: Joi.string().required(),
      variation_id: Joi.string().required(),
      amount: Joi.number().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.get(`${this.baseUrl}electricity?
                username=${CONFIG.VTU.USERNAME}&password=${CONFIG.VTU.PASSWORD}
                &phone=${data.phone}&customer_id=${data.meter_number}&service_id=${data.service_id}
                &variation_id=${data.variation_id}&amount=${data.amount}`);

      user.previousReference?.push({
        title: 'Electricity',
        body: data.service_id,
        code: `meter_no:${data.meter_number}, token:${data.token}`,
      });
      await user.save();

      return { statusCode: StatusCodes.OK, message: 'Electricity purchased successfully', data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }

  async verifyCustomer(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      customer_id: Joi.string().required(),
      service_id: Joi.string().required(),
      variation_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);
    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.get(`${this.baseUrl}verify-customer?username=${CONFIG.VTU.USERNAME}
                &password=${CONFIG.VTU.PASSWORD}&customer_id=${data.customer_id}&service_id=${data.service_id}&variation_id=${data.variation_id}`);

      return { statusCode: StatusCodes.OK, message: 'Customer verified successfully', data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }

  async purchaseCableTV(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      phone: Joi.string().required(),
      smartcard_number: Joi.string().required(),
      service_id: Joi.string().required(),
      variation_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response =
        await axios.get(`${this.baseUrl}tv?username=${CONFIG.VTU.USERNAME}&password=${CONFIG.VTU.PASSWORD}
                &phone=${data.phone}&smartcard_number=${data.smartcard_number}&service_id=${data.service_id}&variation_id=${data.variation_id}`);

      user.previousReference?.push({ title: 'Cable', body: data.service_id, code: data.smartcard_number });
      await user.save();

      return { statusCode: StatusCodes.OK, message: 'Cable TV purchased successfully', data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: 'try again vtu error',
        };
      }
    }
  }

  async getVariations(req: AuthRequest) {
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const variations = await VariationSchema.find({});

      const data = variations.map((variation) => variation.toJSON());

      return { statusCode: StatusCodes.OK, message: 'Variations retrieved successfully', data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });
        return {
          statusCode: customErrors.status,
          message: customErrors.message,
        };
      } else {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

        await mailService.sendErrorNotification({ errorMessage: errorMessage });

        return {
          statusCode: customErrors.status,
          message: customErrors.message,
        };
      }
    }
  }
}

export default new VTU();
