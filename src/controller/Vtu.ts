import { Request, Response } from 'express';
import { response } from '../utils/response';
import { AuthRequest } from '../types/index';
import VTU from '../service/bills-payment/VTU.ng/index.service';

class WalletController {
  async getVTUProvidersWalletBalance(req: Request, res: Response) {
    const result = await VTU.getVTUProvidersWalletBalance(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async purchaseAirtime(req: AuthRequest, res: Response) {
    const result = await VTU.purchaseAirtime(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }
  async purchaseCableTV(req: AuthRequest, res: Response) {
    const result = await VTU.purchaseCableTV(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }
  async purchaseData(req: AuthRequest, res: Response) {
    const result = await VTU.purchaseData(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }
  async purchaseElectricity(req: AuthRequest, res: Response) {
    const result = await VTU.purchaseElectricity(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }
  async verifyCustomer(req: AuthRequest, res: Response) {
    const result = await VTU.verifyCustomer(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async getVariations(req: AuthRequest, res: Response) {
    const result = await VTU.getVariations(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }
}

export default new WalletController();
