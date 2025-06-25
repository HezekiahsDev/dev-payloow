import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index';
import { Payload } from '../types/index';

class JsonWebTokens {
  async generateToken(payload: Payload) {
    if (CONFIG.JWT_CREDENTIAL.secret) {
      const token = jwt.sign({ user: payload.user, refreshToken: payload.refreshToken }, CONFIG.JWT_CREDENTIAL.secret);
      return token;
    }
  }

  async verifyToken(token: string) {
    if (CONFIG.JWT_CREDENTIAL.secret) {
      const decoded = jwt.verify(token, CONFIG.JWT_CREDENTIAL.secret);
      return decoded;
    }
  }

  async getTokens(userPayload: Payload, refreshToken: Payload['refreshToken'] | undefined = undefined) {
    const accessToken = await this.generateToken({ user: userPayload.user });

    return {
      accessToken,
    };
  }
}

export default new JsonWebTokens();
