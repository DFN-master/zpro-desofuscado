import { Request } from 'express';
import TicketZPRO from '../models/TicketZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface UpdateDefaultDialogFlowStatusData {
  tenantId: number;
  ticketId: number;
  newDefaultValue: boolean;
}

const updateDefaultDialogFlowStatus = async ({
  tenantId,
  ticketId,
  newDefaultValue
}: UpdateDefaultDialogFlowStatusData): Promise<void> => {
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
    dialogflowStatus: newDefaultValue
  });
};

export default updateDefaultDialogFlowStatus; 