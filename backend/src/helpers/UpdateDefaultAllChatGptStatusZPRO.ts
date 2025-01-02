import { TicketZPRO } from '../models/TicketZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface UpdateParams {
  tenantId: number;
  newDefaultValue: boolean;
}

const updateDefaultChatGptStatus = async ({
  tenantId,
  newDefaultValue
}: UpdateParams): Promise<void> => {
  const tickets = await TicketZPRO.findAll({
    where: {
      tenantId
    }
  });

  if (!tickets) {
    throw new AppErrorZPRO('ERR_NO_TICKET_FOUND', 404);
  }

  for (const ticket of tickets) {
    await ticket.update({
      chatgptStatus: newDefaultValue
    });
  }
};

export default updateDefaultChatGptStatus; 