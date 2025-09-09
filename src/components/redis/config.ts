/**
 * Redis configuration and connection management
 */

import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export class RedisConnection {
  private client: RedisClientType | null = null;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    this.client = createClient({
      socket: {
        host: this.config.host,
        port: this.config.port,
      },
      password: this.config.password,
      database: this.config.db || 0,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.disconnect();
    }
  }

  getClient(): RedisClientType {
    if (!this.client?.isOpen) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  async ping(): Promise<string> {
    const client = this.getClient();
    return await client.ping();
  }

  async flushAll(): Promise<void> {
    const client = this.getClient();
    await client.flushAll();
  }
}

// Default configuration
export const defaultRedisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};