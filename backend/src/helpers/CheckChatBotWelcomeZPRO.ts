import { Message } from "../models/Message";
import Contact from "../models/ContactZPRO";
import ShowStepAutoReplyMessageService from "../services/AutoReplyServices/ShowStepAutoReplyMessageServiceZPRO";
import CreateLogTicketService from "../services/TicketServices/CreateLogTicketServiceZPRO";

interface AutoReplyData {
  autoReplyId: number;
  stepAutoReplyId: number;
}

interface LogTicketData {
  tenantId: number;
  ticketId: number;
  type: string;
}

const AutoReplyWelcome = async (message: Message): Promise<void> => {
  // Ignora mensagens de grupo ou chatbot
  if (message.isGroup || message.chatBot) {
    return;
  }

  // Busca configuração de auto-resposta
  const autoReply = await ShowStepAutoReplyMessageService.default(
    1, // step
    0, // queue 
    0, // userId
    true, // isFirstMessage
    message.tenantId
  );

  if (!autoReply) {
    return;
  }

  // Busca contato
  const contact = await Contact.default.findByPk(message.contactId);
  
  const { celularTeste } = autoReply.autoReply;
  const contactNumber = contact?.number;

  // Verifica número de teste
  if (celularTeste && 
      (contactNumber === null || 
       contactNumber === undefined || 
       contactNumber.indexOf(celularTeste.substr(1)) === -1) || 
      !contactNumber) {
    
    if (message.channel !== "telegram") {
      return;
    }
  }

  // Atualiza mensagem com dados da auto-resposta
  await message.update({
    autoReplyId: autoReply.autoReply.id,
    stepAutoReplyId: autoReply.id
  });

  // Cria log do ticket
  await CreateLogTicketService.default({
    tenantId: message.tenantId,
    ticketId: message.id,
    type: "chatBot"
  });
};

export default AutoReplyWelcome; 