import { logger } from "../utils/logger";
import { getWbot } from "../libs/wbot";
import Ticket from "../models/Ticket";
import Setting from "../models/Setting"; 
import Tenant from "../models/Tenant";
import Contact from "../models/Contact";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import socketEmit from "../helpers/socketEmit";

interface JobConfig {
  key: string;
  options: {
    repeat: {
      cron: string;
      tz: string;
    };
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
  handle(): Promise<void>;
}

const jobConfig: JobConfig = {
  key: "SendMessageAutoClose",
  options: {
    repeat: {
      cron: "*/20 * * * *", // A cada 20 minutos
      tz: "America/Sao_Paulo"
    },
    attempts: 10,
    backoff: {
      type: "fixed",
      delay: 60000 // 1 minuto
    }
  },

  async handle(): Promise<void> {
    logger.info("SendMessageAutoClose Initiated");

    try {
      const tenants = await Tenant.findAll({
        order: [["name", "ASC"]]
      });

      for (const tenant of tenants) {
        const tenantId = tenant.id;

        // Buscar configurações do tenant
        const autoCloseSetting = await Setting.findOne({
          where: {
            key: "autoClose",
            tenantId
          }
        });

        const autoCloseTimer = await Setting.findOne({
          where: {
            key: "autoCloseTimer", 
            tenantId
          }
        });

        const autoCloseMessage = await Setting.findOne({
          where: {
            key: "autoCloseMessage",
            tenantId
          }
        });

        // Verificar se autoClose está ativado
        if (autoCloseSetting?.value === "enabled") {
          const tickets = await Ticket.findAll({
            where: {
              tenantId,
              status: "open"
            }
          });

          for (const ticket of tickets) {
            const currentTime = Math.floor(new Date().getTime() / 1000);
            const lastMessageTime = Math.floor(ticket.lastMessageAt / 1000);
            const timer = autoCloseTimer ? 
              parseInt(autoCloseTimer.value) * 60 : 
              180; // 3 horas padrão

            if ((currentTime - lastMessageTime) > timer) {
              const message = autoCloseMessage?.value ?? 
                "Mensagem padrão de autoclose";

              if (ticket.whatsappId && ticket.lastCall) {
                const contact = await Contact.findOne({
                  where: { id: ticket.contactId }
                });

                try {
                  const wbot = getWbot(ticket.whatsappId);
                  const sentMessage = await wbot.sendMessage(
                    `${contact?.number}@c.us`,
                    message
                  );

                  // Atualizar status do ticket
                  await ticket.update({
                    status: "closed",
                    lastCall: false
                  });

                  // Emitir atualização via socket
                  const ticketData = await ShowTicketService({
                    id: ticket.id,
                    tenantId: ticket.tenantId
                  });

                  socketEmit({
                    tenantId: ticket.tenantId,
                    type: "ticket:update",
                    payload: ticketData
                  });

                } catch (err) {
                  logger.error("Error sending auto close message:", err);
                }
              } else {
                try {
                  await ticket.update({
                    status: "closed"
                  });

                  const ticketData = await ShowTicketService({
                    id: ticket.id,
                    tenantId: ticket.tenantId
                  });

                  socketEmit({
                    tenantId: ticket.tenantId,
                    type: "ticket:update", 
                    payload: ticketData
                  });

                } catch (err) {
                  logger.error("Error updating ticket status:", err);
                }
              }
            }
          }
        }
      }

    } catch (err) {
      logger.error("Error processing auto close job:", err);
    }

    logger.info("SendMessageAutoClose Finalized");
  }
};

export default jobConfig; 