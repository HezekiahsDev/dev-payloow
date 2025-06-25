import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import Joi from 'joi';
import customError from '../../utils/custom.errors';
import { AuthRequest } from '../../types';
import { CONFIG } from '../../config';
import mailService from '../mail.service';
import userSchema from '../../models/user.schema';

class BillPayment {
  private readonly GONGOZ_API_TOKEN = CONFIG.GONZO_API.TOKEN;

  private formatErrorMessage(error: unknown): string {
    if (Array.isArray(error)) {
      // Handle if error is an array of strings
      return error.join(', ');
    } else if (typeof error === 'object' && error !== null) {
      // Handle if error is an object
      return Object.entries(error as Record<string, unknown>)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
    }
    return 'An unknown error occurred';
  }

  async getSellerUserDetails(req: AuthRequest) {
    try {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.gongozconcept.com/api/user/',
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios(config);

      if (response.status !== StatusCodes.OK) throw new customError(response.data, response.status);

      const { Dataplans, Cableplan, recharge } = response.data;

      const results = { Dataplans, Cableplan, recharge };

      return {
        statusCode: StatusCodes.OK,
        message: results,
      };
    } catch (error) {
      console.log(error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async buyData(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      network: Joi.number().required(),
      mobile_number: Joi.string().required(),
      plan: Joi.number().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const result = JSON.stringify({
        network: data.network,
        mobile_number: data.mobile_number,
        plan: data.plan,
        Ported_number: true,
      });

      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.post('https://www.gongozconcept.com/api/data/', result, {
        headers: { Authorization: `Token ${this.GONGOZ_API_TOKEN}`, 'Content-Type': 'application/json' },
      });

      if (response.status === StatusCodes.OK && !response.data.error) {
        user.previousReference?.push({ title: 'Data', body: data.network, code: data.mobile_number });
        await user.save();

        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data.error ? response.data.error.join(', ') : 'An unknown error occurred';
      throw new customError(message, response.status);
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.error
          ? error.response.data.error.join(', ')
          : error.message || 'An unknown error occurred';

        console.log(errorMessage);

        return {
          statusCode: error.response.status || StatusCodes.BAD_REQUEST,
          message: errorMessage.includes(
            "You can't purchase this plan due to insufficient MTN GIFTING DATA BUCKET BALANCE or insufficient wallet balance, pls fund your MTN GIFTING DATA BUCKET or main wallet to retry"
          )
            ? mailService.sendErrorNotification({
                errorMessage: errorMessage,
              })
            : 0,
        };
      }
      const errorMessage = error.message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage.includes(
          "You can't purchase this plan due to insufficient MTN GIFTING DATA BUCKET BALANCE or insufficient wallet balance, pls fund your MTN GIFTING DATA BUCKET or main wallet to retry"
        )
          ? mailService.sendErrorNotification({
              errorMessage: errorMessage,
            })
          : 0,
      };
    }
  }

  async buyAirTime(req: AuthRequest) {
    const schema = Joi.object({
      network: Joi.number().required(),
      mobile_number: Joi.string().required(),
      amount: Joi.number().required(),
      airtime_type: Joi.string().valid('VTU', 'Recharge').required(),
    }).options({ stripUnknown: true });

    const { error, value: data } = schema.validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const payload = JSON.stringify({
        network: data.network,
        amount: data.amount,
        mobile_number: data.mobile_number,
        Ported_number: true,
        airtime_type: data.airtime_type,
      });

      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.post('https://www.gongozconcept.com/api/topup/', payload, {
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === StatusCodes.OK && !response.data.error) {
        user.previousReference?.push({ title: 'Airtime', body: data.network, code: data.mobile_number });
        await user.save();
        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data.error ? response.data.error.join(', ') : 'An unknown error occurred';
      throw new customError(message, response.status);
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.error
          ? error.response.data.error.join(', ')
          : error.message || 'An unknown error occurred';

        return {
          statusCode: error.response.status || StatusCodes.BAD_REQUEST,
          message: errorMessage.includes("You can't topup due to insufficient balance")
            ? mailService.sendErrorNotification({
                errorMessage: errorMessage,
              })
            : 0,
        };
      }
      const errorMessage = error.message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage.includes("You can't topup due to insufficient balance")
          ? mailService.sendErrorNotification({
              errorMessage: errorMessage,
            })
          : 0,
      };
    }
  }

