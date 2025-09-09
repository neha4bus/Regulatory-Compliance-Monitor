/**
 * Tests for Redis configuration and connection
 */

import { RedisConnection, defaultRedisConfig } from '../config';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    flushAll: jest.fn(),
    isOpen: true,
    on: jest.fn(),
  })),
}));

describe('RedisConnection', () => {
  let redisConnection: RedisConnection;

  beforeEach(() => {
    redisConnection = new RedisConnection(defaultRedisConfig);
  });

  afterEach(async () => {
    await redisConnection.disconnect();
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      await expect(redisConnection.connect()).resolves.not.toThrow();
    });

    it('should not reconnect if already connected', async () => {
      await redisConnection.connect();
      await expect(redisConnection.connect()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      await redisConnection.connect();
      await expect(redisConnection.disconnect()).resolves.not.toThrow();
    });
  });

  describe('ping', () => {
    it('should ping Redis successfully', async () => {
      await redisConnection.connect();
      const result = await redisConnection.ping();
      expect(result).toBe('PONG');
    });

    it('should throw error if not connected', async () => {
      const disconnectedConnection = new RedisConnection(defaultRedisConfig);
      await expect(disconnectedConnection.ping()).rejects.toThrow('Redis client is not connected');
    });
  });

  describe('getClient', () => {
    it('should return Redis client when connected', async () => {
      await redisConnection.connect();
      const client = redisConnection.getClient();
      expect(client).toBeDefined();
    });

    it('should throw error when not connected', () => {
      const disconnectedConnection = new RedisConnection(defaultRedisConfig);
      expect(() => disconnectedConnection.getClient()).toThrow('Redis client is not connected');
    });
  });

  describe('flushAll', () => {
    it('should flush all data', async () => {
      await redisConnection.connect();
      await expect(redisConnection.flushAll()).resolves.not.toThrow();
    });
  });
});

describe('defaultRedisConfig', () => {
  it('should have correct default values', () => {
    expect(defaultRedisConfig.host).toBe('localhost');
    expect(defaultRedisConfig.port).toBe(6379);
    expect(defaultRedisConfig.retryDelayOnFailover).toBe(100);
    expect(defaultRedisConfig.maxRetriesPerRequest).toBe(3);
  });

  it('should use environment variables when available', () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      REDIS_HOST: 'test-host',
      REDIS_PORT: '6380',
      REDIS_PASSWORD: 'test-password',
      REDIS_DB: '1',
    };

    // Re-import to get updated config
    jest.resetModules();
    const { defaultRedisConfig: updatedConfig } = require('../config');

    expect(updatedConfig.host).toBe('test-host');
    expect(updatedConfig.port).toBe(6380);
    expect(updatedConfig.password).toBe('test-password');

    process.env = originalEnv;
  });
});