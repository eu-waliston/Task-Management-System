import { Request, Response, NextFunction } from 'express';
import { redisCache } from '../../config/redis';
import logger from '../../config/logger';

export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisCache.get(key);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Interceptar a resposta para cachear
      const originalSend = res.json;
      res.json = function (body: any): Response {
        redisCache.set(key, body, duration).catch(error => {
          logger.error('Cache set error:', error);
        });
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};