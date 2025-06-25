import { CONFIG } from "../config";
import { createClient, RedisClientType } from 'redis';

type RedisValue = string | number | boolean | object | null;

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: CONFIG.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection retries exceeded');
          }
          return Math.min(retries * 50, 1000);
        }
      }
    });

    this.setupEventListeners();
    this.connect();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private setupEventListeners(): void {
    this.client.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });
  }

  private async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  public async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async set(key: string, value: RedisValue, options?: { ttl?: number }): Promise<void> {
    await this.ensureConnection();
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    if (options?.ttl) {
      await this.client.set(key, val, { EX: options.ttl });
    } else {
      await this.client.set(key, val);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    await this.ensureConnection();
    const data = await this.client.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async del(key: string): Promise<number> {
    await this.ensureConnection();
    return await this.client.del(key);
  }

  async reset(): Promise<string> {
    await this.ensureConnection();
    return await this.client.flushDb();
  }

  async getClient(): Promise<RedisClientType> {
    await this.ensureConnection();
    return this.client;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

// Export the singleton instance
export default RedisService.getInstance();
