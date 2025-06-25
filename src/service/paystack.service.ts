import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { CONFIG } from '../config';

export class PaystackService {
  private httpClient: AxiosInstance;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = CONFIG.PAYSTACK.PAYSTACK_SECRET_KEY;
    this.baseUrl = CONFIG.PAYSTACK.PAYSTACK_BASE_URL || 'https://api.paystack.co';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verify BVN through Paystack's verification endpoint
   * @param bvn - Bank Verification Number to verify
   * @returns Promise with verification result
   */
  async verifyBvn(bvn: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/identity/bvn/resolve`, {
        params: { bvn },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`BVN verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a dedicated virtual account for a user
   * @param user - User object containing email, firstName, lastName, and phone
   * @returns Promise with dedicated account details
   */
  async createDedicatedAccount(user: any): Promise<any> {
    try {
      const payload = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone,
        preferred_bank: 'wema-bank', // Default to Wema Bank, can be made configurable
      };

      const response = await this.httpClient.post('/dedicated_account', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(`Dedicated account creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a transfer recipient for bank transfers
   * @param bankDetails - Object containing name, accountNumber, and bankCode
   * @returns Promise with recipient details
   */
  async createTransferRecipient(bankDetails: any): Promise<any> {
    try {
      const payload = {
        type: 'nuban',
        name: bankDetails.name,
        account_number: bankDetails.accountNumber,
        bank_code: bankDetails.bankCode,
        currency: 'NGN',
      };

      const response = await this.httpClient.post('/transferrecipient', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(`Transfer recipient creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Initiate a transfer to a saved recipient
   * @param amount - Amount to transfer in kobo (smallest currency unit)
   * @param recipientCode - Recipient code from createTransferRecipient
   * @returns Promise with transfer details
   */
  async initiateTransfer(amount: number, recipientCode: string): Promise<any> {
    try {
      const payload = {
        source: 'balance',
        amount: amount, // Amount should be in kobo
        recipient: recipientCode,
        reason: 'User withdrawal request',
      };

      const response = await this.httpClient.post('/transfer', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(`Transfer initiation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature to ensure authenticity
   * @param signature - Signature from the x-paystack-signature header
   * @param payload - Raw payload from the webhook request
   * @returns Boolean indicating if the signature is valid
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      // Create HMAC SHA512 hash using the secret key
      const hash = crypto.createHmac('sha512', this.secretKey).update(payload, 'utf8').digest('hex');

      // Compare the computed hash with the signature
      return hash === signature;
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Verify a transaction reference
   * @param reference - Transaction reference to verify
   * @returns Promise with transaction details
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/transaction/verify/${reference}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Transaction verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get list of supported banks
   * @returns Promise with list of banks
   */
  async getBanks(): Promise<any> {
    try {
      const response = await this.httpClient.get('/bank');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch banks: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Resolve bank account number to get account details
   * @param accountNumber - Account number to resolve
   * @param bankCode - Bank code
   * @returns Promise with account details
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await this.httpClient.get('/bank/resolve', {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Account resolution failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Export singleton instance
export const paystackService = new PaystackService();
