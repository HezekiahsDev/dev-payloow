import { AuthRequest } from '../types';
import { response } from '../utils/response';
import { Response, NextFunction } from 'express';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import easybuyPartnersInventory from '../service/easybuy/easybuy.partners-inventory';


class EasyBuyInventory {
  async getProductInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.ProductInventory(req);
      res.status(HttpStatus.OK).json(response(`Inventory`, result));
    } catch (error) {
      next(error);
    }
  }

  async getOrderInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.OrderInventory(req);
      res.status(HttpStatus.OK).json(response(`Order Inventory`, result));
    } catch (error) {
      next(error);
    }
  }

  async getSingleUserInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.getSingleUserInventory(req);

      res.status(HttpStatus.OK).json(response(`Single User Inventory`, result));
    } catch (error) {
      next(error);
    }
  }

  async numberOfActiveCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.numberOfActiveCustomers(req);

      res.status(HttpStatus.OK).json(response(`Number of Active Order Users`, result));
    } catch (error) {
      next(error);
    }
  }

  async NumberOfSolarAndInverterAndStockPreview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.getNumberOfSolarAndPhonesAndStocks(req);

      res.status(HttpStatus.OK).json(response(`Solar and Inverter Stock Preview`, result));
    } catch (error) {
      next(error);
    }
  }

  async GetPercentageOfInstallmentOrdersPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await easybuyPartnersInventory.getPercentageOfInstallmentOrdersPaid(req);

      res.status(HttpStatus.OK).json(response(`Solar and Inverter Stock Preview`, result));
    } catch (error) {
      next(error);
    }
  }
}

export default new EasyBuyInventory();