  async buyElectricityBill(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      disco_name: Joi.string().required(), // Corrected to string type
      amount: Joi.number().required(),
      meter_number: Joi.string().required(),
      MeterType: Joi.string().valid('PREPAID', 'POSTPAID').required(), // Updated with valid values
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const payload = JSON.stringify({
        disco_name: data.disco_name,
        amount: data.amount,
        meter_number: data.meter_number,
        MeterType: data.MeterType,
      });

      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.post('https://www.gongozconcept.com/api/billpayment/', payload, {
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === StatusCodes.OK && !response.data.error) {
        user.previousReference?.push({ title: 'Electricity', body: data.disco_name, code: data.meter_number });
        await user.save();
        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data?.error;

      throw new customError(message, response.status);
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response.data);

      if (
        errorMessage.includes(
          'disco_name: Incorrect type. Expected pk value, received str., MeterType: "POSTPAID" is not a valid choice'
        )
      ) {
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'invalid disco_name, MeterType or meter_number',
        };
      }

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }

  async buyCableTV(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      cablename: Joi.number().required(),
      cableplan: Joi.number().required(),
      smart_card_number: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const payload = JSON.stringify({
        cablename: data.cablename,
        cableplan: data.cableplan,
        smart_card_number: data.smart_card_number,
      });

      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const response = await axios.post('https://www.gongozconcept.com/api/cablesub/', payload, {
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === StatusCodes.OK && !response.data.error) {
        user.previousReference?.push({ title: 'Cable', body: data.cablename, code: data.smart_card_number });
        await user.save();
        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data?.error;

      throw new customError(message, response.status);
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response.data);

      if (
        errorMessage.includes(
          'cablename: Incorrect type. Expected pk value, received int., cableplan: Incorrect type. Expected pk value, received int.'
        )
      ) {
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'invalid cablename or cableplan',
        };
      }
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }

  async validateMeterNumber(req: AuthRequest) {
    const schema = Joi.object({
      meter_number: Joi.string().required(),
      disco_name: Joi.string().required(),
      meter_type: Joi.string().valid('PREPAID', 'POSTPAID').required(),
    }).options({ stripUnknown: true });

    const { error, value: data } = schema.validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const params = new URLSearchParams({
        meternumber: data.meter_number,
        disconame: data.disco_name,
        mtype: data.meter_type,
      }).toString();

      const url = `https://www.gongozconcept.com/api/validatemeter?${params}`;

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios(config);

      if (response.status === StatusCodes.OK && !response.data.error) {
        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data?.error ? response.data.error.join(', ') : 'An unknown error occurred';
      throw new customError(message, response.status);
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response?.data || error);

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }

  async validateICU(req: AuthRequest) {
    const schema = Joi.object({
      smart_card_number: Joi.string().required(),
      cablename: Joi.string().required(), // Assuming cablename is a string
    }).options({ stripUnknown: true });

    const { error, value: data } = schema.validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const params = new URLSearchParams({
        smart_card_number: data.smart_card_number,
        cablename: data.cablename,
      }).toString();

      const url = `https://www.gongozconcept.com/api/validateiuc?${params}`;

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: url,
        headers: {
          Authorization: `Token ${this.GONGOZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios(config);

      if (response.status === StatusCodes.OK && !response.data.error) {
        return {
          statusCode: StatusCodes.OK,
          message: response.data,
        };
      }
      const message = response.data?.error ? response.data.error.join(', ') : 'An unknown error occurred';
      throw new customError(message, response.status);
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response?.data || error);

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }

  async AirtimeToCash(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      amount: Joi.number().required(),
      network: Joi.number().required(),
      phone: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const response = await axios.post(
        'https://bingpay.ng/api/v1/airtime-cash/process',
        {
          amount: data.amount,
          network: data.network,
          phone: data.phone,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONFIG.BINGPAY_API_KEY}`,
          },
          maxRedirects: 20,
        }
      );
      return {
        statusCode: StatusCodes.OK,
        message: 'Airtime to cash process successful',
        data: response.data,
      };
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response?.data || error);

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }

  async networkFee(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      amount: Joi.number().required(),
      network: Joi.number().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const response = await axios.post(
        'https://bingpay.ng/api/v1/airtime-cash/fee',
        {
          amount: data.amount,
          network: data.network,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONFIG.BINGPAY_API_KEY}`,
          },
          maxRedirects: 20,
        }
      );
      return {
        statusCode: StatusCodes.OK,
        message: 'Network fee retrieved successfully',
        data: response.data,
      };
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response?.data || error);

      // Handle the error response
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }
  async allNetworks(req: AuthRequest) {
    try {
      const response = await axios.get('https://bingpay.ng/api/v1/all-networks', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONFIG.BINGPAY_API_KEY}`,
        },
        maxRedirects: 20,
      });

      return {
        statusCode: StatusCodes.OK,
        message: 'Networks retrieved successfully',
        data: response.data,
      };
    } catch (error: any) {
      const errorMessage = this.formatErrorMessage(error.response?.data || error);

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      };
    }
  }
}

export default new BillPayment();
