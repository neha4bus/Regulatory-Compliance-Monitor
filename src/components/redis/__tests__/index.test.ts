/**
 * Tests for Redis service integration
 */

import { RedisService } from '../index';

// Mock the individual components
jest.mock('../config');
jest.mock('../storage');
jest.mock('../timeline');

const mockConnection = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  ping: jest.fn(() => Promise.resolve('PONG')),
  flushAll: jest.fn(),
};

const mockStorage = {
  saveRegulation: jest.fn(),
  getRegulation: jest.fn(),
};

const mockChangeTracker = {
  recordChange: jest.fn(),
  getTimeline: jest.fn(),
};

// Mock constructors
const MockRedisConnection = jest.fn(() => mockConnection);
const MockRegulationStorage = jest.fn(() => mockStorage);
const MockChangeTracker = jest.fn(() => mockChangeTracker);

// Apply mocks
require('../config').RedisConnection = MockRedisConnection;
require('../storage').RegulationStorage = MockRegulationStorage;
require('../timeline').ChangeTracker = MockChangeTracker;

describe('RedisService', () => {
  let redisService: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    redisService = new RedisService();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(MockRedisConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 6379,
        })
      );
      expect(MockRegulationStorage).toHaveBeenCalledWith(mockConnection);
      expect(MockChangeTracker).toHaveBeenCalledWith(mockConnection);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        host: 'custom-host',
        port: 6380,
        password: 'custom-password',
        db: 1,
      };

      new RedisService(customConfig);

      expect(MockRedisConnection).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('connect', () => {
    it('should connect to Redis', async () => {
      await redisService.connect();
      expect(mockConnection.connect).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      await redisService.disconnect();
      expect(mockConnection.disconnect).toHaveBeenCalled();
    });
  });

  describe('ping', () => {
    it('should ping Redis', async () => {
      const result = await redisService.ping();
      expect(result).toBe('PONG');
      expect(mockConnection.ping).toHaveBeenCalled();
    });
  });

  describe('flushAll', () => {
    it('should flush all data', async () => {
      await redisService.flushAll();
      expect(mockConnection.flushAll).toHaveBeenCalled();
    });
  });

  describe('getConnection', () => {
    it('should return connection instance', () => {
      const connection = redisService.getConnection();
      expect(connection).toBe(mockConnection);
    });
  });

  describe('storage property', () => {
    it('should provide access to storage functionality', () => {
      expect(redisService.storage).toBe(mockStorage);
    });
  });

  describe('changeTracker property', () => {
    it('should provide access to change tracking functionality', () => {
      expect(redisService.changeTracker).toBe(mockChangeTracker);
    });
  });
});