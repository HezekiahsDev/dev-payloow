import { Request, Response } from 'express';
import crypto from 'crypto';
import { CONFIG } from '../config';
import webhookService from '../service/webhook.service';
import walletService from '../service/wallet.service';
import TransactionModel from '../models/transactions.schema';
import UserModel from '../models/user.schema';
import { TransactionStatus } from '../models/transactions.schema';

class WebhookController {
  async handlePaystackWebhook(req: Request, res: Response) {
    try {
      console.log('Paystack Webhook hit');
      const secret = CONFIG.PAYSTACK.PAYSTACK_SECRET_KEY;

      if (!req.body) {
        return res.status(400).json({ message: 'Invalid request body' });
      }

      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).json({ message: 'Invalid paystack signature' });
      }

      const events = req.body;

      switch (events.event) {
        case 'charge.success':
          const data = events.data;

          // Check if it's a DVA funding payment
          if (data.channel === 'dedicated_nuban' || (data.metadata && data.metadata.type === 'dva-funding')) {
            await walletService.handleDvaWalletFunding(events);
          } else {
            // Keep existing logic for course payments and other charges
            await webhookService.paystackProcessCharge(data);
          }
          break;

        case 'transfer.success':
          await this.handleTransferSuccess(events.data);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(events.data);
          break;

        default:
          console.log(`Unhandled webhook event: ${events.event}`);
      }

      return res.status(200).json({ message: true });
    } catch (error) {
      console.error('Error handling Paystack webhook:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Handle successful transfer webhook
   * @param data - Transfer data from Paystack
   */
  private async handleTransferSuccess(data: any) {
    try {
      const { transfer_code, reference } = data;

      // Find the transaction using the transfer reference or transfer_code
      const transaction = await TransactionModel.findOne({
        $or: [{ reference: reference }, { reference: transfer_code }],
        status: TransactionStatus.PENDING,
      });

      if (transaction) {
        // Update transaction status to success
        await TransactionModel.updateOne({ _id: transaction._id }, { status: TransactionStatus.SUCCESS });

        console.log(`Transfer successful: ${reference || transfer_code}`);
      } else {
        console.log(`No pending transaction found for transfer: ${reference || transfer_code}`);
      }
    } catch (error) {
      console.error('Error handling transfer success:', error);
      throw error;
    }
  }

  /**
   * Handle failed transfer webhook
   * @param data - Transfer data from Paystack
   */
  private async handleTransferFailed(data: any) {
    try {
      const { transfer_code, reference, amount } = data;

      // Find the transaction using the transfer reference or transfer_code
      const transaction = await TransactionModel.findOne({
        $or: [{ reference: reference }, { reference: transfer_code }],
        status: TransactionStatus.PENDING,
      }).populate('user');

      if (transaction) {
        // Update transaction status to failed
        await TransactionModel.updateOne({ _id: transaction._id }, { status: TransactionStatus.FAILED });

        // Credit the amount back to user's wallet since withdrawal failed
        const user = await UserModel.findById(transaction.user);
        if (user) {
          const refundAmount = amount ? amount / 100 : parseFloat(transaction.amount.toString());
          await walletService.creditWallet(user, refundAmount);

          console.log(`Transfer failed, refunded ₦${refundAmount} to user ${user._id}`);
        }
      } else {
        console.log(`No pending transaction found for failed transfer: ${reference || transfer_code}`);
      }
    } catch (error) {
      console.error('Error handling transfer failure:', error);
      throw error;
    }
  }
}

export default new WebhookController();
