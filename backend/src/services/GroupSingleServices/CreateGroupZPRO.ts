import AppError from "../../errors/AppError";
import GetTicketWbotById from "../../helpers/GetTicketWbotById";
import { getWbotBaileys } from "../../libs/wbot-baileys";
import Whatsapp from "../../models/Whatsapp";
import { groupMetadataCache } from "../../helpers/groupsZPRO";
import logger from "../../utils/logger";

interface CreateGroupData {
  title: string;
  whatsappId: number;
  number: string;
}

interface WhatsappData {
  id: number;
  type: string;
}

const CreateGroup = async ({
  title,
  whatsappId,
  number
}: CreateGroupData): Promise<any> => {
  // Busca o Whatsapp pelo ID
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  // Verifica se é uma conexão Baileys
  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);
    
    // Formata o número para o padrão WhatsApp
    let formattedNumber = `${number.replace(/\D/g, "")}@s.whatsapp.net`;

    try {
      // Cria o grupo
      const groupData = await wbot.groupCreate(title, [formattedNumber]);

      // Se o grupo foi criado com sucesso, armazena os metadados
      if (groupData) {
        await groupMetadataCache.set(groupData.id, {
          timestamp: new Date().getTime(),
          data: groupData
        });
      }

      return groupData;

    } catch (error) {
      logger.info(`::: ZDG ::: ERR_CREATE_GROUP_PARTICIPANT_WAPP_GROUP: ${error}`);
      throw new AppError("ERR_CREATE_GROUP_PARTICIPANT_WAPP_GROUP");
    }

  } else {
    // Para outros tipos de conexão
    const wbot = await GetTicketWbotById(whatsappId);
    
    // Formata o número para o padrão WhatsApp
    let formattedNumber = `${number.replace(/\D/g, "")}@c.us`;

    try {
      // Cria o grupo
      const groupData = await wbot.createGroup(title, [formattedNumber]);
      return groupData;

    } catch (error) {
      logger.info(`::: Z-PRO ::: ERR_CREATE_WAPP_GROUP: ${error}`);
      throw new AppError("APP_GROUP");
    }
  }
};

export default CreateGroup; 