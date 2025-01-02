import { getWbot } from "../libs/wbotZPRO";
import GetDefaultWhatsApp from "./GetDefaultWhatsAppZPRO";
import { Ticket } from "../models/Ticket"; // Você precisará criar/importar a interface Ticket

const GetTicketWbot = async (ticket: Ticket) => {
  if (!ticket.whatsappId) {
    const defaultWhatsApp = await GetDefaultWhatsApp(ticket.tenantId);
    await ticket.$set("whatsapp", defaultWhatsApp);
  }

  const wbot = getWbot(ticket.whatsappId);
  return wbot;
};

export default GetTicketWbot; 