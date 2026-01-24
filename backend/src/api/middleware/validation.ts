import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from './errorHandler';
import { logger } from '../../config/logger';

export type ValidationSchema = z.ZodSchema<any>;

/**
 * Middleware para validação de dados usando Zod
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar o corpo da requisição
      const validatedData = schema.parse(req.body);

      // Substituir o corpo da requisição com os dados validados
      req.body = validatedData;

      logger.debug('Request validation successful', {
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatar erros de validação
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        throw new ValidationError(JSON.stringify({
          message: 'Validation failed',
          errors: formattedErrors,
        }));
      }

      // Se não for um erro do Zod, passar para o próximo middleware de erro
      next(error);
    }
  };
};

/**
 * Middleware para validação de parâmetros de query
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar os parâmetros de query
      const validatedQuery = schema.parse(req.query);

      // Substituir os query params com os dados validados
      req.query = validatedQuery as any;

      logger.debug('Query validation successful', {
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Query validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        throw new ValidationError(JSON.stringify({
          message: 'Query validation failed',
          errors: formattedErrors,
        }));
      }

      next(error);
    }
  };
};

/**
 * Middleware para validação de parâmetros de rota
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar os parâmetros de rota
      const validatedParams = schema.parse(req.params);

      // Substituir os params com os dados validados
      req.params = validatedParams as any;

      logger.debug('Params validation successful', {
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Params validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        throw new ValidationError(JSON.stringify({
          message: 'Params validation failed',
          errors: formattedErrors,
        }));
      }

      next(error);
    }
  };
};

/**
 * Middleware para sanitização de dados
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Função para sanitizar strings
    const sanitizeString = (value: any): any => {
      if (typeof value === 'string') {
        // Remover tags HTML/XML
        value = value.replace(/<[^>]*>/g, '');
        // Remover caracteres de controle
        value = value.replace(/[\x00-\x1F\x7F]/g, '');
        // Trim espaços em branco
        value = value.trim();
        // Escapar caracteres especiais
        value = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
      return value;
    };

    // Função recursiva para sanitizar objetos
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }

      return obj;
    };

    // Aplicar sanitização no body, query e params
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
  } catch (error) {
    logger.error('Input sanitization failed', error as Error);
    next(error);
  }
};

/**
 * Middleware para validação de arquivos (multer)
 */
export const validateFile = (
  allowedTypes: string[],
  maxSize: number // em bytes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        // TODO Property 'file' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.ts(2339)
        return next();
      }

      const { mimetype, size } = req.file;
      // TODO Property 'file' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.ts(2339)
      // Validar tipo do arquivo
      if (!allowedTypes.includes(mimetype)) {
        throw new ValidationError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      // Validar tamanho do arquivo
      if (size > maxSize) {
        throw new ValidationError(
          `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
        );
      }

      logger.debug('File validation successful', {
        filename: req.file.originalname,
        // TODO Property 'file' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'.ts(2339)
        mimetype,
        size,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para validação de headers
 */
export const validateHeaders = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar os headers
      const validatedHeaders = schema.parse(req.headers);

      logger.debug('Headers validation successful', {
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Headers validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        throw new ValidationError(JSON.stringify({
          message: 'Headers validation failed',
          errors: formattedErrors,
        }));
      }

      next(error);
    }
  };
};

// Alias para compatibilidade com código existente
export const validateMiddleware = validate;

// Exportar tipos úteis
export type { ZodError };
export { z };