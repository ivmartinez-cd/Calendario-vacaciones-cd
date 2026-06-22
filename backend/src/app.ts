import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // Documentación
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API
  app.use('/api', routes);

  // 404 + errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
