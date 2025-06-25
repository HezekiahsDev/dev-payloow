import { StatusCodes } from 'http-status-codes';
import DvaModel from '../models/dva.schema';
import UserModel from '../models/user.schema';
import customError from '../utils/custom.errors';
import WalletService from './wallet.service';
import TransactionService from '../service/transaction.service';
import {
  TransactionMerchant,
  TransactionType,
  TransactionMethodType,
  TransactionStatus,
} from '../models/transactions.schema';
import { IUser } from '../types';

class WebhookService {
  async paystackProcessCharge(data: any) {
    try {
      const amount = data.amount / 100;

      // Skip DVA funding as it's handled by the wallet service
      if (data.channel === 'dedicated_nuban') {
        console.log('DVA funding detected - handled by wallet service');
        return;
      }

      // Handle regular deposit transactions
      if ('metadata' in data && data.metadata !== '' && data.metadata.type === 'deposit') {
        const user = await UserModel.findOne({ paystackCustomerCode: data.customer.customer_code }).lean().exec();
        if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);
        await this.processDeposit({
          amount: amount,
          user: user,
          reference: data.reference,
          merchant: TransactionMerchant.PAYSTACK,
        });
        return;
      }

      // Handle course payments and other transaction types
      if ('metadata' in data && data.metadata !== '' && data.metadata.type === 'course-payment') {
        // Keep existing course payment logic here
        console.log('Course payment detected');
        // Add your existing course payment handling logic
        return;
      }

      console.log('Unhandled charge type:', data);
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      throw error;
    }
  }

  async processDeposit(data: { user: IUser; amount: number; reference: string; merchant: TransactionMerchant }) {
    try {
      // Create transaction record
      await TransactionService.createTransaction({
        amount: data.amount,
        user: String(data.user._id),
        reference: data.reference,
        merchant: data.merchant,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.SUCCESS,
        methodType: TransactionMethodType.CREDIT,
        narration: `Deposit ₦${data.amount}`,
      });

      // Update wallet balance
      await WalletService.creditWallet(data.user, data.amount);
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }
}

export default new WebhookService();
