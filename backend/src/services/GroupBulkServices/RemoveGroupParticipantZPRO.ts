import { logger } from "../../utils/loggerZPRO";
import { AppError } from "../../errors/AppErrorZPRO";
import GetTicketWbot from "../../helpers/GetTicketWbotByIdZPRO";
import { GroupChat } from "whatsapp-web.js";
import { Chat } from "whatsapp-web.js";
import { Client as WhatsappClient } from "whatsapp-web.js";

// Interface para o tipo de retorno do GetTicketWbot
interface WbotReturn extends WhatsappClient {
  getChats(): Promise<Chat[]>;
}

// Interface para os dados de entrada
interface RemoveParticipantData {
  participants: string[];
  whatsappId: number;
}

// Interface para resposta de erro
interface ErrorResponse {
  message: string;
  status: number;
}

// Constantes para mensagens de erro
const ERROR_MESSAGES = {
  REMOVE_PARTICIPANT: "ERR_REMOVE_PARTICIPANT_WAPP_GROUP",
  NO_GROUPS_FOUND: "NO_WHATSAPP_GROUPS_FOUND"
};

/**
 * Remove participantes de grupos do WhatsApp
 * @param participants Lista de números dos participantes
 * @param whatsappId ID da conexão do WhatsApp
 */
const RemoveGroupParticipant = async ({
  participants,
  whatsappId
}: RemoveParticipantData): Promise<void> => {
  try {
    // Obtém instância do cliente WhatsApp
    const wbot: WbotReturn = await GetTicketWbot(whatsappId);

    // Formata os números dos participantes
    const formattedParticipants = formatParticipants(participants);

    // Obtém os grupos
    const groups = await getWhatsAppGroups(wbot);

    // Valida se existem grupos
    validateGroups(groups);

    // Remove participantes de cada grupo
    await removeFromGroups(groups, formattedParticipants);

  } catch (err) {
    handleError(err);
  }
};

/**
 * Formata os números dos participantes adicionando @c.us
 */
const formatParticipants = (participants: string[]): string[] => {
  return participants.map(participant => {
    return participant.replace(/\D/g, '') + "@c.us";
  });
};

/**
 * Obtém lista de grupos do WhatsApp
 */
const getWhatsAppGroups = async (wbot: WbotReturn): Promise<Chat[]> => {
  const chats = await wbot.getChats();
  return chats.filter(chat => chat.isGroup);
};

/**
 * Valida se existem grupos
 */
const validateGroups = (groups: Chat[]): void => {
  if (groups.length === 0) {
    logger.info(ERROR_MESSAGES.NO_GROUPS_FOUND);
    throw new AppError(ERROR_MESSAGES.REMOVE_PARTICIPANT);
  }
};

/**
 * Remove participantes de cada grupo com delay
 */
const removeFromGroups = async (
  groups: Chat[], 
  participants: string[]
): Promise<void> => {
  groups.forEach((chat, index) => {
    const delay = calculateDelay(index);
    
    setTimeout(async () => {
      try {
        await removeParticipantsFromGroup(chat, participants);
      } catch (err) {
        logRemoveError(err);
        throw new AppError(ERROR_MESSAGES.REMOVE_PARTICIPANT);
      }
    }, delay);
  });
};

/**
 * Calcula delay para remoção baseado no índice
 */
const calculateDelay = (index: number): number => {
  const baseDelay = 2000;
  const randomFactor = Math.floor(Math.random() * 5);
  return baseDelay * (randomFactor + index + 1);
};

/**
 * Remove participantes de um grupo específico
 */
const removeParticipantsFromGroup = async (
  chat: Chat,
  participants: string[]
): Promise<void> => {
  if (chat instanceof GroupChat) {
    await chat.removeParticipants(participants);
  } else {
    throw new AppError(ERROR_MESSAGES.REMOVE_PARTICIPANT);
  }
};

/**
 * Loga erro na remoção de participantes
 */
const logRemoveError = (err: Error): void => {
  logger.info(
    `::: ZDG ::: Z-PRO ::: Comunidade ZDG - ${ERROR_MESSAGES.REMOVE_PARTICIPANT}: ${err}`
  );
};

/**
 * Trata erros gerais
 */
const handleError = (err: Error): never => {
  logger.info(`${ERROR_MESSAGES.REMOVE_PARTICIPANT}: ${err}`);
  throw new AppError(ERROR_MESSAGES.REMOVE_PARTICIPANT);
};

export default RemoveGroupParticipant; 