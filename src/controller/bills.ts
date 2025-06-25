import { Request, Response } from 'express';
import { response } from '../utils/response';
import billsService from '../service/bills-payment/bills.service';

class UserController {
  async GetBillAccount(req: Request, res: Response) {
    const result = await billsService.getSellerUserDetails(req);

    res.status(result.statusCode).json(response(result.message as string));
  }

  async buyData(req: Request, res: Response) {
    const result = await billsService.buyData(req);

    res.status(result.statusCode).json(response(result.message as string));
  }

  async buyAirTime(req: Request, res: Response) {
    const result = await billsService.buyAirTime(req);

    res.status(result?.statusCode).json(response(result.message as string));
  }

  async buyElectricityBill(req: Request, res: Response) {
    const result = await billsService.buyElectricityBill(req);

    res.json(response(result?.message as string));
  }

  async airTimeToCash(req: Request, res: Response) {
    const result = await billsService.AirtimeToCash(req);

    res.json(response(result?.message as string));
  }

  async networkFee(req: Request, res: Response) {
    const result = await billsService.networkFee(req);

    res.json(response(result?.message as string));
  }

  async allNetworks(req: Request, res: Response) {
    const result = await billsService.allNetworks(req);

    res.json(response(result?.message as string));
  }
}

export default new UserController();
