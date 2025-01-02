import { AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import { promises as fs } from 'fs';
import { join } from 'path';
import BaileysSessionsZPRO from '../models/BaileysSessionsZPRO';
import { logger } from '../utils/loggerZPRO';

interface AuthState {
  creds: AuthenticationState;
  keys: {
    get: (type: string, ids: string[]) => Promise<{ [key: string]: any }>;
    set: (data: SignalDataTypeMap) => Promise<void>;
  };
}

const useMultiFileAuthState = async (
  whatsapp: { id: number },
  folder: string
): Promise<{
  state: AuthState;
  saveCreds: () => Promise<void>;
}> => {
  const folderInfo = await fs.stat(folder).catch(() => undefined);

  if (folderInfo) {
    if (!folderInfo.isDirectory()) {
      throw new Error(
        `found something that is not a directory at ${folder}, either delete it or specify a different location`
      );
    }
  } else {
    await fs.mkdir(folder, { recursive: true });
  }

  const sanitizeFilename = (filename: string | null | undefined): string => {
    if (!filename) return '';
    return filename.replace(/\//g, '__').replace(/:/g, '-');
  };

  const writeData = async (data: any, file: string, isAuth: boolean) => {
    if (isAuth) {
      try {
        const session = await BaileysSessionsZPRO.default.findOne({
          where: {
            whatsappId: whatsapp.id,
            name: file
          }
        });

        const value = JSON.stringify(data, BufferJSON.replacer);

        if (session) {
          await session.update({ value });
        } else {
          await BaileysSessionsZPRO.default.create({
            whatsappId: whatsapp.id,
            value,
            name: file
          });
        }
      } catch (error) {
        logger.error('ZDG ::: Z-PRO ::: writeData error', error);
      }
    } else {
      try {
        await fs.writeFile(
          join(folder, sanitizeFilename(file)),
          JSON.stringify(data, BufferJSON.replacer)
        );
      } catch (error) {
        logger.error('ZDG ::: Z-PRO ::: writeData to file error', error);
      }
    }
  };

  const readData = async (file: string, isAuth: boolean) => {
    if (isAuth) {
      try {
        const session = await BaileysSessionsZPRO.default.findOne({
          where: {
            whatsappId: whatsapp.id,
            name: file
          }
        });

        if (session && session.value !== null) {
          return JSON.parse(JSON.stringify(session.value), BufferJSON.reviver);
        }
        return null;
      } catch {
        return null;
      }
    } else {
      try {
        const data = await fs.readFile(
          join(folder, sanitizeFilename(file)),
          { encoding: 'utf-8' }
        );
        return JSON.parse(data, BufferJSON.reviver);
      } catch {
        return null;
      }
    }
  };

  const removeData = async (file: string, isAuth: boolean) => {
    if (isAuth) {
      try {
        await BaileysSessionsZPRO.default.destroy({
          where: {
            whatsappId: whatsapp.id,
            name: file
          }
        });
      } catch (error) {
        logger.error('ZDG ::: Z-PRO ::: removeData', error);
      }
    } else {
      try {
        const filename = join(folder, sanitizeFilename(file));
        if (fs.existsSync(filename)) {
          await fs.unlink(filename);
        }
      } catch (error) {
        logger.error('ZDG ::: Z-PRO ::: removeData from file', error);
      }
    }
  };

  let creds = await readData('creds', true);
  if (!creds) {
    creds = initAuthCreds();
    await writeData(creds, 'creds', true);
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(
                `${type}-${id}.json`,
                type === 'creds'
              );
              if (type === 'app-state-sync-key' && value) {
                value = proto.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: SignalDataTypeMap) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              const isAuth = category === 'creds';
              tasks.push(
                value
                  ? writeData(value, file, isAuth)
                  : removeData(file, isAuth)
              );
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData(creds, 'creds', true);
    }
  };
};

export { useMultiFileAuthState }; 