import JWT from 'jsonwebtoken';
import { CONFIG } from '../config/index';
import { AuthRequest } from '../types/index';
import userSchema from '../models/user.schema';
import { StatusCodes } from 'http-status-codes';
import customError from '../utils/custom.errors';
import { Response, NextFunction } from 'express';
import { createToken } from '../utils/create.user';

function auth(roles: string | string[] = []) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.headers.authorization)
        throw new customError('unauthorized access: token not found', StatusCodes.UNAUTHORIZED);

      const accessToken: string = req.headers.authorization;

      const decoded: any = JWT.verify(
        accessToken.replace('Bearer ', ''),
        CONFIG.JWT_CREDENTIAL.secret as string,
        (err: any, decoded: any) => {
          if (err) throw new customError('-middleware/token-expired', StatusCodes.UNAUTHORIZED);

          return decoded;
        }
      );

      const user: any = await userSchema.findOne({ _id: decoded.user._id });

      if (!user) throw new customError('-middleware/user-not-found', StatusCodes.NOT_FOUND);

      const createTokens = createToken(user);
      
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new customError('-middleware/user-not-authorized', StatusCodes.UNAUTHORIZED);
      }

      req.user = createTokens;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default auth;
