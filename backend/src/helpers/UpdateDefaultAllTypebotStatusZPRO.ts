import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDefaultTypebotStatusParams {
  tenantId: number;
  newDefaultValue: boolean;
}

const updateDefaultTypebotStatus = async ({
  tenantId,
  newDefaultValue
}: UpdateDefaultTypebotStatusParams): Promise<void> => {
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
      typebotStatus: newDefaultValue
    });
  }
};

export default updateDefaultTypebotStatus; 