import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDefaultChatGptStatusParams {
  tenantId: number;
  ticketId: number;
  newDefaultValue: boolean;
}

const updateDefaultChatGptStatus = async ({
  tenantId,
  ticketId,
  newDefaultValue
}: UpdateDefaultChatGptStatusParams): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: {
      id: ticketId,
      tenantId
    }
  });

  if (!ticket) {
    throw new AppError('ERR_NO_TICKET_FOUND', 404);
  }

  await ticket.update({
    chatgptStatus: newDefaultValue
  });
};

export default updateDefaultChatGptStatus; 