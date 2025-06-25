import { AuthRequest } from '../types';
import { response } from '../utils/response';
import { NextFunction, Response } from 'express';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import DebtorService from '../service/investments/debtor.service';
import InvestorService from '../service/investments/investor.service';
import BusinessService from '../service/investments/business.service';
class InvestmentController {
  async getAllDebtors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DebtorService.getAllDebtors(req);
      res.status(HttpStatus.OK).json(response(`Get All Debtors`, result));
    } catch (error) {
      next(error);
    }
  }

  async getDebtorById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DebtorService.getDebtorById(req);
      res.status(HttpStatus.OK).json(response(`Get Debtor By Id`, result));
    } catch (error) {
      next(error);
    }
  }

  async getAllInvestors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await InvestorService.getAllInvestors(req);
      res.status(HttpStatus.OK).json(response(`Get All Investors`, result));
    } catch (error) {
      next(error);
    }
  }

  async getInvestorById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await InvestorService.getInvestorById(req);
      res.status(HttpStatus.OK).json(response(`Get Investor By Id`, result));
    } catch (error) {
      next(error);
    }
  }

  async getAllBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BusinessService.getAllBusinesses(req);
      res.status(HttpStatus.OK).json(response(`Get All Businesses`, result));
    } catch (error) {
      next(error);
    }
  }

  async getBusinessById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BusinessService.getBusinessById(req);
      res.status(HttpStatus.OK).json(response(`Get Business By Id`, result));
    } catch (error) {
      next(error);
    }
  }

  async getDebtorBusinesses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BusinessService.getDebtorBusinesses(req);
      res.status(HttpStatus.OK).json(response(`Get Debtor Businesses`, result));
    } catch (error) {
      next(error);
    }
  }
}


export default new InvestmentController();
