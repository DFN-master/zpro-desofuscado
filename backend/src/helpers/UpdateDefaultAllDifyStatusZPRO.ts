import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDifyStatusParams {
  tenantId: number;
  newDefaultValue: boolean;
}

const updateDefaultDifyStatus = async ({
  tenantId,
  newDefaultValue
}: UpdateDifyStatusParams): Promise<void> => {
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
      difyStatus: newDefaultValue
    });
  }
};

export default updateDefaultDifyStatus; 