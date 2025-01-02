import { TicketZPRO } from '../models/TicketZPRO';
import { AppErrorZPRO } from '../errors/AppErrorZPRO';

interface UpdateDefaultDialogFlowStatusParams {
  tenantId: number;
  newDefaultValue: boolean;
}

const updateDefaultDialogFlowStatus = async ({
  tenantId,
  newDefaultValue
}: UpdateDefaultDialogFlowStatusParams): Promise<void> => {
  const tickets = await TicketZPRO.findAll({
    where: { tenantId }
  });

  if (!tickets) {
    throw new AppErrorZPRO('ERR_NO_TICKET_FOUND', 404);
  }

  for (const ticket of tickets) {
    await ticket.update({
      dialogflowStatus: newDefaultValue
    });
  }
};

export default updateDefaultDialogFlowStatus; 