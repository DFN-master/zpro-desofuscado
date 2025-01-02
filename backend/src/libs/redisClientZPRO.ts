import Redis from 'ioredis';

interface RedisConfig {
  port: number;
  host: string;
  db: number;
  password?: string;
}

const config: RedisConfig = {
  port: Number(process.env.IO_REDIS_PORT),
  host: process.env.IO_REDIS_SERVER || '',
  db: Number(process.env.IO_REDIS_DB_SESSION) || 0,
  password: process.env.IO_REDIS_PASSWORD
};

export const redisClient = new Redis(config);

export const getValue = async (key: string): Promise<any> => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return String(data);
    }
  } catch (err) {
    throw err;
  }
};

export const setValue = async (key: string, value: any): Promise<any> => {
  try {
    const stringValue = typeof value === 'object' 
      ? JSON.stringify(value)
      : String(value);
      
    await redisClient.set(key, stringValue);
    return stringValue;
  } catch (err) {
    throw err;
  }
};

export const removeValue = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    throw err;
  }
};

export const removeKeysByPattern = async (pattern: string): Promise<void> => {
  const databases = 16; // Número padrão de databases Redis

  for (let db = 0; db < databases; db++) {
    await redisClient.select(db);
    let cursor = '0';

    do {
      const result = await new Promise<{cursor: string, keys: string[]}>((resolve, reject) => {
        redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
          (err, [nextCursor, keys]) => {
            if (err) return reject(err);
            if (!Array.isArray([nextCursor, keys])) {
              return reject(new Error('REDIS ERROR'));
            }
            
            resolve({
              cursor: nextCursor,
              keys: keys
            });
          }
        );
      });

      cursor = result.cursor;
      
      for (const key of result.keys) {
        await removeValue(key);
      }
    } while (cursor !== '0');
  }
}; 