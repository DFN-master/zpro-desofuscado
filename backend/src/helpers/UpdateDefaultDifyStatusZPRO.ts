import { Ticket } from '../models/TicketZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateDefaultDifyStatusParams {
  tenantId: number;
  ticketId: number;
  newDefaultValue: boolean;
}

const updateDefaultDifyStatus = async ({
  tenantId,
  ticketId,
  newDefaultValue
}: UpdateDefaultDifyStatusParams): Promise<void> => {
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
    difyStatus: newDefaultValue
  });
};

export default updateDefaultDifyStatus; 