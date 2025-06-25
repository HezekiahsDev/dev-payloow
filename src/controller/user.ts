import { Request, Response } from 'express';
import { AuthRequest } from '../types/index';
import { response } from '../utils/response';
import AuthService from '../service/Users/user';
import { StatusCodes } from 'http-status-codes';
class UserController {
  async registerUser(req: Request, res: Response) {
    const result = await AuthService.register(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async registerSuperAdmin(req: Request, res: Response) {
    const result = await AuthService.registerSuperAdmin(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async loginUser(req: Request, res: Response) {
    const result = await AuthService.login(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async getCurrentLoggedInUser(req: AuthRequest, res: Response) {
    const result = await AuthService.getCurrentUser(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async getUserById(req: Request, res: Response) {
    const result = await AuthService.getUserById(req);

    res.status(result.statusCode).json(response(result.message, result.data));
  }

  async getUserDva(req: Request, res: Response) {
    const result = await AuthService.getUserDva(req);

    res.status(StatusCodes.OK).json(response("Get Dva Successfully", result));
  }

  async resetpassword(req: Request, res: Response) {
    const result = await AuthService.resetPassword(req);

    res.status(result.statusCode).json(response(result.message));
  }

  async forgetPassword(req: Request, res: Response) {
    const result = await AuthService.forgetPassword(req);

    res.status(result.statusCode).json(response(result.message));
  }

  async logout(req: Request, res: Response) {
    const result = await AuthService.logout(req);

    res.status(result.statusCode).json(response(result.message));
  }

  async updateVTUAdmin(req: Request, res: Response) {
    const result = await AuthService.updateVtuTopUpAccount(req);

    res.status(result.statusCode).json(response(result.message));
  }

  async setTransactionPin(req: Request, res: Response) {
    const result = await AuthService.setTransactionPin(req);

    res.status(StatusCodes.OK).json(response('Transaction pin created successfully', result));
  }

  async verifyTransactionPin(req: Request, res: Response) {
    const result = await AuthService.verifyTransactionPin(req);
    res.status(StatusCodes.OK).json(response("Transaction pin verified successfully", result));
  }

  async updateTransactionPin(req: Request, res: Response) {
    const result = await AuthService.updateTransactionPin(req);
    res.status(StatusCodes.OK).json(response("Transaction pin updated successfully", result));
  }

  async getPreviousReference(req: Request, res: Response) {
    const result = await AuthService.getReferenceDetails(req);

    res.status(result.statusCode).json(response(result.message));
  }

  async getTopUpAccount(req: Request, res: Response) {
    const result = await AuthService.getVTUStatus(req);

    if (result.statusCode === StatusCodes.OK && result.data !== undefined) {
      res.status(result.statusCode).json(response(result.data));
    } else {
      res.status(result.statusCode).json({ message: result.message });
    }
  }
}

export default new UserController();
