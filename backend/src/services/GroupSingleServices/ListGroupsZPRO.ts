import { WASocket, GroupMetadata as BaileysGroupMetadata } from '@whiskeysockets/baileys';
import { AppError } from '../../errors/AppErrorZPRO';
import GetTicketWbot from '../../helpers/GetTicketWbotByIdZPRO';
import { getWbotBaileys } from '../../libs/wbot-baileysZPRO';
import { GroupsCache } from '../../utils/groupsZPRO';

// Interfaces
interface ListGroupsParams {
  whatsappId: number;
  channel: "baileys" | string;
}

interface GroupData {
  id: string;
  subject?: string;
  size?: number;
  participants?: {
    id: string;
    admin?: "admin" | "superadmin" | null;
    isAdmin?: boolean;
  }[];
  description?: string;
  owner?: string;
  creation?: number;
}

interface GroupMetadata {
  [key: string]: GroupData;
}

interface CacheData {
  timestamp: number;
  data: GroupData;
}

interface WbotReturn extends WASocket {
  getChats(): Promise<any[]>;
}

/**
 * Lista os grupos do WhatsApp baseado no canal especificado
 * @param whatsappId - ID da conexão WhatsApp
 * @param channel - Canal ("baileys" ou outro)
 * @returns Promise com lista de grupos ou chats
 */
const ListGroups = async ({
  whatsappId,
  channel
}: ListGroupsParams): Promise<GroupMetadata | any[]> => {
  
  // Tratamento para canal Baileys
  if (channel === "baileys") {
    const wbot = await getWbotBaileys(whatsappId.toString());

    if (!wbot) {
      throw new AppError("ERR_WBOT_NOT_FOUND");
    }

    try {
      // Busca todos os grupos que o bot participa
      const groups = Object.values(await wbot.groupFetchAllParticipating()) as BaileysGroupMetadata[];

      // Atualiza cache de grupos
      if (groups && groups.length > 0) {
        for (const [id, data] of Object.entries(groups)) {
          const cacheData: CacheData = {
            timestamp: new Date().getTime(),
            data: {
              id,
              subject: data.subject,
              size: data.size,
              participants: data.participants?.map(p => ({
                id: p.id,
                admin: p.admin,
                isAdmin: !!p.admin
              })),
              description: data.desc,
              owner: data.owner,
              creation: data.creation
            }
          };

          await GroupsCache.set(id, cacheData);
        }
      }

      return groups;

    } catch (err) {
      throw new AppError("ERR_LIST_WAPP_GROUP", "Erro ao listar grupos do WhatsApp");
    }
  } 
  
  // Tratamento para outros canais
  else {
    try {
      const wbot = await GetTicketWbot(whatsappId) as WbotReturn;
      
      if (!wbot?.getChats) {
        throw new AppError("ERR_WBOT_NOT_INITIALIZED");
      }

      const chats = await wbot.getChats();
      return chats;

    } catch (err) {
      throw new AppError(
        "ERR_LIST_WAPP_GROUP",
        "Erro ao listar chats do WhatsApp"
      );
    }
  }
};

export default ListGroups; 