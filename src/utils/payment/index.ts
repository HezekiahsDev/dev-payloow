import axios from 'axios';
import { IUser } from 'src/types';
import { CONFIG } from '../../config';
import customError from '../custom.errors';
import { StatusCodes } from 'http-status-codes';
import generateHashMac from '../generateHashMac';

export const generatePaymentCheckout = async (
  data: IUser,
  amount: number,
  paymentType: string | null,
  coursesIds: string[] | null
) => {
  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/v3/payments`,
      {
        tx_ref: generateHashMac.generateRandomString(),
        amount: amount,
        currency: 'NGN',
        redirect_url: 'https://revo-frontend-web.vercel.app/purchase/success',
        customer: {
          email: data.email,
          name: ` ${data.firstName} ${data.lastName}`,
          phone: `${data.phone}`,
        },
        meta: {
          payment_type: paymentType || null,
          courses: coursesIds || null,
        },
        customizations: {
          title: 'Flutterwave Standard Payment',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CONFIG.FLUTTERWAVE.SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentLink = response.data.data.link;

    return paymentLink;
  } catch (error) {
    const errorMessage = (error as Error).message || 'An unknown error occurred';
    const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

    return {
      statusCode: customErrors.status,
      message: customErrors.message,
    };
  }
};
