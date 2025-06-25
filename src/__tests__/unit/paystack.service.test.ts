import { PaystackService } from '../../service/paystack.service';
import axios from 'axios';
import crypto from 'crypto';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../../config', () => ({
  CONFIG: {
    PAYSTACK: {
      PAYSTACK_SECRET_KEY: 'test-secret-key',
      PAYSTACK_BASE_URL: 'https://api.paystack.co',
    },
  },
}));

describe('PaystackService', () => {
  let paystackService: PaystackService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock axios.create to return mocked axios instance
    mockedAxios.create = jest.fn().mockReturnValue(mockedAxios);

    paystackService = new PaystackService();
  });

  describe('verifyBvn', () => {
    it('should verify BVN successfully', async () => {
      // Arrange
      const bvn = '12345678901';
      const mockResponse = {
        data: {
          status: true,
          message: 'BVN verification successful',
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await paystackService.verifyBvn(bvn);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith('/identity/bvn/resolve', {
        params: { bvn },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when BVN verification fails', async () => {
      // Arrange
      const bvn = '12345678901';
      const errorResponse = {
        response: {
          data: {
            message: 'Invalid BVN',
          },
        },
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(paystackService.verifyBvn(bvn)).rejects.toThrow('BVN verification failed: Invalid BVN');
    });
  });

  describe('createDedicatedAccount', () => {
    it('should create dedicated account successfully', async () => {
      // Arrange
      const user = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '08012345678',
      };

      const mockResponse = {
        data: {
          status: true,
          data: {
            account_number: '1234567890',
            customer_code: 'CUS_test123',
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await paystackService.createDedicatedAccount(user);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith('/dedicated_account', {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone,
        preferred_bank: 'wema-bank',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature correctly', () => {
      // Arrange
      const payload = JSON.stringify({ event: 'charge.success' });
      const secretKey = 'test-secret-key';

      // Create expected hash
      const expectedHash = crypto.createHmac('sha512', secretKey).update(payload, 'utf8').digest('hex');

      // Act
      const result = paystackService.verifyWebhookSignature(expectedHash, payload);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      // Arrange
      const payload = JSON.stringify({ event: 'charge.success' });
      const invalidSignature = 'invalid-signature';

      // Act
      const result = paystackService.verifyWebhookSignature(invalidSignature, payload);

      // Assert
      expect(result).toBe(false);
    });
  });
});
