import { 
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  proto,
  BufferJSON
} from '@whiskeysockets/baileys';
import { cacheLayer } from '../libs/cacheZPRO';
import { logger } from '../utils/loggerZPRO';

interface MultiRedisAuthStateConfig {
  id: string;
}

export const useMultiRedisAuthState = async (config: MultiRedisAuthStateConfig) => {
  const writeData = async (data: any, key: string): Promise<void> => {
    try {
      await cacheLayer.set(
        `sessions:${config.id}:${key}`,
        JSON.stringify(data, BufferJSON.replacer)
      );
    } catch (error) {
      logger.warn('Z-PRO ::: ZDG ::: writeData error', error);
      return Promise.resolve();
    }
  };

  const readData = async (key: string): Promise<any> => {
    try {
      const data = await cacheLayer.get(`sessions:${config.id}:${key}`) || '';
      return JSON.parse(data, BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  const removeData = async (key: string): Promise<void> => {
    try {
      await cacheLayer.del(`sessions:${config.id}:${key}`);
    } catch {
      // Ignore removal errors
    }
  };

  const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [key: string]: any } = {};
          
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );

          return data;
        },

        set: async (data: any): Promise<void> => {
          const tasks: Promise<void>[] = [];

          for (const type in data) {
            for (const id in data[type]) {
              const value = data[type][id];
              const key = `${type}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }

          await Promise.all(tasks);
        }
      }
    },
    
    saveCreds: () => {
      return writeData(creds, 'creds');
    }
  };
}; 