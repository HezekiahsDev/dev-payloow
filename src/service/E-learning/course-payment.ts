import joi from 'joi';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import userSchema from '../../models/user.schema';
import course_cart from '../../models/course_cart';
import customError from '../../utils/custom.errors';
import walletSchema from '../../models/wallet.schema';
import { generatePaymentCheckout } from '../../utils/payment';
import { TransactionType } from '../../models/transactions.schema';

interface PopulatedCourse {
  price: number;
  _id: string;
}

class CoursePayment {
  async createCoursePaymentIntent(req: AuthRequest) {
    const { error, value: data } = joi
      .object({
        paymentType: joi
          .string()
          .valid(...['wallet', 'flutterwave'])
          .required(),
      })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const courseCart = await course_cart
        .find({ user_id: req.user?._id })
        .populate({ path: 'course_id', model: 'Course', select: 'price' })
        .lean()
        .exec();

      if (courseCart.length === 0) throw new customError('No course cart found', StatusCodes.NOT_FOUND);

      const courseIds: string[] = [];

      let totalAmount = 0;

      totalAmount = courseCart.reduce((sum, coursePrice) => {
        const price = (coursePrice.course_id as unknown as PopulatedCourse).price;
        courseIds.push((coursePrice.course_id as unknown as PopulatedCourse)._id);
        return sum + (price || 0);
      }, 0);

      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      let checkoutWallet = await walletSchema.findOne({ user: req.user?._id });

      if (!checkoutWallet) throw new customError('Wallet not found', StatusCodes.NOT_FOUND);

      if (data.paymentType === 'wallet') {
        if (checkoutWallet.balance.valueOf() < totalAmount)
          throw new customError('Insufficient balance', StatusCodes.BAD_REQUEST);

        checkoutWallet = await walletSchema.findOneAndUpdate(
          { user: req.user?._id },
          { $inc: { balance: -totalAmount } }
        );

        return {
          statusCode: StatusCodes.OK,
          message: 'Payment successful',
          data: null,
        };
      }

      let checkout_url;

      if (data.paymentType === 'flutterwave') {
        checkout_url = await generatePaymentCheckout(user, totalAmount, TransactionType.COURSE_PAYMENT, courseIds);
        return {
          statusCode: StatusCodes.OK,
          message: 'Payment initiated',
          data: checkout_url,
        };
      }

      throw new customError('Invalid payment type', StatusCodes.BAD_REQUEST);
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

export default new CoursePayment();
