import { paystackHttpInstance } from './xhr';
import { StatusCodes } from 'http-status-codes';
import customError from '../utils/custom.errors';
import { PaystackSuccessResponse, IBanks, IDva, ICustomer, InitializeTransaction } from 'src/types/paystack';

export const APIGetAllBanks = async () => paystackHttpInstance.get<PaystackSuccessResponse<IBanks[]>>('/bank?currency=NGN').then((res) => res.data.data);

export const APIVerifyBankAccountNumber = async (data: { account_number: string; bank_code: string }) =>
    paystackHttpInstance
        .get<PaystackSuccessResponse<any>>(`/bank/resolve?account_number=${data.account_number}&bank_code=${data.bank_code}`)
        .then((res) => res)
        .catch((err) => {
            throw new customError(err.response.data?.message, StatusCodes.BAD_REQUEST);
        });


export const APICreateCustomer = async (data: { email: string; first_name?: string; last_name?: string; phone?: string }) =>
    paystackHttpInstance
        .post<PaystackSuccessResponse<ICustomer>>('/customer', { ...data, type: 'nuban' }) // add the type nuban in the request
        .then((res) => res.data)
        .catch((err) => {
            const message = err?.response?.data?.message || err?.message || 'An error occurred';
            throw new customError(message, StatusCodes.BAD_REQUEST);
        });

export const APICreateDVA = async (data: { customer: string; preferred_bank: string; phone: string; }) =>
    paystackHttpInstance
        .post<PaystackSuccessResponse<IDva>>('/dedicated_account', { ...data, type: 'nuban' }) // add the type nuban in the request
        .then((res) => res.data)
        .catch((err) => {
            const message = err?.response?.data?.message || err?.message || 'An error occurred';
            throw new customError(message, StatusCodes.BAD_REQUEST);
        });

export const APICreateTransferRecipient = async (data: { name: string; account_number: string; bank_code: string; currency: string }) =>
    paystackHttpInstance
        .post<PaystackSuccessResponse<any>>('/transferrecipient', { ...data, type: 'nuban' }) // add the type nuban in the request
        .then((res) => res.data)
        .catch((err) => {
            const message = err?.response?.data?.message || err?.message || 'An error occurred';
            throw new customError(message, StatusCodes.BAD_REQUEST);
           
        });

export const APITransferFunds = async (data: { amount: number; recipient: string; reference: string; reason: string }) =>
    paystackHttpInstance
        .post<PaystackSuccessResponse<any>>('/transfer', {...data, source: 'balance'})
        .then((res) => res.data)
        .catch((err) => {
            const message = err?.response?.data?.message || err?.message || 'An error occurred';
            throw new customError(message, StatusCodes.BAD_REQUEST);
        });


export const APIInitializeTransaction = async (data: { amount: string; email: string; reference: string; callback_url: string, metadata?: { [key: string]: string } }) =>
    paystackHttpInstance
        .post<PaystackSuccessResponse<InitializeTransaction>>('/transaction/initialize', {...data, source: 'balance'})
        .then((res) => res.data.data)
        .catch((err) => {
            const message = err?.response?.data?.message || err?.message || 'An error occurred';
            throw new customError(message, StatusCodes.BAD_REQUEST);
        });

