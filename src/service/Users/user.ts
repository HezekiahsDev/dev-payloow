import Joi from 'joi';
import crypto from 'crypto';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CONFIG, DEPLOYMENT_ENV } from '../../config/index';
import mailService from '../mail.service';
import tokenSchema from '../../models/token.schema';
import UserModel from '../../models/user.schema';
import vtuSchema from '../../models/vtu.schema';
import walletSchema from '../../models/wallet.schema';
import { AuthRequest, ITokens } from '../../types/index';
import jsonWebtoken from '../../utils/Jwt_token';
import { createToken } from '../../utils/create.user';
import customError from '../../utils/custom.errors';
import generateHashMac from '../../utils/generateHashMac';
import Randomstring from 'randomstring';
import { APICreateCustomer, APICreateDVA } from '../../http';
import DvaModel from "../../models/dva.schema";
class AuthService {
  private readonly now = moment();
  private vtuSecret = CONFIG.JWT_CREDENTIAL.secret;

  async register(req: Request) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().required(),
        phone: Joi.number().required(),
        email: Joi.string().email().lowercase().required(),
        country: Joi.string().required(),
        state: Joi.string().required(),
        address: Joi.string().required(),
        role: Joi.string().required().equal('user', 'tutor'),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
      const isPhoneNumber = await UserModel.findOne({ phone: data.body.phone });

    if (isPhoneNumber) throw new customError('phoneNumber already exist', StatusCodes.BAD_REQUEST);

    const hashPassword = await bcrypt.hash(data.body.password, 10);

    const referralCode = Randomstring.generate({ length: 6 });

    const context = {
      firstName: data.body.firstName,
      lastName: data.body.lastName,
      password: hashPassword,
      phone: data.body.phone,
      role: data.body.role,
      state: data.body.state || null,
      country: data.body.country || null,
      email: data.body.email,
      Address: data.body.address,
      referralCode: referralCode,
    };
    const user = await new UserModel(context).save();

    const paystackCustomer = await APICreateCustomer({
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: String(user.phone),
    });

    await UserModel.updateOne({ _id: user._id },  { paystackCustomerCode: paystackCustomer.data.customer_code })

    // Create Dedicated Virtual Account
    const dva = await APICreateDVA({ 
      customer: paystackCustomer.data.customer_code, 
      preferred_bank: DEPLOYMENT_ENV === "development" ? "test-bank" : "wema-bank",
      phone: String(user.phone)
    });

