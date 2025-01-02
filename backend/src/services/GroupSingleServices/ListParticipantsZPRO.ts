import { WAMessage, proto } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot-baileysZPRO";
import GetTicketWbot from "../../helpers/GetTicketWbotByIdZPRO";
import AppError from "../../errors/AppErrorZPRO";
import Whatsapp from "../../models/WhatsappZPRO";
import { logger } from "../../utils/loggerZPRO";
import GroupChat from "../../structures/GroupChat";

// Interfaces
interface Request {
  whatsappId: number;
  groupId: string;
}

interface Participant {
  id: string;
  admin?: "admin" | "superadmin" | null;
}

interface WhatsappData {
  id: number;
  name: string;
  status?: string;
  type: string;
  number: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GroupData {
  id: string;
  subject?: string;
  creation?: number;
  owner?: string;
  desc?: string;
  participants: Participant[];
}

interface WbotReturn {
  groupFetchAllParticipating: () => Promise<{ [key: string]: GroupData }>;
  getChatById: (chatId: string) => Promise<GroupChat>;
}

/**
 * Lista os participantes de um grupo
 */
const ListParticipants = async ({
  whatsappId,
  groupId
}: Request): Promise<Participant[]> => {
  try {
    // Busca a conexão do WhatsApp pelo ID
    const whatsapp: WhatsappData | null = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new AppError("ERR_WHATSAPP_NOT_FOUND");
    }

    // Verifica o tipo de conexão
    if (whatsapp.type === "baileys") {
      // Para conexões Baileys
      const wbot: WbotReturn = await getWbot(whatsappId);
      const groupFetch = await wbot.groupFetchAllParticipating();

      try {
        const group = groupFetch[groupId];
        if (group) {
          return group.participants;
        } else {
          throw new AppError("ERR_GROUP_NOT_FOUND");
        }
      } catch (err) {
        logger.error(`::: ZDG ::: Z-PRO ::: ERR_LIST_PARTICIPANT_WAPP_GROUP: ${err}`);
        throw new AppError("ERR_LIST_PARTICIPANT_WAPP_GROUP");
      }
    } else {
      // Para outros tipos de conexão
      const wbot: WbotReturn = await GetTicketWbot(whatsappId);

      try {
        const chat = await wbot.getChatById(groupId);
        
        if (chat instanceof GroupChat) {
          const participants = chat.participants;
          return participants;
        } else {
          throw new AppError("ERR_LIST_PARTICIPANT_WAPP_GROUP");
        }
      } catch (err) {
        logger.error(`::: ZDG ::: Z-PRO ::: ERR_LIST_PARTICIPANT_WAPP_GROUP: ${err}`);
        throw new AppError("ERR_LIST_PARTICIPANT_WAPP_GROUP");
      }
    }
  } catch (error) {
    logger.error(`ListParticipants Service Error: ${error}`);
    throw new AppError(
      "Error fetching group participants. Check system logs for more details."
    );
  }
};

export default ListParticipants; 