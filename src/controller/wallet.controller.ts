import { response } from '../utils/response';
import { Request, Response } from 'express';
import { AuthRequest } from '../types/index';
import WalletService from '../service/wallet.service';
import { StatusCodes } from 'http-status-codes';
class WalletController {
  async deposit(req: AuthRequest, res: Response) {
    const result = await WalletService.deposit(req);

    res.status(StatusCodes.OK).json(response('Link Generated', result));
  }

  async verifyBvn(req: AuthRequest, res: Response) {
    try {
      const { bvn } = req.body;
      const userId = req.user?._id;

      if (!bvn) {
        return res.status(StatusCodes.BAD_REQUEST).json(response('BVN is required', null));
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json(response('User not authenticated', null));
      }

      const result = await WalletService.verifyAndCreateDvaForUser(userId, bvn);

      res.status(StatusCodes.OK).json(response(result.message, result.data));
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(response(error.message || 'BVN verification failed', null));
    }
  }

  async withdraw(req: AuthRequest, res: Response) {
    try {
      const { amount, bankDetails } = req.body;
      const userId = req.user?._id;

      if (!amount || !bankDetails) {
        return res.status(StatusCodes.BAD_REQUEST).json(response('Amount and bank details are required', null));
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json(response('User not authenticated', null));
      }

      const result = await WalletService.withdrawToBank(userId, amount, bankDetails);

      res.status(StatusCodes.OK).json(response(result.message, result.data));
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(response(error.message || 'Withdrawal failed', null));
    }
  }

  async getWalletBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json(response('User not authenticated', null));
      }

      const result = await WalletService.getWalletBalance(userId);

      res.status(StatusCodes.OK).json(response(result.message, result.data));
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(response(error.message || 'Failed to retrieve wallet balance', null));
    }
  }
}

export default new WalletController();
