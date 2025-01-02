import { Contact } from "../../models/Contact";
import AppError from "../../errors/AppError";
import Ticket from "../../models/TicketZPRO";
import { socketEmit } from "../../helpers/socket/EmitZPRO";

interface DeleteContactRequest {
  id: string | number;
  tenantId: string | number;
}

interface SocketEmitData {
  tenantId: string | number;
  type: string;
  payload: Contact;
}

const DeleteContactService = async ({
  id,
  tenantId
}: DeleteContactRequest): Promise<void> => {
  const errorMessages = {
    contactNotFound: "ERR_NO_CONTACT_FOUND 1",
    ticketExists: "ERR_CONTACT_TICKETS_REGISTERED",
    socketEventType: "contact:delete"
  };

  // Busca o contato
  const contact = await Contact.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!contact) {
    throw new AppError(errorMessages.contactNotFound, 404);
  }

  // Verifica se existe ticket associado ao contato
  const ticket = await Ticket.count({
    where: {
      contactId: id
    }
  });

  if (ticket) {
    throw new AppError(errorMessages.ticketExists, 400);
  }

  // Deleta o contato
  await contact.destroy();

  // Emite evento via socket
  const socketData: SocketEmitData = {
    tenantId,
    type: errorMessages.socketEventType,
    payload: contact
  };

  socketEmit(socketData);
};

export default DeleteContactService; 