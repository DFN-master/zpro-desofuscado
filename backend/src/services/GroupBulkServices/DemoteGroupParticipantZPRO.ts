import { logger } from "../../utils/loggerZPRO";
import { AppError } from "../../errors/AppErrorZPRO";
import GetTicketWbot from "../../helpers/GetTicketWbotByIdZPRO";
import GroupChat from "../../models/GroupChat";
import { WAMessage, GroupParticipant } from "@whiskeysockets/baileys";

// Interface para o request
interface DemoteGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
}

// Interface para resposta de erro
interface ErrorResponse {
  message: string;
  status: number;
}

// Interface para participante do grupo
interface GroupParticipantData extends GroupParticipant {
  id: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

class DemoteGroupParticipantService {
  // Método para validar participantes
  private validateParticipants(participants: string[]): void {
    if (!participants || participants.length === 0) {
      throw new AppError("Participants list cannot be empty");
    }

    participants.forEach(participant => {
      if (!participant || typeof participant !== "string") {
        throw new AppError("Invalid participant format");
      }
    });
  }

  // Método para formatar números dos participantes
  private formatParticipants(participants: string[]): string[] {
    return participants.map(participant => {
      const cleaned = participant.replace(/\D/g, "");
      return `${cleaned}@c.us`;
    });
  }

  // Método para verificar se usuário é admin
  private async checkAdminPermissions(
    groupChat: GroupChat,
    participantId: string
  ): Promise<boolean> {
    try {
      const participant = await groupChat.getParticipantInfo(participantId);
      return participant?.isAdmin || participant?.isSuperAdmin || false;
    } catch (err) {
      logger.error(`Error checking admin permissions: ${err}`);
      return false;
    }
  }

  // Método principal para remover admin
  public async execute({
    participants,
    whatsappId
  }: DemoteGroupParticipantRequest): Promise<void> {
    // Validação inicial
    this.validateParticipants(participants);

    // Obtém instância do WhatsApp
    const wbot = await GetTicketWbot(whatsappId);

    try {
      // Formata números dos participantes
      const formattedParticipants = this.formatParticipants(participants);

      // Obtém chats
      const chats = await wbot.getChats();
      const groupChats = chats.filter(chat => chat.isGroup);

      // Verifica se existem grupos
      if (groupChats.length === 0) {
        logger.info(":::ZDG ::: Z-PRO ::: Comunidade ZDG - 0 groups.");
        return;
      }

      // Processa cada grupo
      await Promise.all(
        groupChats.map(async (groupChat, index) => {
          // Delay escalonado para cada grupo
          await new Promise(resolve => {
            setTimeout(async () => {
              try {
                if (groupChat instanceof GroupChat) {
                  // Verifica permissões antes de remover admin
                  const canDemote = await Promise.all(
                    formattedParticipants.map(async participant =>
                      this.checkAdminPermissions(groupChat, participant)
                    )
                  );

                  if (canDemote.every(permission => permission)) {
                    await groupChat.demoteParticipants(formattedParticipants);
                    logger.info(
                      `Successfully demoted participants in group: ${groupChat.id}`
                    );
                  } else {
                    logger.warn(
                      `Insufficient permissions to demote in group: ${groupChat.id}`
                    );
                  }
                } else {
                  throw new AppError("Invalid group chat instance");
                }
                resolve(true);
              } catch (err) {
                logger.error(`Error in group ${groupChat.id}: ${err}`);
                resolve(false);
              }
            }, 1000 * Math.floor(Math.random() * 5 + index));
          });
        })
      );

    } catch (err) {
      logger.error(`:::ZDG ::: Comunidade ZDG - ERR_DEMOTE_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_DEMOTE_PARTICIPANT_WAPP_GROUP");
    }
  }

  // Método para recuperar status da operação
  public async getOperationStatus(groupId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Implementação do status
      return {
        success: true,
        message: "Operation completed successfully"
      };
    } catch (err) {
      return {
        success: false,
        message: `Operation failed: ${err.message}`
      };
    }
  }
}

// Instância do serviço
const demoteGroupParticipantService = new DemoteGroupParticipantService();

// Função wrapper para manter compatibilidade com código existente
const DemoteGroupParticipant = async (
  request: DemoteGroupParticipantRequest
): Promise<void> => {
  await demoteGroupParticipantService.execute(request);
};

export default DemoteGroupParticipant; 