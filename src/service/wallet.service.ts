import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import UserModel from '../models/user.schema';
import DvaModel from '../models/dva.schema';
import { AuthRequest, IUser } from '../types/index';
import customError from '../utils/custom.errors';
import { StatusCodes } from 'http-status-codes';
import {
  TransactionMerchant,
  TransactionType,
  TransactionStatus,
  TransactionMethodType,
} from '../models/transactions.schema';
import { APIInitializeTransaction } from '../http';
import { CONFIG } from '../config';
import { paystackService } from './paystack.service';
import transactionService from './transaction.service';

class WalletService {
  async creditWallet(user: IUser, amount: number) {
    const currentBalance = parseFloat(user.balance.toString());

    const newBalance = Types.Decimal128.fromString((currentBalance + amount).toFixed(2));

    await UserModel.updateOne({ _id: user._id }, { balance: newBalance });
  }

  async debitWallet(user: IUser, amount: number) {
    const currentBalance = parseFloat(user.balance.toString());

    const newBalance = Types.Decimal128.fromString((currentBalance - amount).toFixed(2));

    await UserModel.updateOne({ _id: user._id }, { balance: newBalance });
  }

  async deposit({ user, body }: Partial<AuthRequest>) {
    const { error, value: data } = Joi.object({
      merchant: Joi.string()
        .trim()
        .valid(...Object.values(TransactionMerchant))
        .default(TransactionMerchant.PAYSTACK),
      amount: Joi.number().required(),
    }).validate(body, { stripUnknown: true });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const userObj = await UserModel.findById(user?._id).lean().exec();

    if (!userObj) {
      throw new customError('User not found', StatusCodes.NOT_FOUND);
    }

    const supportedDepositMerchant = [TransactionMerchant.PAYSTACK];

    if (!supportedDepositMerchant.includes(data.merchant)) {
      throw new customError(`${data.merchant} is not supported yet on our platform`, StatusCodes.NOT_FOUND);
    }

    let checkoutUrl: string | null = null;

    if (data.merchant) {
      checkoutUrl = await this.depositWalletWithPaystack(userObj, data.amount);
    }

    return checkoutUrl;
  }
  async depositWalletWithPaystack(user: IUser, amount: number) {
    const reference = uuidv4();

    const { authorization_url } = await APIInitializeTransaction({
      amount: `${amount * 100}`,
      email: user.email,
      reference: reference,
      callback_url: `${CONFIG.FRONTEND_URL}/success`,
      metadata: {
        userId: user._id as string,
        type: 'deposit',
      },
    });

    return authorization_url;
  }

