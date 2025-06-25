import { AuthRequest } from '../types';
import { response } from '../utils/response';
import { NextFunction, Response } from 'express';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import EasyBuyService from '../service/easybuy/easybuy.service';
import EasyBuyBuyersService from '../service/easybuy/easybuy.buyers.service';
import EasyBuyPartnerService from '../service/easybuy/easybuy.partners.service';

class EasyBuyController {
  async createEasyBuyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.createEasyBuyProfile(req);
      res.status(HttpStatus.OK).json(response(`EasyBuy Profile Created Successfully `, result));
    } catch (error) {
      next(error);
    }
  }

  async getEasyBuyCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.getEasyBuyCategories(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Categories`, result));
    } catch (error) {
      next(error);
    }
  }

  async createEasyBuyCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.createEasyBuyCategories(req);
      res.status(HttpStatus.OK).json(response(`Created EasyBuy Category`, result));
    } catch (error) {
      next(error);
    }
  }

  async createEasyBuyProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.createEasyBuyProduct(req);
      res.status(HttpStatus.OK).json(response(`Created EasyBuy Product`, result));
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getAllProducts(req);
      res.status(HttpStatus.OK).json(response(`Get All Products`, result));
    } catch (error) {
      next(error);
    }
  }

  async getEasyBuyProductsForPartner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.getEasyBuyProducts(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Products For User`, result));
    } catch (error) {
      next(error);
    }
  }

  async getEasyBuyProductForPartner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.getEasyBuyProduct(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Product For User`, result));
    } catch (error) {
      next(error);
    }
  }

  async addEasyBuyProductToCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.addEasyBuyProductToCart(req);
      res
        .status(HttpStatus.OK)
        .json(response(result ? `Added EasyBuy Product To Cart` : `Removed Product from Cart Successfully`, result));
    } catch (error) {
      next(error);
    }
  }

  async removeEasyBuyProductFromCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.removeEasyBuyProductFromCart(req);
      res.status(HttpStatus.OK).json(response(`Removed Product from Cart Successfully`, result));
    } catch (error) {
      next(error);
    }
  }

  async getCartItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getCartItems(req);
      res.status(HttpStatus.OK).json(response(`Get Cart Items`, result));
    } catch (error) {
      next(error);
    }
  }

  async getBuyerDeliveryInformation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getBuyerDeliveryInformation(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Addresses`, result));
    } catch (error) {
      next(error);
    }
  }

  async createEasyBuyCoupon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.createEasyBuyCoupon(req);
      res.status(HttpStatus.OK).json(response(`Create EasyBuy Coupon`, result));
    } catch (error) {
      next(error);
    }
  }

  async getEasyBuyCoupons(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.getEasyBuyCoupons(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Coupons`, result));
    } catch (error) {
      next(error);
    }
  }

  async checkCoupon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyService.checkCoupon(req);
      res.status(HttpStatus.OK).json(response(`Check Coupon`, result));
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.checkOut(req);
      res.status(HttpStatus.OK).json(response(`Check Out`, result));
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getOrders(req);
      res.status(HttpStatus.OK).json(response(`Get Orders`, result));
    } catch (error) {
      next(error);
    }
  }

  async deleteAllProductInCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.deleteAllProductInCart(req);
      res.status(HttpStatus.OK).json(response(`Delete Order Product`, result));
    } catch (error) {
      next(error);
    }
  }

  async getEasyBuyInstallmentOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getInstallmentOrders(req);
      res.status(HttpStatus.OK).json(response(`Get EasyBuy Installment Orders`, result));
    } catch (error) {
      next(error);
    }
  }

  async getAllUserEasyBuyTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyBuyersService.getAllEasyBuyTransactions(req);
      res.status(HttpStatus.OK).json(response(`Get All EasyBuy Transactions`, result));
    } catch (error) {
      next(error);
    }
  }

  // EasyBuy Partner Service Centers
  async createServiceCenter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.createServiceCenter(req);
      res.status(HttpStatus.OK).json(response(`Created Service Center Successfully`, result));
    } catch (error) {
      next(error);
    }
  }

  async getServiceCenters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.getServiceCenters(req);
      res.status(HttpStatus.OK).json(response(`Created Service Center Successfully`, result));
    } catch (error) {
      next(error);
    }
  }
  // EasyBuy Partner Customers
  async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await EasyBuyPartnerService.getCustomers(req);
      res.status(HttpStatus.OK).json(response(`Get Customers`, result));
    } catch (error) {
      next(error);
    }
  }
}

export default new EasyBuyController();
