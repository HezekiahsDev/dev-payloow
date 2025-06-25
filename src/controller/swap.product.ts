import { AuthRequest } from '../types';
import { response } from '../utils/response';
import { StatusCodes } from 'http-status-codes';
import { NextFunction, Response } from 'express';
import swapEasybuyService from '../service/easybuy/swap.easybuy.service';

class SwapController {
  async swapProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await swapEasybuyService.swapEasybuyCategories(req);
      res.status(StatusCodes.OK).json(response(`Product Swapped Successfully `, result));
    } catch (error) {
      next(error);
    }
  }

  async getSwappedProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await swapEasybuyService.getAllSwapEasybuyProduct(req);
      res.status(StatusCodes.OK).json(response(`Get Swapped Products`, result));
    } catch (error) {
      next(error);
    }
  }

  async getSingleSwappedProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await swapEasybuyService.getSingleSwapEasybuyProduct(req);
      res.status(StatusCodes.OK).json(response(`Get Single Swapped Product`, result));
    } catch (error) {
      next(error);
    }
  }

  async deleteSingleSwappedProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await swapEasybuyService.deleteSingleSwapEasybuyProduct(req);
      res.status(StatusCodes.OK).json(response(`Delete Single Swapped Product`, result));
    } catch (error) {
      next(error);
    }
  }
}

export default new SwapController();
