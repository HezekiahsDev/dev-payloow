import cors from 'cors';
import YAML from 'yamljs';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUI from 'swagger-ui-express';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { CONFIG } from '../config/index';
import path from 'path';
import fs from 'fs';

class PreRouteMiddleware {
  async handleAllProcesses(app: any) {
    const swaggerDocument = YAML.load('./swagger.yaml');

    // Serve Swagger UI
    app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument, { swaggerOptions: { "persistAuthorization": true } }));

    // Serve raw Swagger YAML file
    app.get('/api-docs.yaml', (req: any, res: any) => {
      const swaggerPath = path.join(process.cwd(), 'swagger.yaml');
      const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
      res.setHeader('Content-Type', 'text/yaml');
      res.setHeader('Content-Disposition', 'attachment; filename=api-docs.yaml');
      res.send(swaggerContent);
    });

    app.use(morgan('tiny'));

    app.use(express.json());

    app.use(helmet());

    app.use(cookieParser(CONFIG.JWT_CREDENTIAL.secret as string));

    app.use(express.urlencoded({ extended: true }));

    app.use(
      cors({
        origin: true,
        credentials: true,
        methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'],
      })
    );

    app.set('trust proxy', 1);

    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again after 15 minutes',
      })
    );

    return app;
  }

  // async saveDataToDB() {

  //     const filePath = path.join(__dirname, '..', 'data', 'file.json');
  //     const fileContent = fs.readFileSync(filePath, 'utf-8');
  //     const servicesData = JSON.parse(fileContent);

  //     try {
  //         await connectDB(CONFIG.mongoDbCredentials.online as string);
  //         const existingData = await ServiceData.findOne({});

  //         if (existingData) {

  //             console.log('Data already exists in the database. Skipping import.');
  //             return;
  //         }

  //         await ServiceData.create(servicesData);

  //         console.log('Data imported successfully!');
  //     } catch (error) {
  //         console.error('Error importing data:', error);
  //     } finally {
  //         await mongoose.disconnect();
  //     }
  // };
}

export default new PreRouteMiddleware();
