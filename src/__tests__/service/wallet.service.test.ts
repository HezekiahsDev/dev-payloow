import mongoose from 'mongoose';
import WalletService from '../../service/wallet.service';
import UserModel from '../../models/user.schema';
import DvaModel from '../../models/dva.schema';
import TransactionModel from '../../models/transactions.schema';
import { IUser } from '../../types';

// Mock PaystackService
jest.mock('../../service/paystack.service', () => ({
  paystackService: {
    verifyBvn: jest.fn(),
    createDedicatedAccount: jest.fn(),
    createTransferRecipient: jest.fn(),
    initiateTransfer: jest.fn(),
  },
}));

describe('WalletService', () => {
  let testUser: IUser;

  beforeEach(async () => {
    // Create test user
    testUser = await UserModel.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      phone: 8012345678,
      password: 'password123',
      balance: mongoose.Types.Decimal128.fromString('1000.00'),
      accountDisabled: false,
      role: 'user',
    });
  });

  describe('verifyAndCreateDvaForUser', () => {
    it('should verify BVN and create DVA successfully', async () => {
      // Arrange
      const bvn = '12345678901';
      const { paystackService } = require('../../service/paystack.service');

      paystackService.verifyBvn.mockResolvedValue({
        status: true,
        data: { first_name: 'John', last_name: 'Doe' },
      });

      paystackService.createDedicatedAccount.mockResolvedValue({
        status: true,
        data: {
          customer_code: 'CUS_test123',
          account_number: '1234567890',
          bank: { name: 'Wema Bank' },
          account_reference: 'REF_test123',
        },
      });

      // Act
      const result = await WalletService.verifyAndCreateDvaForUser(testUser._id as string, bvn);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('DVA created successfully');
      expect(result.data.accountNumber).toBe('1234567890');

      // Verify DVA was created
      const dva = await DvaModel.findOne({ userId: testUser._id });
      expect(dva).toBeTruthy();

      // Verify user was updated
      const updatedUser = await UserModel.findById(testUser._id);
      expect(updatedUser?.bvnVerified).toBe(true);
      expect(updatedUser?.bvn).toBe(parseInt(bvn));
    });

    it('should throw error if user already has DVA', async () => {
      // Arrange
      await DvaModel.create({
        userId: testUser._id,
        customerCode: 'CUS_existing',
        bankName: 'Wema Bank',
        accountNumber: '9876543210',
        dvaReference: 'REF_existing',
      });

      // Act & Assert
      await expect(WalletService.verifyAndCreateDvaForUser(testUser._id as string, '12345678901')).rejects.toThrow(
        'User already has a DVA account'
      );
    });
  });

  describe('handleDvaWalletFunding', () => {
    beforeEach(async () => {
      // Create DVA for user
      await DvaModel.create({
        userId: testUser._id,
        customerCode: 'CUS_test123',
        bankName: 'Wema Bank',
        accountNumber: '1234567890',
        dvaReference: 'REF_test123',
      });
    });

    it('should handle DVA funding successfully', async () => {
      // Arrange
      const payload = {
        event: 'charge.success',
        data: {
          amount: 50000, // 500 naira in kobo
          reference: 'REF_funding123',
          customer: {
            customer_code: 'CUS_test123',
          },
          authorization: {
            channel: 'dedicated_nuban',
          },
        },
      };

      const initialBalance = parseFloat(testUser.balance.toString());

      // Act
      const result = await WalletService.handleDvaWalletFunding(payload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Wallet funded successfully');
      expect(result.data?.amount).toBe(500);

      // Verify user balance was updated
      const updatedUser = await UserModel.findById(testUser._id);
      const newBalance = parseFloat(updatedUser!.balance.toString());
      expect(newBalance).toBe(initialBalance + 500);

      // Verify transaction was logged
      const transaction = await TransactionModel.findOne({ reference: 'REF_funding123' });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount.toString()).toBe('500');
    });

    it('should skip non-DVA funding events', async () => {
      // Arrange
      const payload = {
        event: 'subscription.create',
        data: {
          amount: 50000,
          customer: { customer_code: 'CUS_test123' },
        },
      };

      // Act
      const result = await WalletService.handleDvaWalletFunding(payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Event not handled');
    });
  });

  describe('withdrawToBank', () => {
    beforeEach(async () => {
      // Set user balance to a higher amount for withdrawal tests
      await UserModel.updateOne({ _id: testUser._id }, { balance: mongoose.Types.Decimal128.fromString('2000.00') });
    });

    it('should initiate withdrawal successfully', async () => {
      // Arrange
      const amount = 500;
      const bankDetails = {
        name: 'John Doe',
        accountNumber: '0123456789',
        bankCode: '058',
      };

      const { paystackService } = require('../../service/paystack.service');
      paystackService.createTransferRecipient.mockResolvedValue({
        status: true,
        data: { recipient_code: 'RCP_test123' },
      });

      paystackService.initiateTransfer.mockResolvedValue({
        status: true,
        data: {
          transfer_code: 'TRF_test123',
          reference: 'REF_withdrawal123',
        },
      });

      // Act
      const result = await WalletService.withdrawToBank(testUser._id as string, amount, bankDetails);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Withdrawal initiated successfully');
      expect(result.data.transferCode).toBe('TRF_test123');

      // Verify user balance was debited
      const updatedUser = await UserModel.findById(testUser._id);
      const newBalance = parseFloat(updatedUser!.balance.toString());
      expect(newBalance).toBe(1500); // 2000 - 500
    });

    it('should throw error for insufficient balance', async () => {
      // Arrange
      const amount = 3000; // More than user's balance
      const bankDetails = {
        name: 'John Doe',
        accountNumber: '0123456789',
        bankCode: '058',
      };

      // Act & Assert
      await expect(WalletService.withdrawToBank(testUser._id as string, amount, bankDetails)).rejects.toThrow(
        'Insufficient wallet balance'
      );
    });
  });

  describe('creditWallet', () => {
    it('should credit user wallet successfully', async () => {
      // Arrange
      const creditAmount = 500;
      const initialBalance = parseFloat(testUser.balance.toString());

      // Act
      await WalletService.creditWallet(testUser, creditAmount);

      // Assert
      const updatedUser = await UserModel.findById(testUser._id);
      const newBalance = parseFloat(updatedUser!.balance.toString());
      expect(newBalance).toBe(initialBalance + creditAmount);
    });
  });

  describe('debitWallet', () => {
    it('should debit user wallet successfully', async () => {
      // Arrange
      const debitAmount = 200;
      const initialBalance = parseFloat(testUser.balance.toString());

      // Act
      await WalletService.debitWallet(testUser, debitAmount);

      // Assert
      const updatedUser = await UserModel.findById(testUser._id);
      const newBalance = parseFloat(updatedUser!.balance.toString());
      expect(newBalance).toBe(initialBalance - debitAmount);
    });
  });
});
