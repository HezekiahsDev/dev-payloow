import 'express-async-errors';
import { connectDB } from './database/index';
import router from './router/v1/index';
import { CONFIG, DEPLOYMENT_ENV } from './config/index';
import express, { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import customError from './utils/custom.errors';
import errorHandler from './authMiddleware/error.handler';
import pre_route_middleware from './authMiddleware/pre_route_middleware';

console.log(DEPLOYMENT_ENV);
const app: Express = express();
pre_route_middleware.handleAllProcesses(app);

// Add health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const start = async () => {
  let MONGO_URI = CONFIG.MONGO_URL;
  try {
    await connectDB(MONGO_URI as string);
  } catch (error) {
    throw new customError((error as Error).message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

app.use(router);

errorHandler.handleAllErrors(app);

start().then(async () => {
  app.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`);
  });
});

export default app;
