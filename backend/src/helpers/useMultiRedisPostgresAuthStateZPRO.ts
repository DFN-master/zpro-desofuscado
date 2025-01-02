import { AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys'
import { cacheLayer } from '../libs/cacheZPRO'
import BaileysSessionsZPRO from '../models/BaileysSessionsZPRO'
import { logger } from '../utils/loggerZPRO'

interface WhatsAppId {
  id: string
}

interface AuthState {
  creds: AuthenticationState
  keys: {
    get: (type: string, ids: string[]) => Promise<{ [key: string]: any }>
    set: (data: SignalDataTypeMap) => Promise<void>
  }
}

const useMultiRedisPostgresAuthState = async (whatsapp: WhatsAppId): Promise<{
  state: AuthState
  saveCreds: () => Promise<void>
}> => {
  const writeDataToRedis = async (data: any, key: string): Promise<void> => {
    try {
      await cacheLayer.set(
        `sessions:${whatsapp.id}:${key}`,
        JSON.stringify(data, BufferJSON.replacer)
      )
    } catch (error) {
      logger.warn('Z-PRO ::: writeDataToRedis error', error)
    }
  }

  const readDataFromRedis = async (key: string): Promise<any> => {
    try {
      const data = await cacheLayer.get(`sessions:${whatsapp.id}:${key}`)
      if (data === null) return null
      return JSON.parse(data, BufferJSON.reviver)
    } catch (error) {
      logger.warn('Z-PRO ::: readDataFromRedis error', error)
      return null
    }
  }

  const removeDataFromRedis = async (key: string): Promise<void> => {
    try {
      await cacheLayer.del(`sessions:${whatsapp.id}:${key}`)
    } catch (error) {
      logger.warn('Z-PRO ::: removeDataFromRedis error', error)
    }
  }

  const writeDataToDatabase = async (data: any, key: string): Promise<void> => {
    try {
      const session = await BaileysSessionsZPRO.findOne({
        where: { whatsappId: whatsapp.id, name: key }
      })

      if (session) {
        await session.update({
          value: JSON.stringify(data, BufferJSON.replacer)
        })
      } else {
        await BaileysSessionsZPRO.create({
          whatsappId: whatsapp.id,
          value: JSON.stringify(data, BufferJSON.replacer),
          name: key
        })
      }
    } catch (error) {
      logger.warn('Z-PRO ::: writeDataToDatabase error', error)
    }
  }

  const readDataFromDatabase = async (key: string): Promise<any> => {
    try {
      const session = await BaileysSessionsZPRO.findOne({
        where: { whatsappId: whatsapp.id, name: key }
      })

      if (session && session.value !== null) {
        return JSON.parse(JSON.stringify(session.value), BufferJSON.reviver)
      }
      return null
    } catch {
      return null
    }
  }

  const removeDataFromDatabase = async (key: string): Promise<void> => {
    try {
      await BaileysSessionsZPRO.destroy({
        where: { whatsappId: whatsapp.id, name: key }
      })
    } catch (error) {
      logger.warn('Z-PRO ::: removeDataFromDatabase error', error)
    }
  }

  let creds = await readDataFromDatabase('creds')
  if (!creds) {
    creds = initAuthCreds()
    await writeDataToDatabase(creds, 'creds')
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [key: string]: any } = {}
          await Promise.all(
            ids.map(async (id) => {
              let value = await readDataFromRedis(`${type}-${id}`)
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value)
              }
              data[id] = value
            })
          )
          return data
        },
        set: async (data: SignalDataTypeMap) => {
          const tasks: Promise<void>[] = []
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              const key = `${category}-${id}`
              const isCreds = category === 'creds'

              if (isCreds) {
                tasks.push(
                  value
                    ? writeDataToDatabase(value, key)
                    : removeDataFromDatabase(key)
                )
              } else {
                tasks.push(
                  value
                    ? writeDataToRedis(value, key)
                    : removeDataFromRedis(key)
                )
              }
            }
          }
          await Promise.all(tasks)
        }
      }
    },
    saveCreds: async () => {
      await writeDataToDatabase(creds, 'creds')
    }
  }
}

export { useMultiRedisPostgresAuthState } 