/**
 * Redis component main export
 */

export { RedisConnection, RedisConfig, defaultRedisConfig } from './config';
export { RegulationStorage } from './storage';
export { ChangeTracker, TimelineEntry, ChangeEvent } from './timeline';
export { ActionItemStorage } from './action-storage';

// Convenience class that combines all Redis functionality
import { RedisConnection, defaultRedisConfig } from './config';
import { RegulationStorage } from './storage';
import { ChangeTracker } from './timeline';
import { ActionItemStorage } from './action-storage';

export class RedisService {
  private connection: RedisConnection;
  public storage: RegulationStorage;
  public changeTracker: ChangeTracker;
  public actionStorage: ActionItemStorage;

  constructor(config = defaultRedisConfig) {
    this.connection = new RedisConnection(config);
    this.storage = new RegulationStorage(this.connection);
    this.changeTracker = new ChangeTracker(this.connection);
    this.actionStorage = new ActionItemStorage(this.connection);
  }

  async connect(): Promise<void> {
    await this.connection.connect();
  }

  async disconnect(): Promise<void> {
    await this.connection.disconnect();
  }

  async ping(): Promise<string> {
    return await this.connection.ping();
  }

  async flushAll(): Promise<void> {
    await this.connection.flushAll();
  }

  getConnection(): RedisConnection {
    return this.connection;
  }
}