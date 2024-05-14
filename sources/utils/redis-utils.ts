import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

const redisUtils = {
  client: redisClient,
  init: async (host: string = 'localhost', port: number = 6379, password: string = ''): Promise<void> => {
    if (redisClient === null) {
      try {
        // Create Redis client
        redisClient = createClient({
          url: `redis://${host}:${port}`,
          password: password,
        });

        redisClient.on('error', (err) => console.log('Redis Client Error', err));

        // Connect to Redis server
        await redisClient.connect();
        console.log('Connected to Redis successfully');
      } catch (err) {
        console.error('Failed to connect to Redis:', err);
        redisClient = null;
      }
    }
  },
  get: async (key: string): Promise<string | null> => {
    if (!redisClient) {
      throw new Error('Redis client was not created. Ensure init() has been called.');
    }
    try {
      const value = await redisClient.get(key);
      return value;
    } catch (err) {
      throw err;
    }
  },
  set: async (key: string, value: string): Promise<void> => {
    if (!redisClient) {
      throw new Error('Redis client was not created. Ensure init() has been called.');
    }
    try {
      await redisClient.set(key, value);
    } catch (err) {
      throw err;
    }
  },
  del: async (key: string): Promise<void> => {
    if (!redisClient) {
      throw new Error('Redis client was not created. Ensure init() has been called.');
    }
    try {
      await redisClient.del(key);
    } catch (err) {
      throw err;
    }
  },
};

export default redisUtils;
