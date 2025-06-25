import { StatusCodes } from 'http-status-codes';
import { Request, Response, NextFunction, Express } from 'express';

class ErrorHandler {
  async handleAllErrors(app: Express) {
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      let customError = {
        statusCode: err.status || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong',
      };

      if (err.name === 'ValidationError') {
        customError.msg = Object.values(err.errors)
          .map((item: any) => item.message)
          .join(',');
        customError.statusCode = 400;
      }

      if ((err.code && err.code === 11000) || err.keyValue === Object(err.keyValue)) {
        customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
        customError.statusCode = 400;
      }

      if (err.code === 11000) {
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Duplicate entry found. Please ensure all fields are unique.',
          data: null,
        };
      }

      if (err.name === 'CastError') {
        customError.msg = `No item found with id : ${err.value}`;
        customError.statusCode = 404;
      }

      if (err.name === 'JsonWebTokenError') {
        customError.msg = 'Invalid token, please login again';
        customError.statusCode = 401;
      }

      if (err.name === 'TokenExpiredError') {
        customError.msg = 'Your token has expired, please login again';
        customError.statusCode = 401;
      }
      return res.status(customError.statusCode).json({ msg: customError.msg });
    });
  }
}

export default new ErrorHandler();