    await DvaModel.create({
      user: user._id,
      account_name: dva.data.account_name,
      account_number: dva.data.account_number,
      bank_name: dva.data.bank.name,
      currency: dva.data.currency,
    })
    return {
      statusCode: StatusCodes.OK,
      message: 'you have registered successfully',
      data: user,
    };
  }

  async registerSuperAdmin(req: Request) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().required(),
        phone: Joi.number().required(),
        email: Joi.string().email().required(),
        country: Joi.string().required(),
        state: Joi.string().required(),
        address: Joi.string().required(),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const isPhoneNumber = await UserModel.findOne({ phone: data.body.phone });

      if (isPhoneNumber) throw new customError('phoneNumber already exist', StatusCodes.BAD_REQUEST);

      const hashPassword = await bcrypt.hash(data.body.password, 10);

      const role = CONFIG.ROLES.SUPERADMIN;

      const context = {
        firstName: data.body.firstName,
        lastName: data.body.lastName,
        password: hashPassword,
        phone: data.body.phone,
        role,
        state: data.body.state || null,
        country: data.body.country || null,
        email: data.body.email.toLowerCase(),
        Address: data.body.address,
      };

      const user = {
        firstName: data.body.firstName,
        lastName: data.body.lastName,
        role,
      };
      await new UserModel(context).save();

      return {
        statusCode: StatusCodes.OK,
        message: 'you have registered successfully',
        data: user,
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

  async setTransactionPin(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      pin: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.NOT_FOUND);

      const user = await UserModel.findOne({ _id: req.user?._id }).select(["_id", "transactionPin"]).lean().exec()

      if (user?.transactionPin) return { statusCode: StatusCodes.OK, message: 'You have already set a transaction pin' };

      const hashPin = await bcrypt.hash(data.pin, 10);

      if (user) user.transactionPin = hashPin;

      await UserModel.updateOne({ _id: user?._id }, { transactionPin: hashPin });
  }

  async verifyTransactionPin(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      pin: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
      const user = await UserModel.findOne({ _id: req.user?._id }).select(["_id", "transactionPin"]).lean().exec();

    if (!user) throw new customError('user not found', StatusCodes.NOT_FOUND);

    if (!user?.transactionPin) throw new customError('You have not set a transaction pin', StatusCodes.BAD_REQUEST);

    const isPinValid = await bcrypt.compare(data.pin, user?.transactionPin);

    if (!isPinValid) throw new customError('invalid pin', StatusCodes.BAD_REQUEST);
  }


  async updateTransactionPin(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      currentPin: Joi.string().required(),
      newPin: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    
    const user = await UserModel.findOne({ _id: req.user?._id }).select(["_id", "transactionPin"]).lean().exec();

    if (!user) throw new customError('user not found', StatusCodes.NOT_FOUND);

    if (!user?.transactionPin) throw new customError('You have not set a transaction pin', StatusCodes.BAD_REQUEST);

    const isCurrentPinValid = await bcrypt.compare(data.currentPin, user?.transactionPin);

    if (!isCurrentPinValid) throw new customError('invalid current pin', StatusCodes.BAD_REQUEST);

    const hashNewPin = await bcrypt.hash(data.newPin, 10);

    await UserModel.updateOne({ _id: user?._id }, { transactionPin: hashNewPin });
  }


  async login(req: Request) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        email: Joi.string().trim().email().optional(),
        phone: Joi.number().optional(),
        password: Joi.string().required().label('password'),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      let user;
      if (data.body.email) {
        user = await UserModel.findOne({ email: data.body.email });
      } else if (data.body.phone) {
        user = await UserModel.findOne({ phone: data.body.phone });
      }
      const isVerifiedUser = user?.isVerified;

      if (!user) throw new customError('Invalid email or phone number input', StatusCodes.BAD_REQUEST);

      const isPasswordValid = await user.matchPassword(data.body.password);
      if (!isPasswordValid) throw new customError('Invalid email or phone number', StatusCodes.BAD_REQUEST);

      const createTokenUser = createToken(user as ITokens);

      let refreshToken = crypto.randomBytes(16).toString('hex');
      const userTokenModel = await tokenSchema.findOne({ user: user._id });
      const verifyVTU = (await vtuSchema.countDocuments({})) === 0;

      if (verifyVTU && user.role === 'superAdmin') {
        const vtuCode = CONFIG.JWT_CREDENTIAL.secret;

        await vtuSchema.create({ token: vtuCode });
      }

      const userWallets = await walletSchema.findOne({ user: user._id });

      if (!userWallets) {
        const walletBalance = await new walletSchema({
          user: user._id,
          createdAt: this.now.format(CONFIG.TIME_FORMAT),
        }).save();

        await UserModel.findByIdAndUpdate(user._id, { wallet: walletBalance._id }).exec();
      }

      if (userTokenModel) {
        const { isValid } = userTokenModel;

        if (!isValid) throw new customError('User is not authorized', StatusCodes.UNAUTHORIZED);
        const token = await jsonWebtoken.getTokens({ user: createTokenUser, refreshToken });
        refreshToken = userTokenModel.refreshToken;

        return {
          statusCode: StatusCodes.OK,
          message: 'Login successful',
          data: { auth: token.accessToken, verified: isVerifiedUser },
        };
      }
      const userAgent = req.headers['user-agent'];
      const clientIp = req.ip;
      const context = {
        refreshToken: refreshToken,
        ip: clientIp,
        userAgent: userAgent,
        user: user._id,
      };
      await new tokenSchema(context).save();
      const token = await jsonWebtoken.getTokens({ user: createTokenUser, refreshToken });

      return {
        statusCode: StatusCodes.OK,
        message: 'Login successful',
        data: { auth: token.accessToken, verified: isVerifiedUser },
      };
    } catch (error) {
      console.log((error as Error).message);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCurrentUser(req: AuthRequest) {
    try {
      const user = await UserModel.findOne({ _id: req.user?._id }).select('-password').populate('wallet');
      return {
        statusCode: StatusCodes.OK,
        message: 'current user',
        data: user,
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

  async getUserById(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      params: Joi.object({
        id: Joi.string().required(),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ params: req.params });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await UserModel.findOne({ _id: data.params.id }).select('-password -wallet');
      return {
        statusCode: StatusCodes.OK,
        message: 'current user',
        data: user,
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

  async getUserDva(req: AuthRequest) {
    const dva = await DvaModel.findOne({ user: req.user?._id }).lean().exec()
    return dva;
  }


  async getReferenceDetails(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        title: Joi.string().required(),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await UserModel.findOne({ _id: req.user?._id }).select('-password');

      if (!user) throw new customError('user not found', StatusCodes.NOT_FOUND);

      if (!user.previousReference) throw new customError('user has no previous reference', StatusCodes.NOT_FOUND);

      const reference = user.previousReference.filter((ref) => ref.title === data.body.title);

      if (reference.length === 0) {
        return {
          statusCode: StatusCodes.OK,
          message: 'current user',
          data: reference,
        };
      }

      return {
        statusCode: StatusCodes.OK,
        message: 'current user',
        data: reference,
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

  async updateVtuTopUpAccount(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      body: Joi.object({
        vtu: Joi.number().required().valid(0, 1, 2),
      }),
    })
      .options({ stripUnknown: true })
      .validate({ body: req.body });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await UserModel.findOne({ _id: req.user?._id });

      if (!user) throw new customError('user not found', StatusCodes.NOT_FOUND);

      await vtuSchema.findOneAndUpdate({ topUpAccount: data.body.vtu });

      return {
        statusCode: StatusCodes.OK,
        message: 'VTU top up account updated',
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

  async getVTUStatus(req: AuthRequest) {
    try {
      const user = await UserModel.findOne({ _id: req.user?._id });

      if (!user) throw new customError('user not found', StatusCodes.NOT_FOUND);

      const vtu = await vtuSchema.findOne({ token: this.vtuSecret });

      if (!vtu || vtu?.topUpAccount === undefined)
        throw new customError('Token incorrect or topUpAccount not found', StatusCodes.BAD_REQUEST);

      return {
        statusCode: StatusCodes.OK,
        data: vtu.topUpAccount.toString(),
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

  async forgetPassword(req: Request) {
    try {
      const { error, value: data } = Joi.object({
        body: Joi.object({
          email: Joi.string().email().required(),
        }),
      })
        .options({ stripUnknown: true })
        .validate({ body: req.body });

      if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

      const origin = CONFIG.ORIGIN;
      const expiresAt = 1000 * 60 * 60; // 1 hour
      const passwordExpiresAt = new Date(Date.now() + expiresAt);

      const user = await UserModel.findOne({ email: data.body.email.toLowerCase() });

      if (!user) {
        throw new customError('user not found', StatusCodes.NOT_FOUND);
      }

      // Check if there's an existing reset token that hasn't expired
      if (user.resetPasswordExpire && user.resetPasswordExpire > new Date()) {
        throw new customError(
          'A password reset request is already pending. Please check your email or wait for the current request to expire.',
          StatusCodes.BAD_REQUEST
        );
      }

      const sixDigitCode = this.generateSixDigitsRandomNumber();

      await mailService.resetPasswordOtpEmail({
        code: sixDigitCode,
        user,
        origin,
      });

      user.resetPasswordToken = generateHashMac.createTokensHash(sixDigitCode);
      user.resetPasswordExpire = passwordExpiresAt;

      await user.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Reset password OTP has been sent to your email',
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

  async resetPassword(req: Request) {
    try {
      const { error, value: data } = Joi.object({
        body: Joi.object({
          email: Joi.string().email().required().label('email'),
          password: Joi.string().min(8).required().label('password'),
          code: Joi.string().required().length(6).label('code'),
        }),
      })
        .options({ stripUnknown: true })
        .validate({ body: req.body });

      if (error) {
        throw new customError(error.message, StatusCodes.BAD_REQUEST);
      }

      const user = await UserModel.findOne({ email: data.body.email });

      if (!user) {
        throw new customError('User not found', StatusCodes.NOT_FOUND);
      }

      if (!user.resetPasswordToken || !user.resetPasswordExpire) {
        throw new customError('No password reset request found', StatusCodes.BAD_REQUEST);
      }

      const currentDateNow = new Date();

      if (user.resetPasswordExpire < currentDateNow) {
        throw new customError('Password reset code has expired', StatusCodes.BAD_REQUEST);
      }

      if (user.resetPasswordToken !== generateHashMac.createTokensHash(data.body.code)) {
        throw new customError('Invalid reset code', StatusCodes.BAD_REQUEST);
      }

      // Hash and update password
      user.password = await bcrypt.hash(data.body.password, 10);

      // Clear reset token fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Password reset successfully',
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

  async logout(req: Request) {
    try {
      const { error, value: data } = Joi.object({
        body: Joi.object({
          refreshToken: Joi.string().allow(null).optional().label('refresh token'),
        }),
      })
        .options({ stripUnknown: true })
        .validate({ body: req.body });

      if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

      await tokenSchema.findOneAndDelete({ refreshToken: data.body.refreshToken });

      return {
        statusCode: StatusCodes.OK,
        message: 'logged out',
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

  generateSixDigitsRandomNumber(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new AuthService();
