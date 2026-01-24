import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation Failed') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 400);
        this.name = 'NotFoundErrpr';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 400);
        this.name = 'Access forbiden';
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflit') {
        super(message, 400);
        this.name = 'ConflictError';
    }
}

export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    //log do erro
    logger.error(`Error: ${error.message}`, {
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        stack: error.stack
    });

    // Se for um AppError, usar o status code específico
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        });
        return;
    }

    // Erros de validação do MongoDB
    if (error.name === 'ValidationError' || error.name === 'MongoError') {
        res.status(400).json({
            success: false,
            error: 'Database validation error',
            details: error.message,
        });
        return;
    }

    // Errors do JWT
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: 'Token expired'
        });
        return;
    }

    // Erro padrão (500)
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};