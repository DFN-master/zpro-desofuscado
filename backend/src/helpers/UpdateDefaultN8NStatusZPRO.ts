import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDefaultN8NStatusParams {
  tenantId: number;
  ticketId: number;
  newDefaultValue: string;
}

const updateDefaultN8NStatus = async ({
  tenantId,
  ticketId,
  newDefaultValue
}: UpdateDefaultN8NStatusParams): Promise<void> => {
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
    n8nStatus: newDefaultValue
  });
};

export default updateDefaultN8NStatus; 