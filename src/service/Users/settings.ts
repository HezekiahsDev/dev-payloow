import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../../types/index';
import { StatusCodes } from 'http-status-codes';
import userSchema from '../../models/user.schema';
import customError from '../../utils/custom.errors';

class userSettingPage {
  async ChangePassword(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });
    if (error) throw new customError(error.message, StatusCodes.NOT_FOUND);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) {
        throw new customError('user not found', StatusCodes.NOT_FOUND);
      }
      const isMatch = await user.matchPassword(data.body.currentPassword);

      if (!isMatch) {
        throw new customError('incorrect password', StatusCodes.UNAUTHORIZED);
      }

      user.password = await bcrypt.hash(data.body.newPassword, 10);

      await user.save();

      return {
        statusCode: StatusCodes.OK,
        message: `password updated`,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async ChangeEmail(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        email: Joi.string().email().required(),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.NOT_FOUND);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) {
        throw new customError('user not found', StatusCodes.NOT_FOUND);
      }

      user.email = data.body.email;

      await user.save();

      return {
        statusCode: StatusCodes.OK,
        message: `email updated`,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async AddProfilePicture(req: AuthRequest) {}

  async UpdateProfile(req: AuthRequest) {}
}

export default new userSettingPage();
