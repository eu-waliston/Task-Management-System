import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';
import { Database } from './config/database';
import { userRoutes } from './api/routes/userRoutes';
import { taskRoutes } from './api/routes/taskRoutes';
import { errorHandler } from './api/middleware/errorHandler';
import { setupSwagger } from './config/swagger';
// TODO Cannot find module './config/swagger' or its corresponding type declarations.
import { logger, httpLoggerStream, requestLoggerMiddleware } from './config/logger';

class Application {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // Segurança
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));

    // Logging
    this.app.use(requestLoggerMiddleware);
    this.app.use(morgan('combined', { stream: httpLoggerStream }));

    // Parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'task-management-api',
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API Routes
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/tasks', taskRoutes);

    // Swagger documentation
    if (config.server.environment !== 'production') {
      setupSwagger(this.app);
    }
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Conectar ao banco de dados
      await Database.connect();

      // Iniciar servidor
      this.app.listen(config.server.port, () => {
        logger.info(`Server running on port ${config.server.port}`, {
          environment: config.server.environment,
          port: config.server.port,
        });

        if (config.server.environment !== 'production') {
          logger.info(`Swagger docs available at http://localhost:${config.server.port}/api-docs`);
        }
      });
    } catch (error) {
      logger.error('Failed to start application', error as Error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down application gracefully...');

    try {
      await Database.disconnect();
      logger.info('Application shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error as Error);
    }

    process.exit(0);
  }
}

// Inicialização da aplicação
const app = new Application();
app.start();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT signal');
  app.shutdown();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal');
  app.shutdown();
});