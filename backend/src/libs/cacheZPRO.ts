import Redis from 'ioredis';
import * as crypto from 'crypto';

interface RedisConfig {
  port: number;
  host: string;
  db: number;
  password?: string;
}

const redisConfig: RedisConfig = {
  port: Number(process.env.IO_REDIS_PORT),
  host: process.env.IO_REDIS_SERVER || '',
  db: Number(process.env.IO_REDIS_DB_SESSION) || 0,
  password: process.env.IO_REDIS_PASSWORD
};

const redis = new Redis(redisConfig);

function encryptParams(params: any): string {
  const jsonString = JSON.stringify(params);
  return crypto.createHash('sha256').update(jsonString).digest('base64');
}

async function setFromParams(
  prefix: string,
  params: any,
  value: any,
  expireTime?: number,
  flag?: string
): Promise<'OK' | null> {
  const key = `${prefix}:${encryptParams(params)}`;
  
  if (expireTime !== undefined && flag !== undefined) {
    return redis.set(key, value, expireTime, flag);
  }
  return redis.set(key, value);
}

async function getFromParams(prefix: string, params: any): Promise<string | null> {
  const key = `${prefix}:${encryptParams(params)}`;
  return redis.get(key);
}

async function delFromParams(prefix: string, params: any): Promise<number> {
  const key = `${prefix}:${encryptParams(params)}`;
  return redis.del(key);
}

async function set(
  key: string,
  value: any,
  expireTime?: number,
  flag?: string
): Promise<'OK' | null> {
  if (expireTime !== undefined && flag !== undefined) {
    return redis.set(key, value, expireTime, flag);
  }
  return redis.set(key, value);
}

async function get(key: string): Promise<string | null> {
  return redis.get(key);
}

async function getKeys(pattern: string): Promise<string[]> {
  return redis.keys(pattern);
}

async function del(key: string): Promise<number> {
  return redis.del(key);
}

async function delFromPattern(pattern: string): Promise<void> {
  const keys = await getKeys(pattern);
  for (const key of keys) {
    await del(key);
  }
}

export {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
};

export default {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
}; 