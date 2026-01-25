import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisCache {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('connect', () => {
      logger.info('Connecting to Redis...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client connected and ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis connection closed');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  async set(key: string, value: any, expiration?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expiration) {
        await this.client.setEx(key, expiration, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Redis clear pattern error:', error);
      throw error;
    }
  }
}

export const redisCache = new RedisCache();