  /**
   * Verify BVN and create DVA for user
   * @param userId - User ID
   * @param bvn - Bank Verification Number
   * @returns Promise with DVA creation result
   */
  async verifyAndCreateDvaForUser(userId: string, bvn: string) {
    try {
      // Find user
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new customError('User not found', StatusCodes.NOT_FOUND);
      }

      // Check if user already has a DVA
      const existingDva = await DvaModel.findOne({ userId });
      if (existingDva) {
        throw new customError('User already has a DVA account', StatusCodes.BAD_REQUEST);
      }

      // Verify BVN with Paystack
      const bvnVerification = await paystackService.verifyBvn(bvn);

      if (!bvnVerification.status) {
        throw new customError('BVN verification failed', StatusCodes.BAD_REQUEST);
      }

      // Create dedicated virtual account
      const dedicatedAccount = await paystackService.createDedicatedAccount({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone.toString(),
      });

      if (!dedicatedAccount.status) {
        throw new customError('Failed to create dedicated account', StatusCodes.BAD_REQUEST);
      }

      // Save DVA details to database
      const dvaData = {
        userId: user._id,
        customerCode: dedicatedAccount.data.customer_code,
        bankName: dedicatedAccount.data.bank.name,
        accountNumber: dedicatedAccount.data.account_number,
        dvaReference: dedicatedAccount.data.account_reference,
      };

      const newDva = await DvaModel.create(dvaData);

      // Update user's bvnVerified status and link to DVA
      await UserModel.updateOne(
        { _id: userId },
        {
          bvnVerified: true,
          bvn: parseInt(bvn),
          dva: newDva._id,
        }
      );

      return {
        success: true,
        message: 'DVA created successfully',
        data: {
          accountNumber: newDva.accountNumber,
          bankName: newDva.bankName,
          customerCode: newDva.customerCode,
        },
      };
    } catch (error: any) {
      throw new customError(
        error.message || 'Failed to verify BVN and create DVA',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle DVA wallet funding from webhook
   * @param payload - Webhook payload from Paystack
   * @returns Promise with funding result
   */
  async handleDvaWalletFunding(payload: any) {
    try {
      const { event, data } = payload;

      // Only handle dedicated account assignment and charge success events
      if (!['dedicatedaccount.assign', 'charge.success'].includes(event)) {
        return { success: false, message: 'Event not handled' };
      }

      // For charge.success events, check if it's a dedicated account funding
      if (event === 'charge.success' && data.authorization?.channel !== 'dedicated_nuban') {
        return { success: false, message: 'Not a DVA funding transaction' };
      }

      const customerCode = data.customer?.customer_code || data.customer_code;
      if (!customerCode) {
        throw new customError('Customer code not found in payload', StatusCodes.BAD_REQUEST);
      }

      // Find the DVA record
      const dva = await DvaModel.findOne({ customerCode }).populate('userId');
      if (!dva) {
        throw new customError('DVA not found', StatusCodes.NOT_FOUND);
      }

      const user = dva.userId as IUser;
      if (!user) {
        throw new customError('User not found', StatusCodes.NOT_FOUND);
      }

      const amount = data.amount / 100; // Convert from kobo to naira

      // Atomically update user's wallet balance
      await this.creditWallet(user, amount);

      // Log successful credit transaction
      await transactionService.createTransaction({
        user: user._id as string,
        amount,
        type: TransactionType.VIRTUAL_ACCOUNT,
        status: TransactionStatus.SUCCESS,
        methodType: TransactionMethodType.CREDIT,
        merchant: TransactionMerchant.PAYSTACK,
        narration: `DVA funding via ${dva.bankName}`,
        reference: data.reference,
      });

      return {
        success: true,
        message: 'Wallet funded successfully',
        data: {
          amount,
          newBalance: parseFloat(user.balance.toString()) + amount,
          reference: data.reference,
        },
      };
    } catch (error: any) {
      throw new customError(
        error.message || 'Failed to process DVA funding',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Withdraw funds to bank account
   * @param userId - User ID
   * @param amount - Amount to withdraw
   * @param bankDetails - Bank details (name, accountNumber, bankCode)
   * @returns Promise with withdrawal result
   */
  async withdrawToBank(userId: string, amount: number, bankDetails: any) {
    try {
      // Find user
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new customError('User not found', StatusCodes.NOT_FOUND);
      }

      const currentBalance = parseFloat(user.balance.toString());

      // Check if user has sufficient funds
      if (currentBalance < amount) {
        throw new customError('Insufficient wallet balance', StatusCodes.BAD_REQUEST);
      }

      // Validate bank details
      if (!bankDetails.name || !bankDetails.accountNumber || !bankDetails.bankCode) {
        throw new customError('Complete bank details required', StatusCodes.BAD_REQUEST);
      }

      // Create pending transaction record first
      const transaction = await transactionService.createTransaction({
        user: userId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        methodType: TransactionMethodType.DEBIT,
        merchant: TransactionMerchant.PAYSTACK,
        narration: `Withdrawal to ${bankDetails.name} - ${bankDetails.accountNumber}`,
      });

      try {
        // Debit user's wallet
        await this.debitWallet(user, amount);

        // Create transfer recipient
        const recipient = await paystackService.createTransferRecipient({
          name: bankDetails.name,
          accountNumber: bankDetails.accountNumber,
          bankCode: bankDetails.bankCode,
        });

        if (!recipient.status) {
          throw new Error('Failed to create transfer recipient');
        }

        // Initiate transfer (amount in kobo)
        const transfer = await paystackService.initiateTransfer(amount * 100, recipient.data.recipient_code);

        if (!transfer.status) {
          throw new Error('Failed to initiate transfer');
        }

        return {
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            amount,
            recipientCode: recipient.data.recipient_code,
            transferCode: transfer.data.transfer_code,
            reference: transfer.data.reference,
            transactionId: transaction._id,
          },
        };
      } catch (transferError: any) {
        // If transfer fails, credit back the wallet and update transaction status
        await this.creditWallet(user, amount);

        // Update transaction status to failed
        await transactionService.createTransaction({
          user: userId,
          amount,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.FAILED,
          methodType: TransactionMethodType.CREDIT,
          merchant: TransactionMerchant.PAYSTACK,
          narration: `Withdrawal reversal - ${transferError.message}`,
        });

        throw new customError(`Withdrawal failed: ${transferError.message}`, StatusCodes.BAD_REQUEST);
      }
    } catch (error: any) {
      throw new customError(
        error.message || 'Failed to process withdrawal',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getWalletBalance(userId: string) {
    try {
      const user = await UserModel.findById(userId).select('balance');
      if (!user) {
        throw new customError('User not found', StatusCodes.NOT_FOUND);
      }
      return {
        success: true,
        message: 'Wallet balance retrieved successfully',
        data: {
          balance: user.balance,
        },
      };
    } catch (error: any) {
      throw new customError(
        error.message || 'Failed to retrieve wallet balance',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export default new WalletService();
