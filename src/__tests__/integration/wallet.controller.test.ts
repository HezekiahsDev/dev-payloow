import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import WalletController from '../../controller/wallet.controller';
import UserModel from '../../models/user.schema';
import DvaModel from '../../models/dva.schema';
import { IUser } from '../../types';
import auth from '../../authMiddleware/authMiddleware';

// Mock auth middleware for testing
jest.mock('../../authMiddleware/authMiddleware', () => {
  return jest.fn(() => {
    return (req: any, res: any, next: any) => {
      req.user = { _id: 'test-user-id' };
      next();
    };
  });
});

// Mock PaystackService
jest.mock('../../service/paystack.service', () => ({
  paystackService: {
    verifyBvn: jest.fn(),
    createDedicatedAccount: jest.fn(),
    createTransferRecipient: jest.fn(),
    initiateTransfer: jest.fn(),
  },
}));

describe('Wallet Controller Integration Tests', () => {
  let app: express.Application;
  let testUser: IUser;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());

    // Setup routes
    app.post('/verify-bvn', auth('user'), WalletController.verifyBvn);
    app.post('/withdraw', auth('user'), WalletController.withdraw);
  });

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

  describe('POST /verify-bvn', () => {
    it('should verify BVN and create DVA successfully', async () => {
      // Arrange
      const bvn = '12345678901';

      // Mock PaystackService responses
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
      const response = await request(app).post('/verify-bvn').send({ bvn }).expect(200);

      // Assert
      expect(response.body.message).toBe('DVA created successfully');
      expect(response.body.data).toHaveProperty('accountNumber');
      expect(response.body.data).toHaveProperty('bankName');

      // Verify DVA was created in database
      const dva = await DvaModel.findOne({ userId: testUser._id });
      expect(dva).toBeTruthy();
      expect(dva?.accountNumber).toBe('1234567890');

      // Verify user was updated
      const updatedUser = await UserModel.findById(testUser._id);
      expect(updatedUser?.bvnVerified).toBe(true);
    });

    it('should return 400 when BVN is missing', async () => {
      // Act
      const response = await request(app).post('/verify-bvn').send({}).expect(400);

      // Assert
      expect(response.body.message).toBe('BVN is required');
    });
  });

  describe('POST /withdraw', () => {
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

    it('should initiate withdrawal successfully', async () => {
      // Arrange
      const withdrawalData = {
        amount: 500,
        bankDetails: {
          name: 'John Doe',
          accountNumber: '0123456789',
          bankCode: '058',
        },
      };

      // Mock PaystackService responses
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
      const response = await request(app).post('/withdraw').send(withdrawalData).expect(200);

      // Assert
      expect(response.body.message).toBe('Withdrawal initiated successfully');
      expect(response.body.data).toHaveProperty('transferCode');
      expect(response.body.data).toHaveProperty('reference');

      // Verify user balance was debited
      const updatedUser = await UserModel.findById(testUser._id);
      const newBalance = parseFloat(updatedUser!.balance.toString());
      expect(newBalance).toBe(500); // 1000 - 500
    });

    it('should return 400 when insufficient balance', async () => {
      // Arrange
      const withdrawalData = {
        amount: 1500, // More than user's balance
        bankDetails: {
          name: 'John Doe',
          accountNumber: '0123456789',
          bankCode: '058',
        },
      };

      // Act
      const response = await request(app).post('/withdraw').send(withdrawalData).expect(400);

      // Assert
      expect(response.body.message).toBe('Insufficient wallet balance');
    });
  });
});
