import { TicketZPRO } from '../models/TicketZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface UpdateDefaultTypebotStatusParams {
  tenantId: number;
  ticketId: number;
  newDefaultValue: boolean;
}

const updateDefaultTypebotStatus = async ({
  tenantId,
  ticketId,
  newDefaultValue
}: UpdateDefaultTypebotStatusParams): Promise<void> => {
  const ticket = await TicketZPRO.findOne({
    where: {
      id: ticketId,
      tenantId
    }
  });

  if (!ticket) {
    throw new AppErrorZPRO('ERR_NO_TICKET_FOUND', 404);
  }

  await ticket.update({
    typebotStatus: newDefaultValue
  });
};

export default updateDefaultTypebotStatus; 