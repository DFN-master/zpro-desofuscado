import { Contact } from "../../models/ContactZPRO";
import { Ticket } from "../../models/TicketZPRO";
import { Message } from "../../models/MessageZPRO";
import AppError from "../../errors/AppErrorZPRO";

interface DeleteDuplicateContactRequest {
  tenantId: number;
}

interface DeletedContact {
  contactId: number;
  number: string;
}

interface UpdatedTicket {
  ticketId: number;
  newContactId: number;
}

interface UpdatedMessage {
  messageId: number;
  newTicketId: number;
}

interface DeleteDuplicateResponse {
  removedContacts: DeletedContact[];
  updatedTickets: UpdatedTicket[];
  updatedMessages: UpdatedMessage[];
}

const DeleteDuplicateContact = async ({
  tenantId
}: DeleteDuplicateContactRequest): Promise<DeleteDuplicateResponse> => {
  // Buscar todos os contatos do tenant com suas informações relacionadas
  const contacts = await Contact.findAll({
    where: { tenantId },
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  const removedContacts: DeletedContact[] = [];
  const updatedTickets: UpdatedTicket[] = [];
  const updatedMessages: UpdatedMessage[] = [];

  // Agrupar contatos por número
  const contactsByNumber = contacts.reduce((acc: any, contact) => {
    if (!acc[contact.number]) {
      acc[contact.number] = [];
    }
    acc[contact.number].push(contact);
    return acc;
  }, {});

  // Processar cada grupo de contatos duplicados
  for (const number in contactsByNumber) {
    const duplicates = contactsByNumber[number];

    if (duplicates.length > 1) {
      // Ordenar por createdAt para manter o mais antigo
      duplicates.sort((a: Contact, b: Contact) => a.createdAt - b.createdAt);
      
      const primaryContact = duplicates[0];
      const duplicateContacts = duplicates.slice(1);

      // Verificar tickets do contato principal
      const primaryTicket = await Ticket.findOne({
        where: { contactId: primaryContact.id },
        order: [["createdAt", "DESC"]]
      });

      if (!primaryTicket) {
        throw new AppError("ERR_NO_TICKET_FOUND", 404);
      }

      const primaryTicketId = primaryTicket.id;

      // Processar cada contato duplicado
      for (const duplicateContact of duplicateContacts) {
        const duplicateTickets = await Ticket.findAll({
          where: { contactId: duplicateContact.id }
        });

        if (duplicateTickets.length === 0) {
          // Se não houver tickets, apenas remove o contato
          removedContacts.push({
            contactId: duplicateContact.id,
            number: duplicateContact.number
          });
          await duplicateContact.destroy();
          
        } else {
          // Atualizar tickets e mensagens
          for (const ticket of duplicateTickets) {
            const messages = await Message.findAll({
              where: { ticketId: ticket.id }
            });

            // Atualizar mensagens para o ticket principal
            for (const message of messages) {
              await message.update({ ticketId: primaryTicketId });
              updatedMessages.push({
                messageId: message.id,
                newTicketId: primaryTicketId
              });
            }

            // Atualizar ticket para o contato principal
            await ticket.update({ contactId: primaryContact.id });
            updatedTickets.push({
              ticketId: ticket.id,
              newContactId: primaryContact.id
            });
          }

          // Remover contato duplicado
          removedContacts.push({
            contactId: duplicateContact.id,
            number: duplicateContact.number
          });
          await duplicateContact.destroy();
        }
      }
    }
  }

  return {
    removedContacts,
    updatedTickets,
    updatedMessages
  };
};

export default DeleteDuplicateContact; 