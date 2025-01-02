import ContactZPRO from '../models/ContactZPRO';
import SettingZPRO from '../models/SettingZPRO';
import ChatFlowZPRO from '../models/ChatFlowZPRO';
import CreateLogTicketServiceZPRO from '../services/CreateLogTicketServiceZPRO';
import IsContactTestZPRO from '../services/IsContactTestZPRO';
import ShowWhatsAppServiceZPRO from '../services/ShowWhatsAppServiceZPRO';

interface Ticket {
  id: number;
  tenantId: number;
  userId?: number;
  whatsappId: number;
  contactId: number;
  isGroup: boolean;
  isDeleted: boolean;
  channel: string;
  chatFlowId?: number;
  stepChatFlow?: string;
  update: (data: any) => Promise<void>;
}

const CheckChatBotFlowWelcome = async (ticket: Ticket): Promise<void> => {
  // Ignora se for grupo ou ticket deletado
  if (ticket.isGroup || ticket.isDeleted) return;

  // Busca configurações do bot
  const setting = await SettingZPRO.findOne({
    where: {
      key: 'botTicketActive',
      tenantId: ticket.tenantId
    }
  });

  // Busca WhatsApp
  const whatsapp = await ShowWhatsAppServiceZPRO({
    id: ticket.whatsappId,
    tenantId: ticket.tenantId
  });

  // Obtém ID do fluxo do chat
  const chatFlowId = whatsapp?.chatBot || setting?.value;
  if (!chatFlowId) return;

  // Busca fluxo do chat
  const chatFlow = await ChatFlowZPRO.findOne({
    where: {
      id: +chatFlowId,
      tenantId: ticket.tenantId,
      isActive: true,
      isDeleted: false
    }
  });

  if (!chatFlow) return;

  // Verifica contato
  const contact = await ContactZPRO.findByPk(ticket.contactId);
  const { celularTeste } = chatFlow;
  const contactNumber = contact?.number;

  // Verifica se é contato de teste
  if (await IsContactTestZPRO(contactNumber, celularTeste, ticket.channel)) {
    return;
  }

  // Encontra primeiro passo do fluxo
  const startStep = chatFlow.flow.lineList.find(line => line.type === 'start');

  // Atualiza ticket com informações do fluxo
  await ticket.update({
    chatFlowId: chatFlow.id,
    stepChatFlow: startStep.to,
    lastInteractionBot: new Date()
  });

  // Cria log do ticket
  await CreateLogTicketServiceZPRO({
    tenantId: ticket.tenantId,
    ticketId: ticket.id,
    type: 'chatBot'
  });
};

export default CheckChatBotFlowWelcome; 