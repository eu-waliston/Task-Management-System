import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from './config';
import path from 'path';
import fs from 'fs';

// Criar diretório de logs se não existir
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, metadata } = winston.format;

// Formato personalizado para logs
const customFormat = printf(({ level, message, timestamp, stack, metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  const stackTrace = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message} ${meta}${stackTrace}`;
});

// Formato para console (com cores)
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  customFormat
);

// Formato para arquivos
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  metadata(),
  customFormat
);

// Transportes (destinos dos logs)
const transports: winston.transport[] = [];

// Console (apenas em desenvolvimento)
if (config.server.environment !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// Arquivo diário para todos os logs
transports.push(
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'info',
  })
);

// Arquivo separado para erros
transports.push(
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '60d',
    format: fileFormat,
    level: 'error',
  })
);

// Arquivo separado para HTTP requests
transports.push(
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'http',
  })
);

// Criar o logger principal
export const logger = winston.createLogger({
  level: config.server.environment === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format((info) => {
      // Adicionar contexto padrão
      info.environment = config.server.environment;
      info.service = 'task-management-system';
      return info;
    })()
  ),
  transports,
  exitOnError: false,
});

// Stream para uso com morgan (HTTP logging)
export const httpLoggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Funções helper para logging estruturado
export const structuredLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    const logMeta = {
      ...meta,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    };
    logger.error(message, logMeta);
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, meta);
  },

  // Log de início de requisição
  requestStart: (req: any) => {
    logger.info('Request started', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  },

  // Log de finalização de requisição
  requestEnd: (req: any, res: any, responseTime: number) => {
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
    });
  },

  // Log de erro de requisição
  requestError: (req: any, error: Error) => {
    logger.error('Request error', error, {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
  },

  // Log de operações de banco de dados
  database: {
    query: (collection: string, operation: string, query: any, duration: number) => {
      logger.debug('Database query', {
        collection,
        operation,
        query: JSON.stringify(query),
        duration: `${duration}ms`,
      });
    },

    error: (collection: string, operation: string, error: Error, query: any) => {
      logger.error('Database error', error, {
        collection,
        operation,
        query: JSON.stringify(query),
      });
    },

    connection: (status: 'connected' | 'disconnected' | 'error', details?: string) => {
      const level = status === 'error' ? 'error' : 'info';
      logger.log(level, `Database ${status}`, { details });
    },
  },

  // Log de autenticação
  auth: {
    login: (userId: string, success: boolean, ip: string) => {
      const level = success ? 'info' : 'warn';
      logger.log(level, 'User login attempt', {
        userId,
        success,
        ip,
      });
    },

    logout: (userId: string) => {
      logger.info('User logout', { userId });
    },

    tokenRefresh: (userId: string) => {
      logger.debug('Token refreshed', { userId });
    },
  },

  // Log de negócio
  business: {
    taskCreated: (taskId: string, createdBy: string, projectId: string) => {
      logger.info('Task created', {
        taskId,
        createdBy,
        projectId,
      });
    },

    taskUpdated: (taskId: string, updatedBy: string, changes: Record<string, any>) => {
      logger.info('Task updated', {
        taskId,
        updatedBy,
        changes: JSON.stringify(changes),
      });
    },

    userRegistered: (userId: string, email: string, role: string) => {
      logger.info('User registered', {
        userId,
        email,
        role,
      });
    },
  },
};

// Middleware para adicionar ID de requisição
export const requestLoggerMiddleware = (req: any, res: any, next: any) => {
  const requestId = require('crypto').randomUUID();

  // Adicionar ID à requisição
  req.requestId = requestId;

  // Adicionar ID aos logs
  logger.defaultMeta = { ...logger.defaultMeta, requestId };

  // Log de início
  structuredLogger.requestStart(req);

  const startTime = Date.now();

  // Hook para log de finalização
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    structuredLogger.requestEnd(req, res, responseTime);
  });

  // Hook para log de erro
  res.on('error', (error: Error) => {
    structuredLogger.requestError(req, error);
  });

  next();
};

// Configurar log de exceções não tratadas
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.stack : reason,
    promise: promise.toString(),
  });
});

export default logger;