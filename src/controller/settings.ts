import { Response } from 'express';
import { AuthRequest } from '../types/index';
import { response } from '../utils/response';
import userSettingsPage from '../service/Users/settings';

class userSettings {
  async changePassword(req: AuthRequest, res: Response) {
    const data = await userSettingsPage.ChangePassword(req);

    res.status(data.statusCode).json(response(data.message));
  }

  async changeEmail(req: AuthRequest, res: Response) {
    const data = await userSettingsPage.ChangeEmail(req);

    res.status(data.statusCode).json(response(data.message));
  }

  async addProfilePicture(req: AuthRequest, res: Response) {
    //TODO: Implement this method
  }

  async updateProfile(req: AuthRequest, res: Response) {
    //TODO: Implement this method
  }
}

export default new userSettings();
