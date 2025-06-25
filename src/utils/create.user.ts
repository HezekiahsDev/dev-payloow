import { ITokens } from '../types/index';

export const createToken = (user: ITokens) => {
  return {
    _id: user._id,
    phone: user.phone,
    role: user.role,
  };
};
