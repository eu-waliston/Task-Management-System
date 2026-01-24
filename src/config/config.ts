import dotenv from 'dotenv';

dotenv.config();

export const config = {
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },
    database: {
        url: process.env.MONGO_URI || 'mongodb://localhost:2717',
        namne: process.env.DB_NAME || 'task_manangment'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expriresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    }
}