import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDefaultN8NStatusParams {
  tenantId: string | number;
  newDefaultValue: boolean;
}

const updateDefaultN8NStatus = async ({
  tenantId,
  newDefaultValue
}: UpdateDefaultN8NStatusParams): Promise<void> => {
  const tickets = await Ticket.findAll({
    where: {
      tenantId
    }
  });

  if (!tickets) {
    throw new AppError('ERR_NO_TICKET_FOUND', 404);
  }

  for (const ticket of tickets) {
    await ticket.update({
      n8nStatus: newDefaultValue
    });
  }
};

export default updateDefaultN8NStatus; 