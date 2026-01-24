import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';
import { Database } from './config/database';
import { userRoutes } from './api/routes/userRoutes';
import { taskRoutes } from './api/routes/taskRoutes';
import { errorHandler } from './api/middleware/errorHandler';
import { Timestamp } from 'mongodb';

class Application {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupMiddlewares();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddlewares(): void {
        this.app.use(helmet());
        this.app.use(cors({
            origin: config.cors.origin
        }))

        this.app.use(morgan('combined'))
        this.app.use(express.json({ limit: '10mb' }))
        this.app.use(express.urlencoded({ extended: true }))
    }

    private setupRoutes(): void {
        this.app.use('/api/users', userRoutes)
        this.app.use('/api/tasks', taskRoutes)

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
        })
    }

    private setupErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            await Database.connect();

            this.app.listen(config.server.port, () => {
                console.log(`Server Running on port ${config.server.port}`);
                console.log(`Environment: ${config.server.environment}`);
            })

        } catch (error) {
            console.log('Failed to start application:', error);
            process.exit(1)
        }
    }

    public async shutdown(): Promise<void> {
        await Database.disconnect();
        process.exit(0);
    }
}

// Inicialização da aplicação
const app = new Application();
app.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, Shutting down gracefully....');
    app.shutdown();

});

process.on('SIGINT', () => {
    console.log('Received SIGINT, Shutting down gracefully....');
    app.shutdown();

});
